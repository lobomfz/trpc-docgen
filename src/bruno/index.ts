import type { OpenAPIV3_1 } from "openapi-types";
import { brunoParser } from "./utils";
import path from "node:path";
import bruToJson from "@usebruno/lang/v2/src/bruToJson";
import jsonToBru from "@usebruno/lang/v2/src/jsonToBru";

// still needs a lot of work
async function createBrunoCollection(
	openApiSchema: OpenAPIV3_1.Document,
	outputDir: string,
) {
	if (!openApiSchema.paths) {
		throw new Error("No paths found in the OpenAPI schema");
	}

	const baseUrl = openApiSchema.servers?.[0]?.url || "http://localhost";

	await brunoParser.createBase(openApiSchema, outputDir);

	for (const [routePath, methods] of Object.entries(openApiSchema.paths)) {
		const folderName = routePath.split("/")[1];
		const folderPath = path.join(outputDir, folderName);

		if (!methods) {
			continue;
		}

		for (const [method, details] of Object.entries(methods)) {
			if (
				typeof details !== "object" ||
				!("operationId" in details) ||
				!details.operationId
			) {
				continue;
			}

			const name = details.operationId
				.replace(folderPath, "")
				.replace(`/${folderName}/`, "");

			const filePath = path.join(folderPath, `${name}.bru`);

			const titleName = (name.split("/").at(-1) ?? name)
				.replaceAll("-", " ")
				.replace("/", "");

			const existingFile = await Bun.file(filePath)
				.text()
				.catch(() => "");

			const parsedExistingFile = bruToJson(existingFile);

			if (parsedExistingFile.meta) {
				parsedExistingFile.meta = {
					...parsedExistingFile.meta,
					name: titleName,
					type: "http",
				};
			} else {
				parsedExistingFile.meta = {
					name: titleName,
					type: "http",
					seq: 1,
				};
			}

			parsedExistingFile.http = {
				auth: "inherit",
				...(parsedExistingFile.http ?? {}),
				method,
				url: parsedExistingFile.http?.url ?? `${baseUrl}${routePath}`,
				body: method === "get" ? "none" : "json",
			};

			if (details.requestBody) {
				if ("content" in details.requestBody) {
					const data = details.requestBody.content["application/json"];

					const { schema, example } = data;

					const sampleBody = example ?? brunoParser.generateSampleBody(schema);

					if (!parsedExistingFile.body) {
						parsedExistingFile.body = {};
					}

					const existingJson = JSON.parse(parsedExistingFile.body.json ?? "{}");

					const newJson = {
						...sampleBody,
						...existingJson,
					};

					parsedExistingFile.body.json = JSON.stringify(newJson, null, 2);
				}
			}

			if (details.parameters) {
				const parsedExistingParams = Object.fromEntries(
					(parsedExistingFile.params ?? []).map((param) => [
						param.name,
						param.value,
					]),
				);

				const newParams = Object.fromEntries(
					// @ts-expect-error
					Object.keys(details.parameters?.[0]?.schema?.properties).map(
						(key) => [key, ""],
					),
				);

				parsedExistingFile.params = Object.entries({
					...newParams,
					...parsedExistingParams,
				}).map(([name, value]) => ({
					name,
					value,
					type: "query",
					// enables everything for now
					enabled: true,
				}));
			}

			await Bun.write(filePath, jsonToBru(parsedExistingFile));
		}
	}
}
export { createBrunoCollection };
