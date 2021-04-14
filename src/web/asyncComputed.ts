import { createDecorator, VueDecorator } from 'vue-class-component';

type AsyncComputedGetter<T> = () => Promise<T>;
interface IAsyncComputedProperty<T> {
	default?: T | (() => T);
	get: AsyncComputedGetter<T>;
	watch?: () => void;
	shouldUpdate?: () => boolean;
	lazy?: boolean;
}

export default function AsyncComputed<T>(
	computedOptions?: Omit<IAsyncComputedProperty<T>, 'get'>
): VueDecorator {
	return createDecorator((options, key) => {
		options.asyncComputed = options.asyncComputed || {};
		const method = options.methods![key];
		options.asyncComputed[key] = {
			get: method,
			...computedOptions,
		} as IAsyncComputedProperty<T>;
		delete options.methods![key];
	});
}
