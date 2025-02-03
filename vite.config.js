// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  // resolve: {
  //   alias: {
  //     "@": "/src",
  //   },
  // },
  server: {
    watch: {
      usePolling: true,
    },
  },
  publicDir: "public",
});

// export default defineConfig({
//   plugins: [vue()],
//   server: {
//     watch: {
//       usePolling: true,
//     },
//   },
//   publicDir: 'public',
// })
