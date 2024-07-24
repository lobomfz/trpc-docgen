import type { OpenAPIV3_1 } from "openapi-types";
import collectionParser from "@usebruno/lang/v2/src/collectionBruToJson";
import jsonToBruCollection from "@usebruno/lang/v2/src/jsonToCollectionBru";

export const brunoParser = {
	parseAuth(collection: CollectionBruJsonResult, schema: OpenAPIV3_1.Document) {
		if (!collection.auth) {
			collection.auth = {
				mode: "none",
			};
		}

		return collection.auth;
	},

	async createBase(schema: OpenAPIV3_1.Document, dir: string) {
		const brunoJson = {
			version: 1,
			name: schema.info.title,
			type: "collection",
			ignore: ["node_modules", ".git"],
		};

		await Bun.write(`${dir}/bruno.json`, JSON.stringify(brunoJson, null, 2));

		const collectionFile = await Bun.file(`${dir}/collection.bru`)
			.text()
			.catch(() => "");

		const parsedCollection = collectionParser(collectionFile);

		const newCollection = structuredClone(parsedCollection);

		const auth = brunoParser.parseAuth(newCollection, schema);

		await Bun.write(
			`${dir}/collection.bru`,
			jsonToBruCollection({
				...newCollection,
				auth,
			}),
		);
	},

	generateSampleBody(schema: any) {
		if (schema.type === "object") {
			const result: Record<string, any> = {};

			if (schema.properties) {
				for (const [prop, propSchema] of Object.entries(schema.properties)) {
					result[prop] = this.generateSampleBody(propSchema);
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
	},
};
