import { Type } from "@sinclair/typebox";
import { initTRPC } from "@trpc/server";
import { generateTrpcDocs } from "../src";
import type { OpenApiMeta } from "../src/types/meta";

// this meta is also optional, but highly recommended
const t = initTRPC.meta<OpenApiMeta>().create();

const router = t.router;

const userRouter = router({
	// no need for a .meta, all meta properties are optional!
	getInfo: t.procedure
		.input(
			Type.Object({
				name: Type.String(),
			}),
		)
		.output(
			Type.Object({
				name: Type.String(),
				id: Type.Number(),
				age: Type.Number(),
			}),
		)
		.query(({ input }) => ({
			name: input.name,
			id: 1,
			age: 10,
		})),

	doStuff: t.procedure
		.meta({
			openapi: {
				// This request example will be used for for the OpenAPI Schema
				// and optionally for the bruno collection
				reqEx: {
					id: 127,
				},
			},
		})
		.input(
			Type.Object({
				id: Type.Number(),
			}),
		)
		.mutation(({ input }) => ({
			id: input.id,
		})),
});

const appRouter = router({
	user: userRouter,

	createDate: t.procedure
		.meta({
			openapi: {
				// will be ignored since we're in blacklistedOnly mode
				enabled: false,
			},
		})
		.input(
			Type.Object({
				date: Type.String(),
			}),
		)
		.mutation(({ input }) => ({
			date: input.date,
		})),
});

// This mappings can be used for a transparent openapi router with [elysia-trpc](https://github.com/lobomfz/elysia-trpc)
const { document, mappings } = await generateTrpcDocs(appRouter, {
	// Will be removed from the path, e.g.:
	// timeUtils.getDate -> /time-utils/date
	wordsToRemove: ["get", "create", "info"],
	baseUrl: "http://localhost:3000",
	title: "My API",
	description: "My API description",
	version: "1.0.0",
	// Creates a bruno collection
	bruno: {
		outputDir: "./example/bruno",
	},
	blacklistedOnly: true,
});

Bun.write("./example/openapi.json", JSON.stringify(document, null, 2));
