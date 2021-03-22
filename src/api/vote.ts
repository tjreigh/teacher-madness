import { Poll, Vote } from '../types';
import { VercelRequest, VercelResponse } from '@vercel/node';
import {
	arrayHasIndex,
	cleanBody,
	db,
	DBInitError,
	hasAllChallongeIds,
	limit,
	NowReturn,
	tryHandleFunc,
} from '../util';
import { oneLineTrim } from 'common-tags';
import fetch from 'node-fetch';

const handle = async (req: VercelRequest, res: VercelResponse): NowReturn => {
	if (!db) throw new DBInitError();

	const { id, choice } = cleanBody<Vote>(req);

	const poll: Poll | undefined = (
		await (await db.fetch({ id }, 1, 1))[Symbol.asyncIterator]().next()
	).value[0];

	if (!poll) return res.status(404).send(`Could not find poll with id ${id}`);

	if (!arrayHasIndex(poll.entries, choice)) return res.status(422).send('Invalid poll choice');

	poll.entries[choice].votes++;

	await db.update({ entries: poll.entries }, id.toString());

	if (hasAllChallongeIds(poll)) {
		await challongeUpdate(poll);
	}

	return res.json(poll);
};

async function challongeUpdate(poll: Poll) {
	const params = {
		'match[player1_votes]': poll.entries[0].votes.toString(),
		'match[player2_votes]': poll.entries[1].votes.toString(),
		'match[scores_csv]': `${poll.entries[0].votes}-${poll.entries[1].votes}`,
	};

	const url = new URL(oneLineTrim`https://${process.env.CHALLONGE_USER}:${process.env.CHALLONGE_KEY}
		@api.challonge.com/v1/tournaments/
		${process.env.CHALLONGE_TOURNAMENT}/matches/${poll.challongeId}.json`);

	url.search = new URLSearchParams(params).toString();

	const res = await fetch(url, {
		method: 'put',
	});

	if (!res.ok) return console.error(`Error attempting to update challonge: \n${await res.text()}`);
}

export default tryHandleFunc(handle, 'POST');
