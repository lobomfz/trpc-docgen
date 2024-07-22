import type { AnyTRPCProcedure, AnyTRPCRouter } from "@trpc/server";
import type { OpenAPIV3_1 } from "openapi-types";
import type { OpenApiMeta } from "./types/meta";
import { extractProcedureSchemas, normalizePath } from "./utils";
import { parseInputSchema } from "./parse";

const methodMap = {
	query: "get",
	mutation: "post",
	subscription: null,
} as const;

export async function buildPaths(
	appRouter: AnyTRPCRouter,
	securitySchemeNames: string[],
) {
	const pathsObject: OpenAPIV3_1.PathsObject = {};

	const procedures = appRouter._def.procedures as Record<
		string,
		AnyTRPCProcedure
	>;

	for (const [_path, procedure] of Object.entries(procedures)) {
		const openapi = (procedure._def?.meta as any)
			?.openapi as OpenApiMeta["openapi"];

		if (!openapi || openapi.enabled === false) continue;

		const type = procedure._def.type;

		if (type === "subscription") {
			continue;
		}

		const { procedureName, path, headerParameters, httpMethod, contentTypes } =
			getProcedureDetails(_path, procedure, openapi);

		if (pathsObject[path]?.[httpMethod]) {
			throw new Error(`Duplicate path: ${path}`);
		}

		const schemas = extractProcedureSchemas(procedure, procedureName);

		const inputData = await parseInputSchema({
			schema: schemas.input,
			example: openapi.example?.request,
			contentTypes,
			headerParameters,
			method: httpMethod,
		});

		pathsObject[path] = {
			...pathsObject[path],
			[httpMethod]: {
				operationId: path.replace(/\./g, "-"),
				summary: openapi.summary,
				description: openapi.description,
				tags: openapi.tags,
				security: openapi.protect
					? securitySchemeNames.map((name) => ({ [name]: [] }))
					: undefined,
				...inputData,
				// ...(onBody
				// 	? {
				// 			requestBody: inputData,
				// 		}
				// 	: {
				// 			parameters: inputData,
				// 		}),
				// ...obj,
				// responses: await getResponsesObject(
				//     outputParser,
				//     openapi.example?.response,
				//     openapi.responseHeaders,
				// ),
				...(openapi.deprecated ? { deprecated: openapi.deprecated } : {}),
			},
		};
	}

	return pathsObject;
}

function getProcedureDetails(
	path: string,
	procedure: AnyTRPCProcedure,
	openapi: NonNullable<OpenApiMeta["openapi"]>,
) {
	const httpMethod = openapi.method.toLocaleLowerCase() as Lowercase<
		typeof openapi.method
	>;

	if (!httpMethod)
		throw new Error(`Unsupported http method: ${openapi.method}`);

	const contentTypes = openapi.contentTypes || ["application/json"];

	const procedureName = `${procedure._def.type}.${path}`;

	if (contentTypes.length === 0) {
		throw new Error(`No content types specified for ${procedureName}`);
	}

	const normalizedPath = normalizePath(openapi.path);

	const headerParameters =
		openapi?.headers?.map((header) => ({ ...header, in: "header" as const })) ||
		[];

	return {
		procedureName,
		path: normalizedPath,
		headerParameters,
		httpMethod,
		contentTypes,
	};
}
