import { oneLineTrim } from 'common-tags';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import { ChallongeTournament } from '../types';
dotenv.config();

export async function challongeRequest(apiUsername: string, apiKey: string, tournamentId: string) {
	const res = await fetch(
		oneLineTrim`https://${apiUsername}:${apiKey}@api.challonge.com/v1/tournaments/
		${tournamentId}.json?include_participants=1&include_matches=1`
	);
	if (!res.ok) return console.error(`Error when requesting tournament data: \n${await res.text()}`);

	type resObj = { tournament: ChallongeTournament };
	const { tournament } = (await res.json()) as resObj;
	const participants = tournament.participants?.map(e => {
		return {
			id: e.participant.id,
			name: e.participant.name,
		};
	});

	const cleanMatches = tournament.matches
		?.map(m => {
			const p1 = participants?.find(p => p.id === m.match.player1_id);
			const p2 = participants?.find(p => p.id === m.match.player2_id);
			if (p1 && p2 && m.match.winner_id == null) return { p1, p2, id: m.match.id };
			else return null;
		})
		.filter(m => m != null);

	const polls = cleanMatches?.map(m => {
		return {
			entries: [
				{ name: m?.p1.name, challongeId: m?.p1.id },
				{ name: m?.p2.name, challongeId: m?.p2.id },
			],
			challongeId: m?.id,
		};
	});

	console.log(JSON.stringify(polls, null, 4));
	console.log(polls?.length);
}

challongeRequest(
	process.env.CHALLONGE_USER!,
	process.env.CHALLONGE_KEY!,
	process.env.CHALLONGE_TOURNAMENT!
);
