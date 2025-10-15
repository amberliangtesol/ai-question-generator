import { createRouter, createWebHistory } from 'vue-router'
import QuestionGenerator from '../views/QuestionGenerator.vue'
import PracticeMode from '../views/PracticeMode.vue'

const routes = [
  {
    path: '/',
    name: 'QuestionGenerator',
    component: QuestionGenerator
  },
  {
    path: '/practice',
    name: 'PracticeMode',
    component: PracticeMode
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router