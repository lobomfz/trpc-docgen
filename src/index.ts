import type { AnyTRPCRouter } from "@trpc/server";
import { errorResponseObject } from "./error";
import { buildPaths } from "./paths";
import type { GenerateOpenApiDocumentOptions, OpenApiMeta } from "./types/meta";
import { createBrunoCollection } from "./bruno";
/**
 * Converts a TRPC router to an OpenAPI schema infered from the procedure schemas.
 *
 * Returns the OpenAPI Schema (document) and mappings between the converted paths and the original paths
 *
 * Creates a bruno collection on the outputDir if opts.bruno is set
 */
async function generateTrpcDocs(
	appRouter: AnyTRPCRouter,
	opts: GenerateOpenApiDocumentOptions,
) {
	const securitySchemes = opts.securitySchemes ?? {
		Authorization: {
			type: "http",
			scheme: "bearer",
		},
	};

	const { paths, mappings } = await buildPaths(
		appRouter,
		Object.keys(securitySchemes),
		opts,
	);

	const document = {
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

	if (opts.bruno) {
		await createBrunoCollection(document, opts.bruno.outputDir);
	}

	return {
		document,
		mappings,
	};
}

export { generateTrpcDocs, type OpenApiMeta };
