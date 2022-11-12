import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "tetris",
      component: () => import("../views/MyTetris.vue"),
    },
  ],
});

export default router;
