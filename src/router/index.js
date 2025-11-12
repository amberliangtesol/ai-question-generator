import { createRouter, createWebHistory } from 'vue-router'
import QuestionGenerator from '../views/QuestionGenerator.vue'
import QuestionReview from '../views/QuestionReview.vue'
import PracticeMode from '../views/PracticeMode.vue'

const routes = [
  {
    path: '/',
    name: 'QuestionGenerator',
    component: QuestionGenerator
  },
  {
    path: '/review',
    name: 'QuestionReview',
    component: QuestionReview
  },
  {
    path: '/practice',
    name: 'PracticeMode',
    component: PracticeMode
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router