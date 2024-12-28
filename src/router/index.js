import { createRouter, createWebHistory } from 'vue-router'
import DrugList from '../views/DrugList.vue'

const routes = [
  {
    path: '/',
    name: 'DrugList',
    component: DrugList
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router 