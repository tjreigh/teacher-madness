<template>
	<div class="poll">
		<div class="pollForm" v-if="needsVote && loading == false">
			<form @submit.prevent="handleVote" method="post">
				<input
					type="radio"
					:id="`${this.poll.id}-choice0`"
					v-model.number="choice"
					value="0"
				/><label :for="`${this.poll.id}-choice0`" class="textfit">{{
					this.poll.entries[0].name
				}}</label>
				<br />
				<input
					type="radio"
					:id="`${this.poll.id}-choice1`"
					v-model.number="choice"
					value="1"
				/><label :for="`${this.poll.id}-choice1`" class="textfit">{{
					this.poll.entries[1].name
				}}</label>
				<br />
				<input type="submit" value="Vote" class="subBtn fittext" />
			</form>
		</div>
		<div class="loading" v-else-if="loading == true"><p class="textfit">Loading...</p></div>
		<div class="results" v-else>
			<p class="votes textfit">{{ this.poll.entries[0].name }}: {{ this.results[0][0] }} votes</p>
			<Results :value="results[1][0]" />
			<hr />
			<p class="votes textfit">{{ this.poll.entries[1].name }}: {{ this.results[0][1] }} votes</p>
			<Results :value="results[1][1]" />
		</div>
	</div>
</template>

<script lang="ts">
import { Poll, Vote } from '@typings';
import fitty from 'fitty';
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
	components: {
		Results: () => import(/* webpackChunkName: "Results" */ '@web/components/Results.vue'),
	},
})
export default class PollView extends Vue {
	@Prop({ required: true, type: Object }) poll!: Poll;
	private choice: number | null = null;
	private results: number[][] = [];
	private needsVote = true;
	private loading = false;

	mounted() {
		window.addEventListener('resize', this.fitText);
		this.fitText();
	}

	fitText() {
		const { isPhone, isTabletP, isTabletL, isLarge } = this.mediaMatches();
		const phone = isPhone ? 17 : null;
		const tabletP = isTabletP ? 18 : null;
		const tabletL = isTabletL ? 19 : null;
		const large = isLarge ? 22 : null;

		fitty('.textfit', { minSize: 16, maxSize: phone || tabletP || tabletL || large || 20 });
	}

	private mediaMatches() {
		const isPhone = window.matchMedia('only screen and (max-width: 760px)').matches;
		const isTabletP = window.matchMedia(
			'only screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : portrait)'
		).matches;
		const isTabletL = window.matchMedia(
			'only screen and (min-device-width : 768px) and (max-device-width : 1024px) and (orientation : landscape)'
		).matches;
		const isLarge = window.matchMedia('only screen  and (min-width : 1824px)').matches;

		return { isPhone, isTabletP, isTabletL, isLarge };
	}

	async handleVote() {
		this.loading = true;

		await this.$recaptchaLoaded();

		const response = await this.$recaptcha('submit');

		const res = await fetch('/api/verify', {
			method: 'POST',
			body: JSON.stringify({ response }),
		});

		console.log(response);

		if (!res.ok) {
			if (res.status === 405) alert('reCAPTCHA failed');
			else return alert(`Erorr when attempting to verify reCAPTCHA: \n${await res.text()}`);
		} else if (res.ok) await this.voteReq();

		this.loading = false;
	}

	private async voteReq() {
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
			this.calcResults((await res.json()) as Poll);
		} else {
			alert(`Error when attempting to vote: \n${await res.text()}`);
		}
	}

	private calcResults(results: Poll) {
		this.results[0] = results.entries.map(e => e.votes);

		const total = results.entries.reduce((acc, it) => acc + it.votes, 0);
		this.results[1] = results.entries.map(e => Math.round((e.votes / total) * 100));
	}
}
</script>

<style lang="scss" scoped>
%base {
	background: linear-gradient(180deg, #aa2222 0%, #420101 66%, black 100%);
	width: 275px;
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
	display: flex;
	justify-content: center;
	align-items: center;
}

.subBtn {
	font-size: 22pt;
	color: #ad1f1f;
	font-weight: bold;
}

label {
	font-size: 18pt;
}

hr {
	border: 0;
	height: 25px;
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
		width: 230px;
		height: 200px;
		line-height: 60px;
	}

	.loading {
		width: 230px;
		height: 200px;
	}

	.results {
		width: 230px;
		height: 200px;
		line-height: 20px;
	}

	.subBtn {
		font-size: 18pt;
	}
}

@media (min-width: 768px) and (max-width: 1024px) {
	.pollForm {
		width: 250px;
		height: 210px;
		line-height: 70px;
	}

	.loading {
		width: 250px;
		height: 210px;
	}

	.results {
		width: 250px;
		height: 210px;
		line-height: 40px;
	}

	.subBtn {
		font-size: 20pt;
	}
}
</style>
