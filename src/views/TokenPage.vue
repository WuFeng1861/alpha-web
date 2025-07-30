<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useWalletStore } from '../stores/wallet'
import { getTokenBalances } from '../utils/useTokenBalance'
import { getEthWallet } from '../utils/useEthWallet'
import {formatBalance} from '../utils/utils.ts';

const { t } = useI18n()
const walletStore = useWalletStore()
const router = useRouter()

// 代币余额数据
const tokenBalances = ref({
  bnbBalance: '0',     // BNB余额
  alphaBalance: '0',   // ALPHA余额
  usdtBalance: '0',     // USDT余额
  boboBalance: '0'     // BOBO余额
})

const isLoading = ref(false)
const lastUpdateTime = ref<Date | null>(null)

// 定时器
let balanceTimer: number | null = null

// 获取BNB余额
const getBNBBalance = async (userAddress: string): Promise<string> => {
  try {
    const wallet = getEthWallet()
    if (!wallet) return '0'

    const balance = await wallet.getAddressEthBalance(userAddress)
    return balance
  } catch (error) {
    console.error('获取BNB余额失败:', error)
    return '0'
  }
}

// 更新所有代币余额
const updateAllBalances = async (forceUpdate: boolean = false) => {
  if (!walletStore.address) {
    tokenBalances.value = {
      bnbBalance: '0',
      alphaBalance: '0',
      usdtBalance: '0',
      boboBalance: '0'
    }
    return
  }

  if (isLoading.value && !forceUpdate) return

  try {
    isLoading.value = true

    // 并发获取所有余额
    const [bnbBalance, tokenBalanceData] = await Promise.all([
      getBNBBalance(walletStore.address),
      getTokenBalances(walletStore.address, forceUpdate)
    ])

    tokenBalances.value = {
      bnbBalance,
      alphaBalance: tokenBalanceData.alphaBalance,
      usdtBalance: tokenBalanceData.usdtBalance,
      boboBalance: tokenBalanceData.boboBalance
    }

    lastUpdateTime.value = new Date()
    console.log('代币余额更新完成:', tokenBalances.value)
  } catch (error) {
    console.error('更新代币余额失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 手动刷新余额
const handleRefresh = () => {
  updateAllBalances(true)
}

// 启动定时器
const startBalanceTimer = () => {
  if (balanceTimer) return
  updateAllBalances(true) // 立即执行一次
  balanceTimer = window.setInterval(() => {
    updateAllBalances() // 每30秒更新一次
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

// 代币配置信息
const tokenConfigs = [
  {
    nameKey: 'token.tokens.bnb.name',
    descKey: 'token.tokens.bnb.description',
    symbol: 'BNB',
    icon: 'https://wufeng98.cn/imgServerApi/images/7151f34e-2b93-4684-91e9-c74d25d1c70f.png',
    balance: 'bnbBalance',
    color: '#F3BA2F',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  {
    nameKey: 'token.tokens.alpha.name',
    descKey: 'token.tokens.alpha.description',
    symbol: 'ALPHA',
    icon: 'https://wufeng98.cn/imgServerApi/images/4d35f283-bf43-459b-be74-a1c1810f19a6.png',
    balance: 'alphaBalance',
    color: '#5BF655',
    gradient: 'from-green-400 to-green-600'
  },
  {
    nameKey: 'token.tokens.usdt.name',
    descKey: 'token.tokens.usdt.description',
    symbol: 'USDT',
    icon: 'https://wufeng98.cn/imgServerApi/images/8b4ac19c-a29c-490f-9a91-6ffe467fed7e.png',
    balance: 'usdtBalance',
    color: '#26A17B',
    gradient: 'from-green-500 to-teal-600'
  },
  {
    nameKey: 'token.tokens.BoBo.name',
    descKey: 'token.tokens.BoBo.description',
    symbol: 'BoBo',
    icon: 'https://wufeng98.cn/imgServerApi/images/63d52292-8b7b-42e5-82d4-d7a892e06ab3.png',
    balance: 'boboBalance',
    color: '#C49235',
    gradient: 'from-yellow-200 to-yellow-300'
  }
]

// 获取代币本地化名称
const getTokenName = (token: any) => {
  return t(token.nameKey)
}

// 获取代币本地化描述
const getTokenDescription = (token: any) => {
  return t(token.descKey)
}

  // 处理代币卡片点击，跳转到转账页面
const handleTokenClick = (token: any) => {
  if (!walletStore.address) {
    // 如果未连接钱包，显示连接钱包提示
    return
  }


  // 跳转到转账页面，传递代币信息
  router.push({
    path: '/token/transfer',
    query: {
      symbol: token.symbol,
      name: getTokenName(token),
      icon: token.icon,
      color: token.color,
      gradient: token.gradient,
      balance: tokenBalances.value[token.balance],
    }
  })
}
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 背景图片 -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
      :style="{ backgroundImage: `url('${config.backgrounds.friends}')` }"
    ></div>

    <!-- 内容层 -->
    <div class="relative z-10">
      <!-- Header -->
      <header class="p-4 relative">
        <div class="flex justify-between items-center mb-4">
          <AlphaLogo />
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 标题和刷新按钮 -->
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-bold" style="color: #5BF655">{{ t('token.title') }}</h1>
          <button
            @click="handleRefresh"
            :disabled="isLoading"
            class="p-3 rounded-full bg-alpha-primary bg-opacity-20 hover:bg-opacity-30 transition-all duration-300"
            :class="isLoading ? 'animate-spin' : ''"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-alpha-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        <!-- 钱包未连接状态 -->
        <div v-if="!walletStore.address" class="text-center py-12">
          <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">{{ t('token.connect_wallet_first') }}</h3>
            <p class="text-gray-400 text-sm">{{ t('token.connect_wallet_desc') }}</p>
          </div>
        </div>

        <!-- 代币余额列表 -->
        <div v-else class="space-y-4">
          <!-- 加载状态 -->
          <div v-if="isLoading && Object.values(tokenBalances).every(v => v === '0')" class="text-center py-8">
            <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-alpha-primary transition ease-in-out duration-150">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('common.loading') }}
            </div>
          </div>

          <!-- 代币卡片列表 -->
          <div
            v-for="token in tokenConfigs"
            :key="token.symbol"
            @click="handleTokenClick(token)"
            class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 cursor-pointer hover:scale-105 transition-transform duration-300"
          >
            <!-- 代币头部信息 -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <!-- 代币图标 -->
                <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 relative"
                     :class="`bg-gradient-to-br ${token.gradient}`"
                     style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                  <img
                    :src="token.icon"
                    :alt="token.name"
                    class="w-8 h-8 object-contain z-10"
                  />
                </div>
                <!-- 代币名称 -->
                <div class="text-left">
                  <h3 class="text-lg font-bold text-white">{{ getTokenName(token) }}</h3>
                  <p class="text-gray-400 text-sm">{{ getTokenDescription(token) }}</p>
                </div>
              </div>

              <!-- 代币符号标签 -->
              <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                   :class="`bg-gradient-to-r ${token.gradient}`">
                <span class="text-white font-medium">{{ token.symbol }}</span>
              </div>
            </div>

            <!-- 余额显示区域 -->
            <div class="relative overflow-hidden rounded-xl p-4 border-2"
                 :style="`border-color: ${token.color}; background: linear-gradient(135deg, ${token.color}15 0%, ${token.color}08 100%)`">
              <!-- 背景装饰效果 -->
              <div class="absolute inset-0 opacity-20"
                   :style="`background: radial-gradient(circle at 20% 50%, ${token.color}40 0%, transparent 50%)`"></div>

              <!-- 闪烁装饰点 -->
              <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                   :style="`background: ${token.color}; box-shadow: 0 0 10px ${token.color}`"></div>

              <!-- 余额内容 -->
              <div class="relative z-10">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-gray-300 text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" :style="`color: ${token.color}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ t('token.balance') }}
                  </p>
                </div>

                <!-- 余额数字显示 -->
                <div class="flex items-baseline justify-between">
                  <div class="flex items-baseline">
                    <p class="text-white font-black text-xl mr-2"
                       :style="`text-shadow: 0 0 20px ${token.color}80, 0 0 40px ${token.color}40`">
                      {{ formatBalance(tokenBalances[token.balance]) }}
                    </p>
                    <span class="text-gray-400 text-sm font-medium">{{ token.symbol }}</span>
                  </div>
                </div>

                <!-- 装饰线 -->
                <div class="mt-2 h-0.5 rounded-full opacity-60"
                     :style="`background: linear-gradient(90deg, ${token.color} 0%, transparent 100%)`"></div>
              </div>
            </div>

            <!-- 转账提示 -->
            <div class="mt-4 text-center">
              <p class="text-gray-400 text-xs">{{ t('token.click_to_transfer') }}</p>
            </div>
          </div>

          <!-- 最后更新时间 -->
          <div v-if="lastUpdateTime" class="text-center">
            <p class="text-gray-500 text-xs">
              {{ t('token.last_updated') }}: {{ lastUpdateTime.toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 确保文本在深色背景上清晰可见 */
.text-white {
  color: #ffffff !important;
}

.text-gray-300 {
  color: #d1d5db !important;
}

.text-gray-400 {
  color: #9ca3af !important;
}
</style>
