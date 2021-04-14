export interface Vote {
	id: number;
	choice: number;
}

import { Poll as pPoll, PollEntry } from '@prisma/client';

export type Poll = pPoll & { entries: PollEntry[] };

export interface Config {
	id: number;
	gameId: string;
	endTime: Date;
}

export * from './challonge';
export * from './captcha';
