export interface BrunoFile {
	meta: {
		name: string;
		type: string;
		seq: number;
	};
	method: string;
	url: string;
	body?: string;
	auth: string;
	bodyJson?: string;
}
