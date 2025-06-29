<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useRouter } from 'vue-router'
import { useWalletStore } from '../stores/wallet'
import {
  getUserStakesWithCache,
  getAllPoolsInfoWithCache,
  getBatchStakeDividendsWithCache,
  type ProcessedStakeRecord,
  type ProcessedPool
} from '../utils/useStaking'

const { t } = useI18n()
const router = useRouter()
const walletStore = useWalletStore()

// 格式化数字，保留两位小数但去除尾部的0和小数点
const formatNumber = (num: string | number): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(numValue)) return '0'

  // 保留两位小数
  const formatted = numValue.toFixed(2)
  // 去除尾部的0和小数点
  return formatted.replace(/\.?0+$/, '')
}

// 用户质押数据
const myStakingList = ref<ProcessedStakeRecord[]>([])
const stakingContracts = ref<ProcessedPool[]>([])
const isLoading = ref(false)
const isLoadingPools = ref(false)

// 定时器
let stakingTimer: number | null = null
let poolsTimer: number | null = null
let dividendsTimer: number | null = null

// 更新用户质押数据
const updateUserStakes = async (forceUpdate: boolean = false) => {
  if (!walletStore.address) {
    myStakingList.value = []
    return
  }

  if (!forceUpdate && isLoading.value) {
    return // 防止重复请求
  }

  try {
    isLoading.value = true
    console.log('开始更新用户质押数据...')
    const stakes = await getUserStakesWithCache(forceUpdate)
    myStakingList.value = stakes
    console.log('用户质押数据更新完成:', stakes)
  } catch (error) {
    console.error('更新用户质押数据失败:', error)
    myStakingList.value = []
  } finally {
    isLoading.value = false
  }
}

// 更新质押池数据
const updatePoolsInfo = async (forceUpdate: boolean = false) => {
  if (!forceUpdate && isLoadingPools.value) {
    return // 防止重复请求
  }

  try {
    isLoadingPools.value = true
    console.log('开始更新质押池数据...')
    const pools = await getAllPoolsInfoWithCache(forceUpdate)
    stakingContracts.value = pools
    console.log('质押池数据更新完成:', pools)
  } catch (error) {
    console.error('更新质押池数据失败:', error)
    stakingContracts.value = []
  } finally {
    isLoadingPools.value = false
  }
}

// 更新质押收益数据
const updateStakingDividends = async (forceUpdate: boolean = false) => {
  if (!walletStore.address || myStakingList.value.length === 0) {
    return
  }

  try {
    console.log('开始更新质押收益数据...')

    // 获取所有质押记录的stakeId
    const stakeIds = myStakingList.value.map(stake => stake.stakeId)

    // 批量获取收益数据
    const dividendsMap = await getBatchStakeDividendsWithCache(stakeIds, forceUpdate)

    // 更新质押列表中的收益数据
    myStakingList.value.forEach(stake => {
      const newDividends = dividendsMap.get(stake.stakeId)
      if (newDividends !== undefined) {
        stake.stakingReward = newDividends
      }
    })

    console.log('质押收益数据更新完成')
  } catch (error) {
    console.error('更新质押收益数据失败:', error)
  }
}

// 启动定时器更新质押数据
const startStakingTimer = () => {
  if (stakingTimer) return
  updateUserStakes(true) // 立即执行一次
  stakingTimer = window.setInterval(() => {
    updateUserStakes() // 每30秒更新一次
  }, 30000)
}

// 启动定时器更新质押池数据
const startPoolsTimer = () => {
  if (poolsTimer) return
  updatePoolsInfo(true) // 立即执行一次
  poolsTimer = window.setInterval(() => {
    updatePoolsInfo() // 每5分钟更新一次（质押池信息变化较少）
  }, 5 * 60 * 1000)
}

// 启动定时器更新收益数据
const startDividendsTimer = () => {
  if (dividendsTimer) return
  updateStakingDividends(true) // 立即执行一次
  dividendsTimer = window.setInterval(() => {
    updateStakingDividends() // 每30秒更新一次收益
  }, 30000)
}

// 停止定时器
const stopStakingTimer = () => {
  if (stakingTimer) {
    clearInterval(stakingTimer)
    stakingTimer = null
  }
}

const stopPoolsTimer = () => {
  if (poolsTimer) {
    clearInterval(poolsTimer)
    poolsTimer = null
  }
}

