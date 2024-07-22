import type { AnyTRPCProcedure, AnyTRPCRouter } from "@trpc/server";
import type { OpenAPIV3_1 } from "openapi-types";
import type { GenerateOpenApiDocumentOptions, OpenApiMeta } from "./types/meta";
import { extractProcedureSchemas } from "./utils";
import { parseInputSchema, parseOutputSchema } from "./parse";
import { getProcedureDetails } from "./procedure";

export async function buildPaths(
	appRouter: AnyTRPCRouter,
	securitySchemeNames: string[],
	opts: GenerateOpenApiDocumentOptions,
) {
	const pathsObject: OpenAPIV3_1.PathsObject = {};

	const procedures = appRouter._def.procedures as Record<
		string,
		AnyTRPCProcedure
	>;

	for (const [_path, procedure] of Object.entries(procedures)) {
		const openapi = (procedure._def?.meta as any)
			?.openapi as OpenApiMeta["openapi"];

		if ((!openapi && !opts.blacklistedOnly) || openapi?.enabled === false)
			continue;

		const type = procedure._def.type;

		if (type === "subscription") {
			continue;
		}

		const { procedureName, path, headerParameters, httpMethod, contentTypes } =
			getProcedureDetails(_path, procedure, openapi, opts.wordsToRemove);

		if (pathsObject[path]?.[httpMethod]) {
			throw new Error(`Duplicate path: ${path}`);
		}

		const schemas = extractProcedureSchemas(procedure, procedureName);

		const inputData = await parseInputSchema({
			schema: schemas.input,
			example: openapi?.example?.request,
			contentTypes,
			headerParameters,
			method: httpMethod,
		});

		const responses = await parseOutputSchema({
			schema: schemas.output,
			example: openapi?.example?.response,
			headers: openapi?.responseHeaders,
		});

		pathsObject[path] = {
			...pathsObject[path],
			[httpMethod]: {
				operationId: path.replace(/\./g, "-"),
				summary: openapi?.summary,
				description: openapi?.description,
				tags: openapi?.tags,
				security: openapi?.protect
					? securitySchemeNames.map((name) => ({ [name]: [] }))
					: undefined,
				...inputData,
				responses,

				...(openapi?.deprecated ? { deprecated: openapi.deprecated } : {}),
			},
		};
	}

	return pathsObject;
}
