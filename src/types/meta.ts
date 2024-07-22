import type { OpenAPIV3_1 } from "openapi-types";

export type OpenApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type OpenApiContentType =
	| "application/json"
	| "application/x-www-form-urlencoded"
	| (string & {});

export type OpenApiMeta<TMeta = Record<string, unknown>> = TMeta & {
	openapi?: {
		enabled?: boolean;
		path?: `/${string}`;
		summary?: string;
		description?: string;
		protect?: boolean;
		tags?: string[];
		headers?: (OpenAPIV3_1.ParameterBaseObject & {
			name: string;
			in?: "header";
		})[];
		contentTypes?: OpenApiContentType[];
		deprecated?: boolean;
		reqEx?: Record<string, any>;
		resEx?: Record<string, any>;
		responseHeaders?: Record<
			string,
			OpenAPIV3_1.HeaderObject | OpenAPIV3_1.ReferenceObject
		>;
	};
};

export type GenerateOpenApiDocumentOptions = {
	title: string;
	description?: string;
	version: string;
	baseUrl: string;
	docsUrl?: string;
	tags?: string[];
	securitySchemes?: OpenAPIV3_1.ComponentsObject["securitySchemes"];
	blacklistedOnly?: boolean;
	/**
	 * Words to remove from the procedure path
	 * @default ["get", "create", "info"]
	 */
	wordsToRemove?: string[];
	/**
	 * Generates a bruno collection from the OpenAPI schema in the target directory
	 */
	bruno?: {
		outputDir: string;
	};
};
