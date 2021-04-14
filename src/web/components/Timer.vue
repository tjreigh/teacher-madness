<template>
	<div id="container">
		<p>Time until next round</p>
		<div id="timer">
			<div>
				<span ref="days"></span>
				<div class="label">Days</div>
			</div>
			<div>
				<span ref="hours"></span>
				<div class="label">Hours</div>
			</div>
			<div>
				<span ref="minutes"></span>
				<div class="label">Minutes</div>
			</div>
			<div>
				<span ref="seconds"></span>
				<div class="label">Seconds</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class Timer extends Vue {
	@Prop({ required: true, type: String }) private endtime!: string;

	mounted() {
		this.initializeClock(this.endtime);
	}

	private getTimeRemaining(endtime: string) {
		const total = new Date(endtime).getTime() - Date.now();

		// Round down if decimal and 0 if negative
		const round = (it: number) => (total < 0 ? 0 : Math.floor(it));

		return {
			total,
			seconds: round((total / 1000) % 60),
			minutes: round((total / 1000 / 60) % 60),
			hours: round((total / (1000 * 60 * 60)) % 24),
			days: round(total / (1000 * 60 * 60 * 24)),
		};
	}

	private initializeClock(endtime: string) {
		const daysSpan = this.$refs.days as Element;
		const hoursSpan = this.$refs.hours as Element;
		const minutesSpan = this.$refs.minutes as Element;
		const secondsSpan = this.$refs.seconds as Element;

		const updateClock = () => {
			const t = this.getTimeRemaining(endtime);

			daysSpan.innerHTML = t.days.toString();
			hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
			minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
			secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

			if (t.total <= 0) {
				clearInterval(timeinterval);
			}
		};

		updateClock();
		const timeinterval = setInterval(updateClock, 1000);
	}
}
</script>

<style lang="scss" scoped>
#container,
#timer > div {
	font-family: sans-serif;
	color: #fff;
	display: inline-block;
	font-weight: 100;
	text-align: center;
	font-size: clamp(1rem, 2vw, 2rem);
	background: #585f5e;
	display: inline-block;
}

#timer > div {
	padding: 10px;
	border-radius: 3px;
	background: #585f5e;

	span {
		padding: 15px;
		border-radius: 3px;
		background: #474d4c;
		display: inline-block;
	}

	.label {
		padding-top: 5px;
		font-size: 16px;
	}
}
</style>
