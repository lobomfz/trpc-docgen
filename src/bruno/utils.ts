import type { BrunoFile } from "../types/bruno";

export async function createCollection(title: string, dir: string) {
	const brunoJson = {
		version: "1",
		name: title,
		type: "collection",
		ignore: ["node_modules", ".git"],
	};

	await Bun.write(`${dir}/bruno.json`, JSON.stringify(brunoJson, null, 2));
}

export function generateSampleBody(schema: any) {
	if (schema.type === "object") {
		const result: Record<string, any> = {};

		if (schema.properties) {
			for (const [prop, propSchema] of Object.entries(schema.properties)) {
				result[prop] = generateSampleBody(propSchema);
			}
		}

		return result;
	}

	switch (schema.type) {
		case "string":
			return "";
		case "number":
			return 0;
		case "integer":
			return 0;
		case "boolean":
			return false;
		case "array":
			return [];
	}

	return new Date().toISOString();
}

export function generateBrunoFileContent(brunoFile: BrunoFile): string {
	let content = `meta {
  name: ${brunoFile.meta.name}
  type: ${brunoFile.meta.type}
  seq: ${brunoFile.meta.seq}
}

${brunoFile.method.toLowerCase()} {
  url: ${brunoFile.url}
  body: ${brunoFile.body || "none"}
  auth: ${brunoFile.auth}
}
`;

	if (brunoFile.bodyJson) {
		const indentedBodyJson = brunoFile.bodyJson
			.split("\n")
			.map((line) => "  " + line)
			.join("\n");

		content += `
body:json {
${indentedBodyJson}
}
  `;
	}

	return content;
}
