import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import FriendsPage from '../views/FriendsPage.vue'
import BoxPage from '../views/BoxPage.vue'
import EarnPage from '../views/EarnPage.vue'
import StakingPage from '../views/StakingPage.vue'
import NFTStakingPage from '../views/NFTStakingPage.vue'
import StakingDetailPage from '../views/StakingDetailPage.vue'
import NodePage from '../views/NodePage.vue'
import NodeDetailPage from '../views/NodeDetailPage.vue'

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
    {
      path: '/earn',
      name: 'earn',
      component: EarnPage,
      meta: { title: 'Earn - Alpha Project' }
    },
    {
      path: '/staking',
      name: 'staking',
      component: StakingPage,
      meta: { title: 'Staking - Alpha Project' }
    },
    {
      path: '/nft-staking',
      name: 'nft-staking',
      component: NFTStakingPage,
      meta: { title: 'NFT Staking - Alpha Project' }
    },
    {
      path: '/staking-detail/:id',
      name: 'staking-detail',
      component: StakingDetailPage,
      meta: { title: 'Staking Detail - Alpha Project' }
    },
    {
      path: '/node',
      name: 'node',
      component: NodePage,
      meta: { title: 'Node - Alpha Project' }
    },
    {
      path: '/node/:type',
      name: 'node-detail',
      component: NodeDetailPage,
      meta: { title: 'Node Detail - Alpha Project' }
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