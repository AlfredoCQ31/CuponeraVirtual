// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
// import PDFGenerator from "../components/PDFGenerator.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/cupones",
    name: "cupones",
    component: () => import("../views/Cupones.vue"),
  },
  {
    path: "/pdfgenerator",
    name: "PDFGenerator",
    component: () => import("../components/PDFGenerator.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
