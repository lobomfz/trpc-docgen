import { initTRPC, type AnyTRPCRouter } from "@trpc/server";
import type { GenerateOpenApiDocumentOptions, OpenApiMeta } from "./types/meta";
import type { OpenAPIV3_1 } from "openapi-types";
import { buildPaths } from "./paths";
import { Type } from "@sinclair/typebox";

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

	const paths = await buildPaths(
		appRouter,
		Object.keys(securitySchemes),
		!!opts.blacklistedOnly,
	);

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

const inputSchema = Type.Object({
	id: Type.String(),
});

const outputSchema = Type.Object({
	name: Type.String(),
});

const subOutputSchema = Type.Object({
	date: Type.Date(),
});

const subRouter = t.router({
	getDate: t.procedure.output(subOutputSchema).query(() => ({
		date: new Date(),
	})),
});

const appRouter = t.router({
	getUserInfo: t.procedure
		.input(inputSchema)
		.output(outputSchema)
		.mutation(({ input }) => ({ name: "Matheus" })),

	subRouter,
});

const openApiDocument = await generateOpenApi(appRouter, {
	title: "tRPC OpenAPI",
	version: "1.0.0",
	baseUrl: "http://localhost:4000/openapi",
	blacklistedOnly: true,
});

console.log(JSON.stringify(openApiDocument, null, 2));
