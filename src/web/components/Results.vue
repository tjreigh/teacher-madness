<template>
	<div class="progress" :data-label="value">
		<span class="value" :style="{ width: value + '%' }"></span>
	</div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';

@Component
export default class Results extends Vue {
	@Prop({ required: true, type: Number }) value!: number;
}
</script>

<style scoped>
.progress {
	height: 1.5em;
	width: 100%;
	background-color: #c9c9c9;
	position: relative;
}

.progress:before {
	content: attr(data-label) '%';
	font-size: 0.8em;
	position: absolute;
	text-align: center;
	top: 5px;
	left: 0;
	right: 0;
	z-index: 10;
}

.progress .value {
	background-color: #1463e8;
	display: inline-block;
	height: 100%;
	position: absolute;
	left: 0;
	z-index: 1;
}
</style>
