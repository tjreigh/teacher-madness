<template>
	<div class="poll">
		<div class="pollForm" v-if="needsVote">
			<form @submit="handleVote" method="post">
				<input type="radio" v-model.number="choice" value="0" /><label>{{
					this.poll.firstChoice.name
				}}</label>
				<br />
				<input type="radio" v-model.number="choice" value="1" /><label>{{
					this.poll.secondChoice.name
				}}</label>
				<br />
				<input type="submit" value="Vote" class="subBtn" />
			</form>
		</div>
		<div class="results" v-else>
			<p class="votes">{{ this.poll.firstChoice.name }}: {{ this.poll.firstChoice.votes }} votes</p>
			<Results :value="results[0]" />
			<hr />
			<p class="votes">
				{{ this.poll.secondChoice.name }}: {{ this.poll.secondChoice.votes }} votes
			</p>
			<Results :value="results[1]" />
		</div>
	</div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { Vote, Poll } from '@typings';

@Component({
	components: {
		Results: () => import(/* webpackChunkName: "Results" */ '@web/components/Results.vue'),
	},
})
export default class PollView extends Vue {
	@Prop({ required: true, type: Object }) poll!: Poll;
	private choice: number | null = null;
	private results: [number, number] = [0, 0];
	private needsVote = true;

	async handleVote(e: Event) {
		e.preventDefault();

		if (this.choice == null) return alert('Please select someone to vote for');

		const vote: Vote = {
			id: this.poll.id,
			choice: this.choice,
		};

		console.log(vote);

		let res = await fetch('/api/vote', {
			method: 'POST',
			body: JSON.stringify(vote),
		});

		if (res.ok) {
			this.needsVote = false;
			this.calcProgress((await res.json()) as Poll);
		} else {
			alert(`Error when attempting to vote: \n${await res.text()}`);
		}
	}

	calcProgress(results: Poll) {
		const total = results.firstChoice.votes + results.secondChoice.votes;
		const v1 = Math.round((results.firstChoice.votes / total) * 100);
		const v2 = Math.round((results.secondChoice.votes / total) * 100);

		this.results = [v1, v2];
	}
}
</script>

<style lang="less" scoped>
.base {
	background: linear-gradient(180deg, #aa2222 0%, #420101 66%, black 100%);
	width: 250px;
	height: 250px;
	margin: 10px;
	padding: 30px;
	color: #f2f2f2;
	font-weight: bold;
}

.pollForm {
	.base;
	line-height: 80px;
}

.results {
	.base;
	line-height: 30px;
}

.subBtn {
	font-size: 1.3vw;
	color: #ad1f1f;
	font-weight: bold;
}

label {
	font-size: 18pt;
}

hr {
	border: 0;
}

p.votes {
	display: inline;
	margin: 0;
	padding: 0;
	border: 0;
	font-size: 14pt;
	color: white;
	background: none;
}
</style>
