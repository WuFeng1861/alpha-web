<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWalletStore } from '../stores/wallet'
import { getTokenBalances, getCachedTokenBalances, isTokenBalanceCacheExpired } from '../utils/useTokenBalance'

const { t } = useI18n()
const walletStore = useWalletStore()

// 代币余额数据
const tokenBalances = ref({
  alphaBalance: '0',
  usdtBalance: '0'
})

const isLoading = ref(false)

// 定时器
let balanceTimer: number | null = null

// 格式化数字显示
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance)
  if (isNaN(num)) return '0'
  
  // 如果数字很大，使用科学计数法或简化显示
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K'
  } else {
    return num.toFixed(2)
  }
}

// 更新代币余额
const updateBalances = async (forceUpdate: boolean = false) => {
  if (!walletStore.address) {
    tokenBalances.value = {
      alphaBalance: '0',
      usdtBalance: '0'
    }
    return
  }
  
  // 如果不是强制更新，先尝试使用缓存
  if (!forceUpdate) {
    const cached = getCachedTokenBalances()
    if (cached && !isTokenBalanceCacheExpired()) {
      tokenBalances.value = cached
      return
    }
  }
  
  if (isLoading.value) return // 防止重复请求
  
  try {
    isLoading.value = true
    const balances = await getTokenBalances(walletStore.address, forceUpdate)
    tokenBalances.value = balances
  } catch (error) {
    console.error('更新代币余额失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 启动定时器
const startBalanceTimer = () => {
  if (balanceTimer) return
  updateBalances(true) // 立即执行一次
  balanceTimer = window.setInterval(() => {
    updateBalances() // 每30秒检查一次缓存，如果过期则更新
  }, 30000)
}

// 停止定时器
const stopBalanceTimer = () => {
  if (balanceTimer) {
    clearInterval(balanceTimer)
    balanceTimer = null
  }
}

onMounted(() => {
  startBalanceTimer()
})

onUnmounted(() => {
  stopBalanceTimer()
})

// 手动刷新
const handleRefresh = () => {
  updateBalances(true)
}
</script>

<template>
  <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-700">
    <!-- 标题和刷新按钮 -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-white">代币余额</h3>
      <button 
        @click="handleRefresh"
        :disabled="isLoading"
        class="p-2 rounded-full bg-alpha-primary bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
        :class="isLoading ? 'animate-spin' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-alpha-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>
    
    <!-- 余额显示 -->
    <div v-if="!walletStore.address" class="text-center py-4">
      <p class="text-gray-400 text-sm">请先连接钱包</p>
    </div>
    
    <div v-else class="space-y-3">
      <!-- ALPHA余额 -->
      <div class="flex items-center justify-between p-3 bg-alpha-surface rounded-lg border border-gray-600">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-alpha-primary bg-opacity-20 flex items-center justify-center mr-3">
            <span class="text-alpha-primary font-bold text-sm">A</span>
          </div>
          <div>
            <p class="text-white font-medium">ALPHA</p>
            <p class="text-gray-400 text-xs">Alpha代币</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-white font-bold">{{ formatBalance(tokenBalances.alphaBalance) }}</p>
          <p class="text-gray-400 text-xs">{{ tokenBalances.alphaBalance }}</p>
        </div>
      </div>
      
      <!-- USDT余额 -->
      <div class="flex items-center justify-between p-3 bg-alpha-surface rounded-lg border border-gray-600">
        <div class="flex items-center">
          <div class="w-8 h-8 rounded-full bg-green-500 bg-opacity-20 flex items-center justify-center mr-3">
            <span class="text-green-500 font-bold text-sm">U</span>
          </div>
          <div>
            <p class="text-white font-medium">USDT</p>
            <p class="text-gray-400 text-xs">泰达币</p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-white font-bold">{{ formatBalance(tokenBalances.usdtBalance) }}</p>
          <p class="text-gray-400 text-xs">{{ tokenBalances.usdtBalance }}</p>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="text-center py-2">
      <p class="text-gray-400 text-xs">更新中...</p>
    </div>
  </div>
</template>