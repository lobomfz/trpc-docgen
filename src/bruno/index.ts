import * as path from "node:path";
import type { OpenAPIV3_1 } from "openapi-types";
import type { BrunoFile } from "../types/bruno";
import {
	createCollection,
	generateBrunoFileContent,
	generateSampleBody,
} from "./utils";

// TODOS:
// - delete unused routes if setting is enabled
// - setting to not overwrite body

// this is terrible and should be rewritten
async function createBrunoCollection(
	openApiSchema: OpenAPIV3_1.Document,
	outputDir: string,
) {
	if (!openApiSchema.paths) {
		throw new Error("No paths found in the OpenAPI schema");
	}

	const baseUrl = openApiSchema.servers?.[0]?.url || "http://localhost";

	await createCollection(openApiSchema.info.title, outputDir);

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

			const fileName = `${name}.bru`;

			const smallName = name.split("/").at(-1) ?? name;

			const brunoFile: BrunoFile = {
				meta: {
					name: smallName.replaceAll("-", " ").replace("/", ""),
					type: "http",
					seq: 1,
				},
				method: method.toUpperCase(),
				url: `${baseUrl}${routePath}`,
				auth: "none",
			};

			if (details.requestBody) {
				brunoFile.body = "json";

				if ("content" in details.requestBody) {
					const data = details.requestBody.content["application/json"];

					const { schema, example } = data;

					const sampleBody = example ?? generateSampleBody(schema);

					brunoFile.bodyJson = JSON.stringify(sampleBody, null, 2);
				}
			}

			const brunoContent = generateBrunoFileContent(brunoFile);

			const filePath = path.join(folderPath, fileName);

			await Bun.write(filePath, brunoContent);
		}
	}
}

export { createBrunoCollection };
