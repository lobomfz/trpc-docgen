import type { OpenAPIV3_1 } from "openapi-types";

export const errorResponseObject: OpenAPIV3_1.ResponseObject = {
	description: "Error response",
	content: {
		"application/json": {
			schema: {
				type: "object",
				properties: {
					message: {
						type: "string",
					},
					code: {
						type: "string",
					},
					issues: {
						type: "array",
						items: {
							type: "object",
							properties: {
								message: {
									type: "string",
								},
							},
							required: ["message"],
						},
					},
				},
				required: ["message", "code"],
			},
		},
	},
};
