import Vue from 'vue';
import App from './App.vue';
import { VueReCaptcha } from 'vue-recaptcha-v3';

Vue.config.productionTip = false;
Vue.config.devtools = true;

Vue.use(VueReCaptcha, { siteKey: '6LfE0Y4aAAAAAGgzbtK9BS6mc8bZZA0GJK-N9bgr' });

new Vue({ render: h => h(App) }).$mount('#app');
