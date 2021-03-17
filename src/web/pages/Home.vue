<template>
	<div class="home">
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
		PollView: () => import('@web/components/PollView.vue'),
	},
})
export default class Home extends Vue {
	private polls: Poll[] | null = null;

	created() {
		this.getPolls();
	}

	async getPolls() {
		const res = await fetch('/api/polls');
		Vue.set(this, 'polls', await res.json());
		console.log(this.polls);
	}
}
</script>

<style scoped>
.home {
	display: flex;
	margin: 0 auto;
	width: 95%;
	flex-wrap: wrap;
	flex-direction: row;
	justify-content: center;
}
</style>
