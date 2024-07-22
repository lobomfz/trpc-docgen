# trpc-openapi-typeschema (WIP)

heavily based on [package-trpc-swagger](https://github.com/Vercjames/package-trpc-swagger)

## Goals:

- Support all libraries from [typeschema](https://typeschema.com/)
- Target OpenAPI 3.1.0
- Support Elysia + Bun
- Ignore superjson in the new router
- Generate [bruno](https://www.usebruno.com/) definitions
- Blacklisted-only mode: generate all procedures, even without a .meta (!!), following the pattern:

```
  subRouter.getDate -> /sub-router/get-date
```

- possibly use ts-morph to extract types to remove schema dependency
