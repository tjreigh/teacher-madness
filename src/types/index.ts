export interface Vote {
	id: number;
	choice: number;
}

type PollEntry = { name: string; votes: number; challongeId?: number };

export interface Poll {
	id: number;
	entries: [PollEntry, PollEntry];
	challongeId?: number;
}

export * from './challonge';
export * from './captcha';
