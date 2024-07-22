import { type Schema, toJSONSchema } from "@typeschema/main";
import type { OpenAPIV3_1 } from "openapi-types";
import type { OpenApiContentType, OpenApiMeta } from "./types/meta";

export async function parseInputSchema(data: {
	schema: Schema;
	example?: Record<string, any>;
	contentTypes?: OpenApiContentType[];
	headerParameters: NonNullable<OpenApiMeta["openapi"]>["headers"];
	method: Lowercase<NonNullable<OpenApiMeta["openapi"]>["method"]>;
}): Promise<OpenAPIV3_1.OperationObject | OpenAPIV3_1.ParameterObject[]> {
	const { schema, example, contentTypes, headerParameters, method } = data;

	const jsonSchema = await toJSONSchema(schema);
	const content: OpenAPIV3_1.RequestBodyObject["content"] = {};

	for (const contentType of contentTypes ?? ["application/json"]) {
		content[contentType] = {
			schema: jsonSchema as any,
			example,
		};
	}

	if (method === "post") {
		return {
			requestBody: {
				content,
				required: !!jsonSchema.required?.length,
			},
		};
	}

	return {
		parameters: [
			{
				in: "query",
				name: "query",
				schema: jsonSchema as any,
			},
		],
	};
}
