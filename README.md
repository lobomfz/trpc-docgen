# trpc-openapi-typeschema (WIP)

heavily based on [package-trpc-swagger](https://github.com/Vercjames/package-trpc-swagger)

# Notes:
- This requires a patched version of tRPC, see [this PR](https://github.com/trpc/trpc/pull/5909).
- Bruno collection generation is a WIP but should work for basic use cases.

## Features:

- Targets Bun
- Supports all libraries from [typeschema](https://typeschema.com/)
- Targets OpenAPI 3.1.0
- Creates a restful OpenAPI schema
- Generates [bruno](https://www.usebruno.com/) definitions
- Blacklisted-only mode: generate all procedures, even without a .meta (!!), following the pattern:
```
  subRouter.getDate -> /sub-router/get-date
```
- Returns a map of the generated OpenAPI endpoints to the original procedure path for usage with [elysia-trpc](https://github.com/lobomfz/elysia-trpc)

## Usage:

### Router
if blacklistedOnly is enabled, all procedures will be generated, even if they don't have a .meta
```ts
import { initTRPC } from "@trpc/server";
import type { OpenApiMeta } from "../src/types/meta";
import { generateTrpcDocs } from "../src";
import { Type } from "@sinclair/typebox";

// this meta is also optional, but highly recommended
const t = initTRPC.meta<OpenApiMeta>().create();

const router = t.router;
```

### Main router
```ts
const appRouter = router({
	user: userRouter,

	createDate: t.procedure
		.meta({
			openapi: {
				// only this procedure will be ignored since we're in blacklistedOnly mode
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
```

### Subrouter
```ts
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

```


### The generated mappings can be used for a transparent openapi router with my patched [elysia-trpc](https://github.com/lobomfz/elysia-trpc)
```ts
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
```

### Check out this example's [generated schema](./example/openapi.json)

## TODO:

- use ts-morph to extract types to remove schema dependency
- better superjson support in the new router 
- Add more configs
