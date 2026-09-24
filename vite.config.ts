import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // 浏览器「保存网页」产生的 *_files 目录在写入时会锁住文件，
      // chokidar 监听到会抛 EBUSY 并终止 dev server。
      ignored: ["**/*_files/**"],
    },
  },
});
