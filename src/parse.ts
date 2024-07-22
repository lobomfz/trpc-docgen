import { type Schema, toJSONSchema } from "@typeschema/main";
import type { OpenAPIV3_1 } from "openapi-types";
import type { OpenApiContentType, OpenApiMeta } from "./types/meta";

export async function parseInputSchema(data: {
	schema?: Schema;
	example?: Record<string, any>;
	contentTypes?: OpenApiContentType[];
	headerParameters: NonNullable<OpenApiMeta["openapi"]>["headers"];
	method: "get" | "post";
}): Promise<OpenAPIV3_1.OperationObject | OpenAPIV3_1.ParameterObject[]> {
	const { schema, example, contentTypes, headerParameters, method } = data;

	if (!schema) return {};

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

export async function parseOutputSchema(data: {
	schema: Schema;
	example: Record<string, any> | undefined;
	headers:
		| Record<string, OpenAPIV3_1.HeaderObject | OpenAPIV3_1.ReferenceObject>
		| undefined;
}) {
	const { example, headers } = data;

	const schema = await toJSONSchema(data.schema);

	const successResponseObject: OpenAPIV3_1.ResponseObject = {
		description: "Successful response",
		headers,
		content: {
			"application/json": {
				schema: schema as any,
				example,
			},
		},
	};

	return {
		200: successResponseObject,
		default: {
			$ref: "#/components/responses/error",
		},
	};
}
