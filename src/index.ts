import type { AnyTRPCRouter } from "@trpc/server";
import type { GenerateOpenApiDocumentOptions, OpenApiMeta } from "./types/meta";
import type { OpenAPIV3_1 } from "openapi-types";
import { buildPaths } from "./paths";
import { errorResponseObject } from "./error";

async function generateOpenApi(
	appRouter: AnyTRPCRouter,
	opts: GenerateOpenApiDocumentOptions,
): Promise<OpenAPIV3_1.Document> {
	const securitySchemes = opts.securitySchemes ?? {
		Authorization: {
			type: "http",
			scheme: "bearer",
		},
	};

	const paths = await buildPaths(appRouter, Object.keys(securitySchemes), opts);

	return {
		openapi: "3.1.0",
		info: {
			title: opts.title,
			description: opts.description,
			version: opts.version,
		},
		servers: [
			{
				url: opts.baseUrl,
			},
		],
		tags: opts.tags?.map((tag) => ({ name: tag })),
		externalDocs: opts.docsUrl ? { url: opts.docsUrl } : undefined,
		paths,
		components: {
			securitySchemes,
			responses: {
				error: errorResponseObject,
			},
		},
	};
}

export { generateOpenApi, type OpenApiMeta };
