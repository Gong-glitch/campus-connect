import { createApp } from "vue";
import App from "./App.vue";
import { router } from "./router"; // Matches your named export
import "./styles.css";             // Matches your exact style file in the screenshot

createApp(App).use(router).mount("#app");