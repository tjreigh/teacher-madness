<template>
	<div id="app">
		<ul class="header">
			<li class="link">
				<a href="https://therideronline.com">Home</a>
			</li>
			<li class="title">
				<h1>Teacher Madness 2021</h1>
			</li>
		</ul>

		<div v-for="poll of polls" :key="poll.id">
			<PollView :poll="poll" />
		</div>
	</div>
</template>

<script lang="ts">
import { Poll } from '@typings';
import { Component, Vue } from 'vue-property-decorator';

@Component({
	components: {
		PollView: () => import(/* webpackChunkName: "PollView" */ '@web/components/PollView.vue'),
	},
})
export default class Home extends Vue {
	private polls: Poll[] | null = null;

	created() {
		this.getPolls();
	}

	async getPolls() {
		const res = await fetch('/api/polls');
		Vue.set(this, 'polls', await res.json()); // Must use Vue set method to enable reactivity
		console.log(this.polls);
	}
}
</script>

<style lang="scss">
body {
	background-color: #f2f2f2;
}

#app {
	font-family: Geneva, Tahoma, Verdana, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	text-align: center;
	display: flex;
	margin: 0 auto;
	width: 95%;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: center;
}

.header {
	display: flex;
	position: sticky;
	top: 0;
	width: 100%;
	background: #1a1a1a;
	color: white;
	text-align: center;
	padding: 15px 0;
	margin: 0;
	overflow: hidden;
	z-index: 50;
	list-style-type: none;
	justify-content: center;
	flex-direction: row;
	align-items: center;
}

.link {
	float: left;

	a {
		text-decoration: none;
		color: white;
		background-color: $lsm-red;
		padding: 20px;
		margin: 10px;
		display: block;
		text-align: center;
		position: absolute;
		left: 0;
		bottom: 17px;
	}

	a:hover,
	a:active {
		background-color: red;
	}
}

/* Phone */
@media only screen and (max-width: 768px) {
	h1 {
		font-size: 7.2vw;
	}

	.header {
		flex-direction: column;
	}

	.link {
		a {
			position: inherit;
			margin: 0;
		}
	}
}

/* Tablet (portrait) */
@media (min-width: 768px) and (max-width: 1024px) {
	h1 {
		font-size: 4vw;
	}
}

/* Tablet (landscape) */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
	h1 {
		font-size: 3vw;
	}
}
</style>
