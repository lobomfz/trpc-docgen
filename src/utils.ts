import type { AnyTRPCProcedure } from "@trpc/server";
import { type Schema, wrap } from "@typeschema/main";

const replacer = (_match: string, p1: string, p2: string) => {
	if (p1) return `-${p1.toLowerCase()}`;
	if (p2) return "/";
	return "";
};

export function normalizePath(path: string) {
	return `/${path.replace(/([A-Z])|(\.)(?=[^/])/g, replacer)}`;
}

export function acceptsBody(method: string) {
	return !(method === "get" || method === "delete");
}

export function isSchema(schema: any): schema is Schema {
	try {
		wrap(schema);
		return true;
	} catch (e) {
		return false;
	}
}

export function extractProcedureSchemas(
	procedure: AnyTRPCProcedure,
	name: string,
): {
	input: Schema;
	output: Schema;
} {
	// @ts-expect-error
	const { inputs, output } = procedure._def;

	const input = inputs[0];

	if (!isSchema(input) || !isSchema(output)) {
		throw new Error(`Invalid schema on procedure ${name}`);
	}

	return { input, output };
}
