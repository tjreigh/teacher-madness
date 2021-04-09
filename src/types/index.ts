export interface Vote {
	id: number;
	choice: number;
}

import { Poll as pPoll, PollEntry } from '@prisma/client';

export type Poll = pPoll & { entries: PollEntry[] };

export * from './challonge';
export * from './captcha';
