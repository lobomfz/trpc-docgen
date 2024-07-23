import type { JSONSchema7 } from "json-schema";
//@ts-ignore
import OpenAI from "openai";

export const openai = new OpenAI();

export async function getExamplesFromSchema(
	schema: JSONSchema7,
	cacheFilePath?: string,
) {
	if (!schema?.properties) return {};

	const example: Record<string, any> = {};

	const cacheFile = cacheFilePath
		? await Bun.file(cacheFilePath)
				.json()
				.catch(() => ({}))
		: {};

	try {
		for (const [key, value] of Object.entries(schema.properties)) {
			if (cacheFile?.[key]) {
				example[key] = cacheFile[key];
				continue;
			}

			const res = await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{
						role: "user",
						content: `this is a key value of a json schema, generate an example based on the its name and type. If it doesnt have enough info, return "unknown".
					Do not say anything else. Only return the example unformatted, without tags or comments.
					key: ${key}, ${typeof value === "object" && "type" in value && value.type ? `type: ${value.type}` : ""}`,
					},
				],
			});

			let ex = res.choices[0].message.content;

			if (ex != null) {
				try {
					const parsed = JSON.parse(ex);
					if (parsed != null) {
						ex = parsed;
					}
				} catch (_e) {}

				example[key] = ex;
				cacheFile[key] = ex;

				if (cacheFilePath) {
					await Bun.write(cacheFilePath, JSON.stringify(cacheFile, null, 2));
				}
			}
		}
	} catch (e) {
		return example;
	}

	return example;
}
