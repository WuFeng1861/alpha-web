<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useWalletStore } from '../stores/wallet'
import {
  getAllPoolsInfoWithCache,
  getUserStakesWithCache,
  getBatchStakeDividendsWithCache,
  type ProcessedPool,
  type ProcessedStakeRecord
} from '../utils/useStaking'
import { getTokenBalances } from '../utils/useTokenBalance'
import toast from '../utils/toast'
import { performStaking } from '../utils/useStaking';

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// 获取质押池ID
const poolId = computed(() => route.params.id as string)

// 质押相关状态
const {
  stakingPools,
  userStakes,
  isLoading,
  loadStakingPools,
  loadUserStakes,
  stake,
  unstake,
  claimRewards
} = useStaking()

// 钱包连接
const walletStore = useWalletStore()

// 计算属性：获取钱包连接状态
const account = computed(() => walletStore.address)
const isConnected = computed(() => !!walletStore.address)

// 当前质押池信息
const currentPool = computed(() => {
  return stakingPools.value.find(pool => pool.id === poolId.value)
})

// 用户在当前池的质押信息
const userStake = computed(() => {
  return userStakes.value.find(stake => stake.poolId === poolId.value)
})

// 表单状态
const stakeAmount = ref('')
const unstakeAmount = ref('')
const isStaking = ref(false)
const isUnstaking = ref(false)
const isClaiming = ref(false)

// 处理质押
const handleStake = async () => {
  if (!isConnected.value) {
    await connectWallet()
    return
  }

  if (!stakeAmount.value || parseFloat(stakeAmount.value) <= 0) {
    toast.error(t('staking.invalidAmount'))
    return
  }

  try {
    isStaking.value = true
    await stake(poolId.value, stakeAmount.value)
    toast.success(t('staking.stakeSuccess'))
    stakeAmount.value = ''
    await loadUserStakes()
  } catch (error) {
    console.error('质押失败:', error)
    toast.error(t('staking.stakeFailed'))
  } finally {
    isStaking.value = false
  }
}

// 处理取消质押
const handleUnstake = async () => {
  if (!unstakeAmount.value || parseFloat(unstakeAmount.value) <= 0) {
    toast.error(t('staking.invalidAmount'))
    return
  }

  try {
    isUnstaking.value = true
    await unstake(poolId.value, unstakeAmount.value)
    toast.success(t('staking.unstakeSuccess'))
    unstakeAmount.value = ''
    await loadUserStakes()
  } catch (error) {
    console.error('取消质押失败:', error)
    toast.error(t('staking.unstakeFailed'))
  } finally {
    isUnstaking.value = false
  }
}

