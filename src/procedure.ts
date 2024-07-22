import type { AnyTRPCProcedure } from "@trpc/server";
import type { OpenApiMeta } from "./types/meta";
import { normalizePath } from "./utils";

const typeMethodMap = {
	query: "get",
	mutation: "post",
	subscription: null,
} as const;

export function getProcedureDetails(
	path: string,
	procedure: AnyTRPCProcedure,
	openapi: OpenApiMeta["openapi"],
	wordsToRemove?: string[],
) {
	const httpMethod = typeMethodMap[procedure._def.type];

	if (!httpMethod)
		throw new Error(`Unsupported procedure method: ${procedure._def.type}`);

	const contentTypes = openapi?.contentTypes || ["application/json"];

	const procedureName = `${procedure._def.type}.${path}`;

	if (contentTypes.length === 0) {
		throw new Error(`No content types specified for ${procedureName}`);
	}

	const normalizedPath = normalizePath(openapi?.path ?? path, wordsToRemove);

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
