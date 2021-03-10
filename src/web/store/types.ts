import { ActionContext } from 'vuex';

export class State {
	hello = 'world';
}

export interface Getters {
	hello: (state: State) => string;
}

export enum MutationNames {
	SetHello,
}

export interface Mutations {
	[MutationNames.SetHello]: (state: State, newStr: string) => void;
}

type CommitContext = {
	commit<K extends MutationNames>(
		key: K,
		payload: Parameters<Mutations[typeof key]>[1]
	): ReturnType<Mutations[K]>;
} & Omit<ActionContext<State, State>, 'commit'>;

export enum ActionNames {
	NewHello,
}

export interface Actions {
	[ActionNames.NewHello]: ({ commit }: CommitContext, newStr: string) => void;
}
