interface KeyValuePair {
	name: string;
	value: string;
	enabled: boolean;
}

interface LocalKeyValuePair extends KeyValuePair {
	local: boolean;
}

interface Auth {
	awsv4?: {
		accessKeyId: string;
		secretAccessKey: string;
		sessionToken?: string;
		service: string;
		region: string;
		profileName?: string;
	};
	basic?: {
		username: string;
		password: string;
	};
	bearer?: {
		token: string;
	};
	digest?: {
		username: string;
		password: string;
	};
	oauth2?: {
		grantType: "password" | "authorization_code" | "client_credentials";
		accessTokenUrl?: string;
		username?: string;
		password?: string;
		clientId?: string;
		clientSecret?: string;
		scope?: string;
		callbackUrl?: string;
		authorizationUrl?: string;
		state?: string;
		pkce?: boolean;
	};
}

interface Vars {
	req?: LocalKeyValuePair[];
	res?: LocalKeyValuePair[];
}

interface Script {
	req?: string;
	res?: string;
}

interface BruJsonResult {
	meta?: {
		name?: string;
		type?: string;
		seq?: number;
	};
	http?: {
		method?: string;
		url?: string;
		body?: string;
		auth?: string;
	};
	body?: {
		json?: string;
		text?: string;
		xml?: string;
		sparql?: string;
		graphql?: {
			query?: string;
			variables?: string;
		};
		formUrlEncoded?: KeyValuePair[];
		multipartForm?: (KeyValuePair & {
			type: "text" | "file";
			value: string | string[];
		})[];
	};
	headers?: KeyValuePair[];
	params?: (KeyValuePair & { type: "query" | "path" })[];
	auth?: Auth;
	vars?: Vars;
	assertions?: KeyValuePair[];
	script?: Script;
	tests?: string;
	docs?: string;
}

interface CollectionBruJsonResult {
	meta?: {
		name?: string;
		type: "collection";
		[key: string]: any;
	};
	auth?: Auth & { mode?: string };
	query?: KeyValuePair[];
	headers?: KeyValuePair[];
	vars?: Vars;
	script?: Script;
	tests?: string;
	docs?: string;
}

declare module "@usebruno/lang/v2/src/bruToJson" {
	function parser(input: string): BruJsonResult;

	export = parser;
}

declare module "@usebruno/lang/v2/src/jsonToBru" {
	function jsonToBru(json: BruJson): string;

	export = jsonToBru;
}

declare module "@usebruno/lang/v2/src/collectionBruToJson" {
	function parser(input: string): CollectionBruJsonResult;

	export = parser;
}

declare module "@usebruno/lang/v2/src/jsonToCollectionBru" {
	function jsonToCollectionBru(json: CollectionBruJsonResult): string;

	export = jsonToCollectionBru;
}
