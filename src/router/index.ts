import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import FriendsPage from '../views/FriendsPage.vue'
import BoxPage from '../views/BoxPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: { title: 'Home - Alpha Project' }
    },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsPage,
      meta: { title: 'Friends - Alpha Project' }
    },
    {
      path: '/box',
      name: 'box',
      component: BoxPage,
      meta: { title: 'Box - Alpha Project' }
    },
    // Redirect any unknown routes to home
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// Update document title based on route meta
router.beforeEach((to, from, next) => {
  next()
})

export default router