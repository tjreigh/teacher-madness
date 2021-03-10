import Vue, { PluginObject } from 'vue';
import Vuex, { ActionTree, GetterTree, MutationTree } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { ActionNames, Actions, Getters, MutationNames, Mutations, State } from './types';

// New store object with awareness of types
const typedStore: PluginObject<void> = {
	install(VueInstance: typeof Vue) {
		Object.defineProperty(VueInstance.prototype, '$tStore', {
			get() {
				return this.$store;
			},
		});
	},
};

Vue.use(Vuex);
Vue.use(typedStore);

const getters: GetterTree<State, State> & Getters = {
	hello: state => state.hello,
};

const mutations: MutationTree<State> & Mutations = {
	[MutationNames.SetHello]: (state, newStr) => {
		state.hello = newStr;
	},
};

const actions: ActionTree<State, State> & Actions = {
	[ActionNames.NewHello]: ({ commit }, newStr) => {
		commit(MutationNames.SetHello, newStr);
	},
};

export default new Vuex.Store<State>({
	state: new State(),
	getters,
	mutations,
	actions,
	plugins: [createPersistedState()],
});