const stopDividendsTimer = () => {
  if (dividendsTimer) {
    clearInterval(dividendsTimer)
    dividendsTimer = null
  }
}

onMounted(() => {
  startStakingTimer()
  startPoolsTimer()
  startDividendsTimer()
})

onUnmounted(() => {
  stopStakingTimer()
  stopPoolsTimer()
  stopDividendsTimer()
})

// 处理我的质押池点击
const handleMyStakingPool = (stakingId?: number) => {
  if (stakingId) {
    // 如果传入了质押ID，跳转到详情页
    router.push(`/staking-detail/${stakingId}?type=my-staking`)
  } else {
    // 点击"我的质押池(NFT)"按钮，跳转到NFT质押页面
    console.log('跳转到NFT质押页面')
    router.push('/nft-staking')
  }
}

// 处理NFT质押池按钮点击
const handleNFTStakingPool = () => {
  console.log('点击我的质押池(NFT)按钮，跳转到NFT质押页面')
  router.push('/nft-staking')
}

// 处理质押合约按钮点击
const handleStakingContract = (contract: any) => {
  router.push(`/staking-detail/${contract.id}?type=${contract.poolType}`)
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
        <!-- 标题 -->
        <h1 class="text-3xl font-bold mb-6" style="color: #5BF655">{{ t('staking.title') }}</h1>

        <!-- 我的质押池按钮 - 使用签到领取按钮样式 -->
        <button
          @click="handleNFTStakingPool"
          class="btn-primary w-full mb-6 py-4 text-black font-bold text-lg rounded-full"
        >
          {{ t('staking.my_staking_pool_nft') }}
        </button>

        <!-- 绿色背景容器 -->
        <div class="rounded-2xl p-4 mb-6" style="background: linear-gradient(135deg, rgba(124, 221, 61, 0.8) 0%, rgba(83, 203, 67, 0.8) 100%)">

          <!-- 我的质押列表 -->
          <div class="mb-6">
            <h2 class="text-xl font-bold text-white mb-4">{{ t('staking.my_staking') }}</h2>

            <!-- 加载状态 -->
            <div v-if="isLoading" class="text-center py-8">
              <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-alpha-primary transition ease-in-out duration-150">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ t('common.loading') }}
              </div>
            </div>

            <!-- 暂无质押状态 -->
            <div v-else-if="!walletStore.address" class="text-center py-12">
              <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
                <!-- 钱包图标 -->
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-white mb-2">请先连接钱包</h3>
                <p class="text-gray-400 text-sm">连接钱包后即可查看您的质押记录</p>
              </div>
            </div>

            <!-- 暂无质押记录 -->
            <div v-else-if="myStakingList.length === 0" class="text-center">
              <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
                <!-- 质押图标 -->
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                  <img
                    src="https://wufeng98.cn/imgServerApi/images/6f4c3eff-a594-49a5-82a2-be9e4a808452.png"
                    class="w-8 h-8 opacity-40"
                    alt="质押"
                  />
                </div>
                <h3 class="text-lg font-medium text-white mb-2">暂无质押记录</h3>
                <p class="text-gray-400 text-sm mb-4">您还没有进行任何质押，快去下方选择质押合约开始赚取收益吧！</p>
              </div>
            </div>

            <!-- 质押记录列表 -->
            <div v-else class="space-y-4">
              <div
                v-for="staking in myStakingList"
                :key="staking.id"
                @click="handleMyStakingPool(staking.poolNumber)"
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700"
              >
                <!-- 质押池编号和状态头部 -->
                <div class="flex items-center justify-between mb-4">
                  <!-- 质押池编号设计 -->
                  <div class="flex items-center">
                    <!-- 池子等级图标 -->
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 relative"
                         :class="`bg-gradient-to-br ${staking.poolGradient}`"
                         style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                      <!-- 内部光泽效果 -->
                      <div class="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                      <!-- 池子图标 -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <!-- 装饰性光环 -->
                      <div class="absolute -inset-1 rounded-full opacity-50"
                           :style="`background: conic-gradient(from 0deg, ${staking.poolColor}, transparent, ${staking.poolColor})`"></div>
                    </div>
                    <!-- 质押池标题 -->
                    <div>
                      <h3 class="text-base font-bold text-white text-left">{{ t(`staking.${staking.poolType}_pool`) }} {{ staking.poolNumber }}</h3>
                      <p class="text-gray-400 text-xs text-left">{{ t('staking.pool') }} {{ staking.poolNumber }}</p>
                    </div>
                  </div>

                  <!-- 状态指示器 -->
                  <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                       :class="`bg-gradient-to-r ${staking.poolGradient}`">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span class="text-white font-medium">{{ staking.status }}</span>
                    </div>
                  </div>
                </div>

                <!-- 主要显示区域 - 质押数量 -->
                <div class="relative overflow-hidden rounded-xl p-4 border-2 mb-4"
                     :style="`border-color: ${staking.poolColor}; background: linear-gradient(135deg, ${staking.poolColor}15 0%, ${staking.poolColor}08 100%)`">
                  <!-- 背景装饰效果 -->
                  <div class="absolute inset-0 opacity-20"
                       :style="`background: radial-gradient(circle at 20% 50%, ${staking.poolColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${staking.poolColor}30 0%, transparent 50%)`"></div>

                  <!-- 闪烁装饰点 -->
                  <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                       :style="`background: ${staking.poolColor}; box-shadow: 0 0 10px ${staking.poolColor}`"></div>
                  <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                       :style="`background: ${staking.poolColor}; box-shadow: 0 0 8px ${staking.poolColor}; animation-delay: 0.5s`"></div>

                  <!-- 内容区域 -->
                  <div class="relative z-10">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-gray-300 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" :style="`color: ${staking.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ t('staking.fund_pool') }}
                      </p>
                      <!-- 趋势图标 -->
                      <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-bounce" :style="`color: ${staking.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span class="text-white font-medium">{{ t('staking.status_active') }}</span>
                      </div>
                    </div>

                    <!-- 金额显示 -->
                    <div class="flex items-baseline">
                      <p class="text-white font-black text-xl break-all mr-2"
                         :style="`text-shadow: 0 0 20px ${staking.poolColor}80, 0 0 40px ${staking.poolColor}40`">
                        {{ formatNumber(staking.stakingAmount) }}
                      </p>
                      <span class="text-gray-400 text-sm font-medium">ALPHA</span>
                    </div>

                    <!-- 底部装饰线 -->
                    <div class="mt-2 h-0.5 rounded-full opacity-60"
                         :style="`background: linear-gradient(90deg, ${staking.poolColor} 0%, transparent 100%)`"></div>
                  </div>
                </div>

                <!-- 质押信息网格 -->
                <div class="grid grid-cols-2 gap-3 mb-4">
                  <div class="rounded-lg p-3 border border-gray-600" style="background-color: #151b12;">
                    <p class="text-gray-400 text-sm mb-1">{{ t('staking.annual_rate') }}</p>
                    <p class="font-bold text-base break-all" style="color: #5BF655">{{ staking.yearRate }}</p>
                  </div>
                  <div class="rounded-lg p-3 border border-gray-600" style="background-color: #151b12;">
                    <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_reward') }}</p>
                    <p class="text-white font-bold text-base break-all">{{ formatNumber(staking.stakingReward) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 质押合约列表 -->
         <div id="staking-contracts">
            <h2 class="text-xl font-bold text-white mb-4">{{ t('staking.staking_contracts') }}</h2>

            <!-- 加载状态 -->
            <div v-if="isLoadingPools" class="text-center py-8">
              <div class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-alpha-primary transition ease-in-out duration-150">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ t('common.loading') }}
              </div>
            </div>

            <!-- 暂无质押池 -->
            <div v-else-if="stakingContracts.length === 0" class="text-center py-8">
              <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
                <!-- 质押图标 -->
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                  <img
                    src="https://wufeng98.cn/imgServerApi/images/6f4c3eff-a594-49a5-82a2-be9e4a808452.png"
                    class="w-8 h-8 opacity-40"
                    alt="质押"
                  />
                </div>
                <h3 class="text-lg font-medium text-white mb-2">暂无可用质押池</h3>
                <p class="text-gray-400 text-sm">当前没有可用的质押池，请稍后再试</p>
              </div>
            </div>

            <!-- 质押合约列表 - 显示所有池子供用户选择质押 -->
            <div class="space-y-4">
              <div
                v-for="contract in stakingContracts"
                :key="contract.id"
                @click="handleStakingContract(contract)"
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700"
              >
                <!-- 合约头部设计 -->
                <div class="flex items-center justify-between mb-4">
                  <!-- 池子等级图标和名称 -->
                  <div class="flex items-center text-left">
                    <!-- 池子等级图标 -->
                    <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 relative"
                         :class="`bg-gradient-to-br ${contract.poolGradient}`"
                         style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                      <!-- 内部光泽效果 -->
                      <div class="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                      <!-- 池子图标 -->
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <!-- 装饰性光环 -->
                      <div class="absolute -inset-1 rounded-full opacity-50"
                           :style="`background: conic-gradient(from 0deg, ${contract.poolColor}, transparent, ${contract.poolColor})`"></div>
                    </div>
                    <!-- 池子名称和类型 -->
                    <div>
                      <div class="flex items-center">
                        <h3 class="text-lg font-bold text-white mr-2">{{ t(`staking.${contract.poolType}_pool`) }}</h3>
                        <span class="text-gray-400 text-sm font-mono">{{ contract.contractId }}</span>
                      </div>
                      <p class="text-gray-400 text-sm">{{ t('staking.staking_contract') }}</p>
                    </div>
                  </div>

                  <!-- 状态标签 -->
                  <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                       :class="`bg-gradient-to-r ${contract.poolGradient}`">
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span class="text-white font-medium">{{ contract.status }}</span>
                    </div>
                  </div>
                </div>

                <!-- 合约信息网格 -->
                <div class="space-y-3 mb-4">
                  <!-- 总金额单独一行 -->
                  <div class="relative overflow-hidden rounded-xl p-4 border-2"
                       :style="`border-color: ${contract.poolColor}; background: linear-gradient(135deg, ${contract.poolColor}15 0%, ${contract.poolColor}08 100%)`">
                    <!-- 背景装饰效果 -->
                    <div class="absolute inset-0 opacity-20"
                         :style="`background: radial-gradient(circle at 20% 50%, ${contract.poolColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${contract.poolColor}30 0%, transparent 50%)`"></div>

                    <!-- 闪烁装饰点 -->
                    <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                         :style="`background: ${contract.poolColor}; box-shadow: 0 0 10px ${contract.poolColor}`"></div>
                    <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                         :style="`background: ${contract.poolColor}; box-shadow: 0 0 8px ${contract.poolColor}; animation-delay: 0.5s`"></div>

                    <!-- 内容区域 -->
                    <div class="relative z-10">
                      <div class="flex items-center justify-between mb-2">
                        <p class="text-gray-300 text-sm font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" :style="`color: ${contract.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          总金额
                        </p>
                        <!-- 趋势图标 -->
                        <div class="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-bounce" :style="`color: ${contract.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      </div>

                      <!-- 金额显示 -->
                      <div class="flex items-baseline">
                        <p class="text-white font-black text-xl break-all mr-2"
                           :style="`text-shadow: 0 0 20px ${contract.poolColor}80, 0 0 40px ${contract.poolColor}40`">
                          {{ formatNumber(contract.totalAmount) }}
                        </p>
                        <span class="text-gray-400 text-sm font-medium">ALPHA</span>
                      </div>

                      <!-- 底部装饰线 -->
                      <div class="mt-2 h-0.5 rounded-full opacity-60"
                           :style="`background: linear-gradient(90deg, ${contract.poolColor} 0%, transparent 100%)`"></div>
                    </div>
                  </div>

                  <!-- 质押时间和年化率在同一行 -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-lg p-3 border border-gray-600" style="background-color: #151b12;">
                      <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_time') }}</p>
                      <p class="text-white font-bold text-base">{{ contract.lockupPeriod }}</p>
                    </div>
                  <div class="rounded-lg p-3 border border-gray-600" style="background-color: #151b12;">
                    <p class="text-gray-400 text-sm mb-1">{{ t('staking.annual_rate') }}</p>
                    <p class="font-bold text-base break-all" style="color: #5BF655">{{ contract.yearRate }}</p>
                  </div>
                  </div>
                </div>

                <!-- 添加质押按钮 -->
                <button
                  @click.stop="handleStakingContract(contract)"
                  class="w-full py-3 text-black font-bold rounded-full transition-all duration-300 hover:scale-105"
                  :class="`bg-gradient-to-r ${contract.poolGradient} hover:shadow-lg`"
                  :style="`box-shadow: 0 4px 15px ${contract.poolColor}40`"
                >
                  {{ t('staking.add_staking') }}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
