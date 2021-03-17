export interface Vote {
	id: number;
	choice: number;
}

type PollEntry = { name: string; votes: number };

export interface Poll {
	id: number;
	firstChoice: PollEntry;
	secondChoice: PollEntry;
}
