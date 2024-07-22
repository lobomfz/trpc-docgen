import { initTRPC, type AnyTRPCRouter } from "@trpc/server";
import type { GenerateOpenApiDocumentOptions, OpenApiMeta } from "./types/meta";
import type { OpenAPIV3_1 } from "openapi-types";
import { buildPaths } from "./paths";
import { z } from "zod";

const t = initTRPC.meta<OpenApiMeta>().context<any>().create();

const openApiVersion = "3.1.0";

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

	const paths = await buildPaths(appRouter, Object.keys(securitySchemes));

	return {
		openapi: openApiVersion,
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
		},
	};
}

const appRouter = t.router({
	okInput: t.procedure
		.meta({ openapi: { method: "POST", path: "/ok-input" } })
		.input(
			z.object({
				age: z.number().min(0).max(122),
				test: z.string(),
				anotherName: z.string().nullish(),
			}),
		)
		.output(z.object({ name: z.string() }))
		.query(() => ({ name: "James" })),
});

const openApiDocument = await generateOpenApi(appRouter, {
	title: "tRPC OpenAPI",
	version: "1.0.0",
	baseUrl: "http://localhost:3000/api",
});

console.log(JSON.stringify(openApiDocument, null, 2));
