import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';

// 引入 Font Awesome
import '@fortawesome/fontawesome-free/css/all.css';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