// 处理领取奖励
const handleClaimRewards = async () => {
  try {
    isClaiming.value = true
    await claimRewards(poolId.value)
    toast.success(t('staking.claimSuccess'))
    await loadUserStakes()
  } catch (error) {
    console.error('领取奖励失败:', error)
    toast.error(t('staking.claimFailed'))
  } finally {
    isClaiming.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 组件挂载时加载数据
onMounted(async () => {
  await loadStakingPools()
  if (isConnected.value) {
    await loadUserStakes()
  }
})
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 顶部导航栏 -->
    <div class="sticky top-0 z-10 bg-alpha-surface border-b border-alpha-border">
      <div class="flex items-center justify-between p-4">
        <button @click="goBack" class="p-2 rounded-lg hover:bg-alpha-hover transition-colors">
          <svg class="w-6 h-6 text-alpha-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        <h1 class="text-lg font-semibold text-alpha-text">{{ t('staking.staking_detail') }}</h1>
        <div class="w-10"></div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex justify-center items-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-alpha-primary"></div>
    </div>

    <!-- 质押池不存在 -->
    <div v-else-if="!currentPool" class="flex flex-col items-center justify-center py-20">
      <svg class="w-16 h-16 text-alpha-text-secondary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"></path>
      </svg>
      <p class="text-alpha-text-secondary">{{ t('common.errors.no_pool_found') }}</p>
    </div>

    <!-- 质押池详情 -->
    <div v-else class="p-4 space-y-6">
      <!-- 质押池信息卡片 -->
      <div class="bg-alpha-card rounded-2xl p-6 border border-alpha-border">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 bg-gradient-to-r from-alpha-primary to-alpha-secondary rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-bold text-alpha-text">{{ currentPool.poolName }}</h2>
              <p class="text-alpha-text-secondary">{{ t('staking.pool') }} {{ currentPool.id }}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-alpha-primary">{{ currentPool.yearRate }}</div>
            <div class="text-sm text-alpha-text-secondary">{{ t('staking.annual_rate') }}</div>
          </div>
        </div>

        <!-- 质押池统计信息 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-alpha-surface rounded-xl p-4">
            <div class="text-sm text-alpha-text-secondary mb-1">{{ t('staking.total_capacity') }}</div>
            <div class="text-lg font-semibold text-alpha-text">{{ currentPool.totalStaked }} ALPHA</div>
          </div>
          <div class="bg-alpha-surface rounded-xl p-4">
            <div class="text-sm text-alpha-text-secondary mb-1">{{ t('staking.staking_time') }}</div>
            <div class="text-lg font-semibold text-alpha-text">{{ currentPool.lockupPeriod }}</div>
          </div>
        </div>
      </div>

      <!-- 用户质押信息 -->
      <div v-if="isConnected && userStake" class="bg-alpha-card rounded-2xl p-6 border border-alpha-border">
        <h3 class="text-lg font-semibold text-alpha-text mb-4">{{ t('staking.myStaking') }}</h3>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-alpha-surface rounded-xl p-4">
            <div class="text-sm text-alpha-text-secondary mb-1">{{ t('staking.staking_amount') }}</div>
            <div class="text-lg font-semibold text-alpha-text">{{ userStake.stakingAmount }} ALPHA</div>
          </div>
          <div class="bg-alpha-surface rounded-xl p-4">
            <div class="text-sm text-alpha-text-secondary mb-1">{{ t('staking.claimable_reward') }}</div>
            <div class="text-lg font-semibold text-alpha-primary">{{ userStake.stakingReward }} ALPHA</div>
          </div>
        </div>

        <!-- 领取奖励按钮 -->
        <button
          v-if="parseFloat(userStake.stakingReward) > 0"
          @click="handleClaimRewards"
          :disabled="isClaiming"
          class="w-full mt-4 bg-alpha-primary text-white py-3 rounded-xl font-medium hover:bg-alpha-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isClaiming" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('common.loading') }}
          </span>
          <span v-else>{{ t('staking.claim_type') }}</span>
        </button>
      </div>

      <!-- 质押操作 -->
      <div class="bg-alpha-card rounded-2xl p-6 border border-alpha-border">
        <h3 class="text-lg font-semibold text-alpha-text mb-4">{{ t('staking.add_staking') }}</h3>

        <!-- 连接钱包提示 -->
        <div v-if="!isConnected" class="text-center py-8">
          <svg class="w-16 h-16 text-alpha-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <p class="text-alpha-text-secondary mb-4">{{ t('friends.connect_wallet_view') }}</p>
          <button
            @click="connectWallet"
            class="bg-alpha-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-alpha-primary-dark transition-colors"
          >
            {{ t('home.connect_wallet') }}
          </button>
        </div>

        <!-- 质押表单 -->
        <div v-else class="space-y-4">
          <!-- 质押输入 -->
          <div>
            <label class="block text-sm font-medium text-alpha-text mb-2">{{ t('staking.stakeAmount') }}</label>
            <div class="relative">
              <input
                v-model="stakeAmount"
                type="number"
                placeholder="请输入质押数量"
                class="w-full bg-alpha-surface border border-alpha-border rounded-xl px-4 py-3 text-alpha-text placeholder-alpha-text-secondary focus:outline-none focus:ring-2 focus:ring-alpha-primary focus:border-transparent"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-alpha-text-secondary">
                ALPHA
              </div>
            </div>
          </div>

          <button
            @click="handleStake"
            :disabled="isStaking || !stakeAmount"
            class="w-full bg-alpha-primary text-white py-3 rounded-xl font-medium hover:bg-alpha-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isStaking" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('staking.staking') }}
            </span>
            <span v-else>{{ t('staking.stake') }}</span>
          </button>
        </div>
      </div>

      <!-- 取消质押操作 -->
      <div v-if="isConnected && userStake && parseFloat(userStake.stakingAmount) > 0" class="bg-alpha-card rounded-2xl p-6 border border-alpha-border">
        <h3 class="text-lg font-semibold text-alpha-text mb-4">{{ t('staking.unstake') }}</h3>

        <div class="space-y-4">
          <!-- 取消质押输入 -->
          <div>
            <label class="block text-sm font-medium text-alpha-text mb-2">{{ t('staking.staking_amount') }}</label>
            <div class="relative">
              <input
                v-model="unstakeAmount"
                type="number"
                :placeholder="`最大可取消: ${userStake.stakingAmount} ALPHA`"
                :max="userStake.stakingAmount"
                class="w-full bg-alpha-surface border border-alpha-border rounded-xl px-4 py-3 text-alpha-text placeholder-alpha-text-secondary focus:outline-none focus:ring-2 focus:ring-alpha-primary focus:border-transparent"
              />
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-alpha-text-secondary">
                ALPHA
              </div>
            </div>
          </div>

          <button
            @click="handleUnstake"
            :disabled="isUnstaking || !unstakeAmount"
            class="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isUnstaking" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('staking.unstaking') }}
            </span>
            <span v-else>{{ t('staking.unstake') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 输入框数字类型的样式优化 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* 按钮悬停效果 */
button:not(:disabled):hover {
  transform: translateY(-1px);
}

button:not(:disabled):active {
  transform: translateY(0);
}

/* 卡片悬停效果 */
.bg-alpha-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* 过渡动画 */
* {
  transition: all 0.2s ease-in-out;
}
</style>
