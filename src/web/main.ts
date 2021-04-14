import Vue from 'vue';
import AsyncComputed from 'vue-async-computed';
import { VueReCaptcha } from 'vue-recaptcha-v3';
import App from './App.vue';

Vue.config.productionTip = false;
Vue.config.devtools = true;

Vue.use(AsyncComputed);
Vue.use(VueReCaptcha, { siteKey: '6LfE0Y4aAAAAAGgzbtK9BS6mc8bZZA0GJK-N9bgr' });

new Vue({ render: h => h(App) }).$mount('#app');
