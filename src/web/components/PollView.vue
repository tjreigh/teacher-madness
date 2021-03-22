<template>
	<div class="poll">
		<div class="pollForm" v-if="needsVote && loading == false">
			<form @submit="handleVote" method="post">
				<input type="radio" v-model.number="choice" value="0" /><label>{{
					this.poll.entries[0].name
				}}</label>
				<br />
				<input type="radio" v-model.number="choice" value="1" /><label>{{
					this.poll.entries[1].name
				}}</label>
				<br />
				<input type="submit" value="Vote" class="subBtn" />
			</form>
		</div>
		<div class="loading" v-else-if="loading == true">Loading...</div>
		<div class="results" v-else>
			<p class="votes">{{ this.poll.entries[0].name }}: {{ this.poll.entries[0].votes }} votes</p>
			<Results :value="results[0]" />
			<hr />
			<p class="votes">{{ this.poll.entries[1].name }}: {{ this.poll.entries[1].votes }} votes</p>
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
	private results = [0, 0];
	private needsVote = true;
	private loading = false;

	async handleVote(e: Event) {
		e.preventDefault();

		this.loading = true;

		await this.voteReq();

		this.loading = false;
	}

	async voteReq() {
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
		const total = results.entries.reduce((acc, it) => acc + it.votes, 0);
		this.results = results.entries.map(e => Math.round((e.votes / total) * 100));
	}
}
</script>

<style lang="scss" scoped>
%base {
	background: linear-gradient(180deg, #aa2222 0%, #420101 66%, black 100%);
	width: 250px;
	height: 250px;
	margin: 10px;
	padding: 30px;
	color: #f2f2f2;
	font-weight: bold;
}

.pollForm {
	@extend %base;
	line-height: 80px;
}

.results {
	@extend %base;
	line-height: 30px;
}

.loading {
	@extend %base;
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

@media only screen and (max-width: 768px) {
	.pollForm {
		width: 200px;
		height: 200px;
		line-height: 60px;
	}

	.results {
		width: 200px;
		height: 200px;
		line-height: 20px;
	}

	.subBtn {
		font-size: 5vw;
	}

	label {
		font-size: 5vw;
	}

	p.votes {
		font-size: 3.8vw;
	}
}

@media (min-width: 768px) and (max-width: 1024px) {
	.pollForm {
		width: 250px;
		height: 210px;
		line-height: 70px;
	}

	.results {
		width: 250px;
		height: 210px;
		line-height: 40px;
	}

	.subBtn {
		font-size: 3vw;
	}

	p.votes {
		font-size: 12pt;
	}
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
	.pollForm {
		width: 25vw;
		height: 20vh;
		margin: 1.5vw;
		padding: 1.5vw;
		line-height: 6vh;
	}

	.results {
		width: 20vw;
		height: 14vh;
		padding: 0 4vw 10.6vh;
		font-size: 1.5vw;
		line-height: 2.6vh;
	}

	.subBtn {
		font-size: 2vw;
	}

	p.votes {
		font-size: 1.5vw;
	}
}
</style>
