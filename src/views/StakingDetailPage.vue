<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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

// 导入解除质押函数
import { performUnstaking } from '../utils/useStaking'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const walletStore = useWalletStore()

// 控制界面显示状态
const showClaimInterface = ref(false)
const isLoading = ref(false)

// 输入的质押金额
const inputAmount = ref('5000')
// 质押加载状态
const isStaking = ref(false)
// 解除质押加载状态
const isUnstaking = ref(false)

// 质押详情数据
const stakingDetail = ref<ProcessedPool | null>(null)
// 用户在该池子的质押记录
const userStakesInPool = ref<ProcessedStakeRecord[]>([])
// 我的ALPHA余额
const myAlphaBalance = ref('0')

// 定时器
let detailTimer: number | null = null
let stakesTimer: number | null = null
let balanceTimer: number | null = null

// 格式化输入金额，保留两位小数
const formatInputAmount = (value: string): string => {
  const numValue = parseFloat(value)
  if (isNaN(numValue)) return '0.00'
  return numValue.toFixed(2)
}

// 处理输入变化
const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  // 当失去焦点时格式化为两位小数
  if (value) {
    inputAmount.value = formatInputAmount(value)
  }
}
// 格式化数字，保留两位小数但去除尾部的0和小数点
const formatNumber = (num: string | number): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(numValue)) return '0'

  // 保留两位小数
  const formatted = numValue.toFixed(2)
  // 去除尾部的0和小数点
  return formatted.replace(/\.?0+$/, '')
}

// 更新质押详情数据
const updateStakingDetail = async (forceUpdate: boolean = false) => {
  const poolId = route.params.id as string

  if (!poolId) {
    console.error('缺少池子ID参数')
    return
  }

  try {
    isLoading.value = true
    console.log(`开始获取池子 ${poolId} 的详情数据...`)

    // 获取所有质押池信息
    const allPools = await getAllPoolsInfoWithCache(forceUpdate)

    // 根据ID筛选出对应的池子
    const targetPool = allPools.find(pool => pool.id.toString() === poolId)

    if (targetPool) {
      stakingDetail.value = targetPool
      console.log('找到目标池子:', targetPool)
    } else {
      console.error(`未找到ID为 ${poolId} 的质押池`)
      stakingDetail.value = null
    }
  } catch (error) {
    console.error('获取质押详情失败:', error)
    stakingDetail.value = null
  } finally {
    isLoading.value = false
  }
}

// 更新用户在该池子的质押记录
const updateUserStakesInPool = async (forceUpdate: boolean = false) => {
  const poolId = route.params.id as string

  if (!walletStore.address || !poolId) {
    userStakesInPool.value = []
    return
  }

  try {
    console.log(`开始获取用户在池子 ${poolId} 的质押记录...`)

    // 获取用户所有质押记录
    const allUserStakes = await getUserStakesWithCache(forceUpdate)

    // 筛选出在当前池子的质押记录
    const stakesInPool = allUserStakes.filter(stake =>
        stake.poolNumber.toString() === poolId
    )

    userStakesInPool.value = stakesInPool
    console.log(`用户在池子 ${poolId} 的质押记录:`, stakesInPool)
  } catch (error) {
    console.error('获取用户质押记录失败:', error)
    userStakesInPool.value = []
  }
}

// 更新用户ALPHA余额
const updateUserBalance = async (forceUpdate: boolean = false) => {
  if (!walletStore.address) {
    myAlphaBalance.value = '0'
    return
  }

  try {
    console.log('开始更新用户ALPHA余额...')
    const balances = await getTokenBalances(walletStore.address, forceUpdate)
    myAlphaBalance.value = balances.alphaBalance
    console.log('用户ALPHA余额更新完成:', balances.alphaBalance)
  } catch (error) {
    console.error('更新用户ALPHA余额失败:', error)
    myAlphaBalance.value = '0'
  }
}

// 启动定时器更新质押详情
const startDetailTimer = () => {
  if (detailTimer) return
  updateStakingDetail() // 立即执行一次
  detailTimer = window.setInterval(() => {
    updateStakingDetail() // 每5分钟更新一次
  }, 5 * 60 * 1000)
}

// 启动定时器更新用户质押记录
const startStakesTimer = () => {
  if (stakesTimer) return
  updateUserStakesInPool() // 立即执行一次
  stakesTimer = window.setInterval(() => {
    updateUserStakesInPool() // 每30秒更新一次
  }, 30000)
}

// 启动定时器更新用户余额
const startBalanceTimer = () => {
  if (balanceTimer) return
  updateUserBalance() // 立即执行一次
  balanceTimer = window.setInterval(() => {
    updateUserBalance() // 每30秒更新一次余额
  }, 30000)
}

// 停止定时器
const stopDetailTimer = () => {
  if (detailTimer) {
    clearInterval(detailTimer)
    detailTimer = null
  }
}

const stopStakesTimer = () => {
  if (stakesTimer) {
    clearInterval(stakesTimer)
    stakesTimer = null
  }
}

const stopBalanceTimer = () => {
  if (balanceTimer) {
    clearInterval(balanceTimer)
    balanceTimer = null
  }
}

onMounted(() => {
  startDetailTimer()
  startStakesTimer()
  startBalanceTimer()
})

onUnmounted(() => {
  stopDetailTimer()
  stopStakesTimer()
  stopBalanceTimer()
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理领取按钮
const handleClaim = () => {
  console.log('领取奖励')
}

// 处理解除按钮
const handleUnstake = () => {
  showClaimInterface.value = true
}

// 处理索赔卡片的索赔按钮
const handleClaimItem = (stake: ProcessedStakeRecord) => {
  handleUnstakeAction(stake)
}

// 检查质押是否可以解除（锁定期是否已结束）
const checkStakeUnlockable = (stake: ProcessedStakeRecord): { canUnstake: boolean, message: string } => {
  if (!stakingDetail.value) {
    return { canUnstake: false, message: '质押池信息未加载' }
  }

  // 获取质押开始时间（秒）
  const stakeStartTime = stake.stakeStartTime
  // 获取当前时间（秒）
  const currentTime = Math.floor(Date.now() / 1000)
  // 获取锁定期（从质押池详情中获取，需要转换为秒）
  const lockupPeriodText = stakingDetail.value.lockupPeriod

  // 解析锁定期文本，转换为秒数
  let lockupPeriodSeconds = 0
  if (lockupPeriodText.includes('天')) {
    const days = parseInt(lockupPeriodText.replace('天', ''))
    lockupPeriodSeconds = days * 24 * 60 * 60
  } else if (lockupPeriodText.includes('小时')) {
    const hours = parseInt(lockupPeriodText.replace('小时', ''))
    lockupPeriodSeconds = hours * 60 * 60
  } else if (lockupPeriodText.includes('秒')) {
    lockupPeriodSeconds = parseInt(lockupPeriodText.replace('秒', ''))
  }

  // 计算解锁时间
  const unlockTime = stakeStartTime + lockupPeriodSeconds
  // 计算剩余锁定时间
  const remainingTime = unlockTime - currentTime

  if (remainingTime > 0) {
    // 还在锁定期内
    const remainingDays = Math.floor(remainingTime / (24 * 60 * 60))
    const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60))
    const remainingMinutes = Math.floor((remainingTime % (60 * 60)) / 60)

    let timeMessage = ''
    if (remainingDays > 0) {
      timeMessage = `${remainingDays}天${remainingHours}小时`
    } else if (remainingHours > 0) {
      timeMessage = `${remainingHours}小时${remainingMinutes}分钟`
    } else {
      timeMessage = `${remainingMinutes}分钟`
    }

    return {
      canUnstake: false,
      message: `质押锁定期未结束，还需等待 ${timeMessage}`
    }
  } else {
    // 锁定期已结束，可以解除质押
    return {
      canUnstake: true,
      message: '质押锁定期已结束，可以解除质押'
    }
  }
}

// 处理解除质押操作
const handleUnstakeAction = async (stake: ProcessedStakeRecord) => {
  if (!walletStore.address) {
    toast.error(t('common.errors.wallet_not_connected'))
    return
  }

  if (!stakingDetail.value) {
    toast.error('质押池信息未加载')
    return
  }

  // 检查质押是否可以解除
  const { canUnstake, message } = checkStakeUnlockable(stake)

  if (!canUnstake) {
    toast.error(message)
    return
  }

  try {
    isUnstaking.value = true
    toast.info('开始解除质押，请在钱包中确认交易...')

    // 执行解除质押
    const result = await performUnstaking(
        stake.poolNumber.toString(),
        stake.stakeId,
        t
    )

    if (result.status) {
      toast.success(result.message)

      // 解除质押成功后的操作
      // 1. 强制更新所有相关数据
      await Promise.all([
        updateUserBalance(true),      // 更新用户余额
        updateStakingDetail(true),    // 更新质押池详情
        updateUserStakesInPool(true)  // 更新用户质押记录
      ])

      // 2. 如果当前池子没有质押记录了，返回到质押详情界面
      if (userStakesInPool.value.length === 0) {
        showClaimInterface.value = false
      }

      console.log('解除质押成功，所有数据已更新')
    } else {
      toast.error(result.message)
    }

  } catch (error) {
    console.error('解除质押操作失败:', error)
    toast.error('解除质押操作失败，请重试')
  } finally {
    isUnstaking.value = false
  }
}

// 返回到质押详情界面
const backToStakingDetail = () => {
  showClaimInterface.value = false
}

// 处理添加按钮
const handleAdd = () => {
  showClaimInterface.value = false;
}

// 处理索赔按钮
const handleClaimButton = () => {
  showClaimInterface.value = true
}

// 处理质押操作
const handleStakeAction = async () => {
  if (!walletStore.address) {
    toast.error(t('common.errors.wallet_not_connected'))
    return
  }

  if (!stakingDetail.value) {
    toast.error('质押池信息未加载')
    return
  }

  // 验证输入金额
  const amount = parseFloat(inputAmount.value)
  if (isNaN(amount) || amount <= 0) {
    toast.error('请输入有效的质押数量')
    return
  }

  // 检查余额
  const userBalance = parseFloat(myAlphaBalance.value)
  if (userBalance < amount) {
    toast.error(`余额不足！您的ALPHA余额为 ${myAlphaBalance.value}，需要 ${inputAmount.value}`)
    return
  }

  // 检查质押池容量限制
  const currentPoolAmount = parseFloat(stakingDetail.value.totalStaked || '0')
  const maxPoolCapacity = parseFloat(stakingDetail.value.maxStakeAmount || '0')
  const afterStakeAmount = currentPoolAmount + amount

  if (afterStakeAmount > maxPoolCapacity) {
    const remainingCapacity = maxPoolCapacity - currentPoolAmount
    if (remainingCapacity <= 0) {
      toast.error('质押池已满，无法继续质押')
      return
    } else {
      toast.error(`质押金额超出池子容量限制！当前池子剩余容量为 ${formatNumber(remainingCapacity.toString())} ALPHA`)
      return
    }
  }
  try {
    isStaking.value = true
    toast.info('开始质押，请在钱包中确认交易...')

    // 执行质押
    const result = await performStaking(
        stakingDetail.value.id.toString(),
        inputAmount.value,
        t
    )

    if (result.status) {
      toast.success(result.message)

      // 质押成功后的操作
      // 1. 重置输入框
      inputAmount.value = '5000'

      // 2. 强制更新所有相关数据
      await Promise.all([
        updateUserBalance(true),      // 更新用户余额
        updateStakingDetail(true),    // 更新质押池详情
        updateUserStakesInPool(true)  // 更新用户质押记录
      ])

      // 3. 返回到质押详情界面（如果当前在索赔界面）
      showClaimInterface.value = false

      console.log('质押成功，所有数据已更新')
    } else {
      toast.error(result.message)
    }

  } catch (error) {
    console.error('质押操作失败:', error)
    toast.error('质押操作失败，请重试')
  } finally {
    isStaking.value = false
  }
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
          <div class="flex items-center">
            <!-- 返回按钮 -->
            <button @click="goBack" class="mr-3 p-2 rounded-full bg-alpha-surface-light bg-opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <AlphaLogo/>
          </div>
          <LanguageSwitcher/>
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="text-center py-8">
          <div
              class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-alpha-primary transition ease-in-out duration-150">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ t('common.loading') }}
          </div>
        </div>

        <!-- 未找到池子数据 -->
        <div v-else-if="!stakingDetail" class="text-center py-12">
          <div
              class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-white mb-2">未找到质押池</h3>
            <p class="text-gray-400 text-sm">指定的质押池不存在或已被删除</p>
          </div>
        </div>

        <!-- 索赔界面 -->
        <div v-else-if="showClaimInterface && stakingDetail" class="rounded-2xl p-4 mb-6"
             style="background: linear-gradient(135deg, rgba(124, 221, 61, 0.8) 0%, rgba(83, 203, 67, 0.8) 100%)">
          <!-- 顶部按钮组 -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
                @click="handleAdd"
                class="btn-primary py-3 text-black font-bold rounded-full bg-opacity-60"
            >
              {{ t('common.add') }}
            </button>
            <button
                class="btn-primary py-3 text-black font-bold rounded-full"
            >
              {{ t('staking.claim_type') }}
            </button>
          </div>

          <!-- 索赔列表 -->
          <div class="space-y-4">
            <!-- 暂无质押记录 -->
            <div v-if="userStakesInPool.length === 0" class="text-center py-8">
              <div
                  class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
                <div
                    class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                  <img
                      src="https://wufeng98.cn/imgServerApi/images/6f4c3eff-a594-49a5-82a2-be9e4a808452.png"
                      class="w-8 h-8 opacity-40"
                      alt="质押"
                  />
                </div>
                <h3 class="text-lg font-medium text-white mb-2">暂无质押记录</h3>
                <p class="text-gray-400 text-sm">您在此池子中还没有质押记录</p>
              </div>
            </div>

            <!-- 质押记录列表 -->
            <div
                v-for="stake in userStakesInPool"
                :key="stake.id"
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700"
            >
              <!-- 卡片标题 -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center text-left">
                  <!-- 索赔图标 -->
                  <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 relative"
                       style="background: linear-gradient(135deg, #5BF655 0%, #4BD341 100%); box-shadow: 0 4px 15px rgba(91, 246, 85, 0.3);">
                    <!-- 内部光泽效果 -->
                    <div class="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                    <!-- 索赔图标 -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white z-10" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      :class="`bg-gradient-to-br ${stake.poolGradient}`"
                      style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    </svg>
                    <!-- 装饰性光环 -->
                    <div class="absolute -inset-1 rounded-full opacity-50"
                         style="background: conic-gradient(from 0deg, #5BF655, transparent, #5BF655)"></div>
                  </div>
                  <!-- 索赔名称和类型 -->
                  <div>
                    <h3 class="text-lg font-bold text-white">{{ t('staking.claim_type') }}</h3>
                    <p class="text-gray-400 text-sm">{{ t('staking.staking_claim') }}</p>
                  </div>
                </div>

                <!-- 状态标签 -->
                <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                     :class="`bg-gradient-to-r ${stake.poolGradient}`">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span class="text-white font-medium">{{ stake.status }}</span>
                  </div>
                </div>
              </div>

              <!-- 主要显示区域 - 质押收益 -->
              <div class="relative overflow-hidden rounded-xl p-4 border-2 mb-4"
                   :style="`border-color: ${stake.poolColor}; background: linear-gradient(135deg, ${stake.poolColor}15 0%, ${stake.poolColor}08 100%)`">
                <!-- 背景装饰效果 -->
                <div class="absolute inset-0 opacity-20"
                     :style="`background: radial-gradient(circle at 20% 50%, ${stake.poolColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${stake.poolColor}30 0%, transparent 50%)`"></div>

                <!-- 闪烁装饰点 -->
                <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                     :style="`background: ${stake.poolColor}; box-shadow: 0 0 10px ${stake.poolColor}`"></div>
                <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                     :style="`background: ${stake.poolColor}; box-shadow: 0 0 8px ${stake.poolColor}; animation-delay: 0.5s`"></div>

                <!-- 内容区域 -->
                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-gray-300 text-sm font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5"
                           :style="`color: ${stake.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                      </svg>
                      {{ t('staking.staking_reward') }}
                    </p>
                    <!-- 收益图标 -->
                    <div class="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-pulse"
                           :style="`color: ${stake.poolColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                  </div>

                  <!-- 收益显示 -->
                  <div class="flex items-baseline">
                    <p class="text-white font-black text-xl break-all mr-2"
                       :style="`text-shadow: 0 0 20px ${stake.poolColor}80, 0 0 40px ${stake.poolColor}40`">
                      {{ formatNumber(stake.stakingReward) }}
                    </p>
                    <span class="text-gray-400 text-sm font-medium">ALPHA</span>
                  </div>

                  <!-- 底部装饰线 -->
                  <div class="mt-2 h-0.5 rounded-full opacity-60"
                       :style="`background: linear-gradient(90deg, ${stake.poolColor} 0%, transparent 100%)`"></div>
                </div>
              </div>

              <!-- 详细信息网格 -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <!-- 质押数量 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_amount') }}</p>
                  <p class="text-white font-bold text-base">
                    {{ formatNumber(stake.stakingAmount) }}</p>
                </div>

                <!-- 年化率 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.annual_rate') }}</p>
                  <p class="font-bold text-base break-all" style="color: #5BF655">{{ stake.yearRate }}</p>
                </div>

                <!-- 质押时间 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_time') }}</p>
                  <p class="text-white font-bold text-base">{{ stakingDetail?.lockupPeriod || '-' }}</p>
                </div>

                <!-- 质押开始 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_start') }}</p>
                  <p class="text-white font-bold text-base">
                    {{ new Date(stake.stakeStartTime * 1000).toLocaleDateString() }}</p>
                </div>

              </div>

              <!-- 索赔按钮 -->
              <button
                  @click="handleClaimItem(stake)"
                  :disabled="isUnstaking"
                  class="w-full py-3 text-black font-bold rounded-full transition-all duration-300"
                  :class="[
                    `bg-gradient-to-r ${stake.poolGradient}`,
                    isUnstaking ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'
                  ]"
                  :style="`box-shadow: 0 4px 15px ${stake.poolColor}40`"
              >
                <span v-if="isUnstaking" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none"
                       viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  解除质押中...
                </span>
                <span v-else>{{ t('staking.claim_type') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 质押详情界面 -->
        <div v-else-if="stakingDetail" class="rounded-2xl p-4 mb-6"
             style="background: linear-gradient(135deg, rgba(124, 221, 61, 0.8) 0%, rgba(83, 203, 67, 0.8) 100%)">

          <!-- 顶部按钮组 -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button
                @click="handleAdd"
                class="btn-primary py-3 text-black font-bold rounded-full"
            >
              {{ t('common.add') }}
            </button>
            <button
                @click="handleClaimButton"
                class="btn-primary py-3 text-black font-bold rounded-full bg-opacity-60"
            >
              {{ t('staking.claim_type') }}
            </button>
          </div>

          <!-- 质押金额卡片 -->
          <div
              class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 mb-4">
            <!-- 质押金额标题和图标 -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <!-- 池子等级图标 -->
                <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 relative"
                     :class="`bg-gradient-to-br ${stakingDetail?.poolGradient}`"
                     style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                  <!-- 内部光泽效果 -->
                  <div class="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                  <!-- 池子图标 -->
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white z-10" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </svg>
                  <!-- 装饰性光环 -->
                  <div class="absolute -inset-1 rounded-full opacity-50"
                       :style="`background: conic-gradient(from 0deg, ${stakingDetail?.poolColor}, transparent, ${stakingDetail?.poolColor})`"></div>
                </div>
                <!-- 标题 -->
                <div class="text-left">
                  <h3 class="text-lg font-bold text-white">{{ t('staking.staking_amount') }}</h3>
                  <p class="text-gray-400 text-sm">{{ stakingDetail?.poolName }} {{ stakingDetail?.id }}</p>
                </div>
              </div>

              <!-- 状态标签 -->
              <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                   :class="`bg-gradient-to-r ${stakingDetail?.poolGradient}`">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <span class="text-white font-medium">{{ stakingDetail?.status }}</span>
                </div>
              </div>
            </div>

            <!-- 质押金额显示 -->
            <div class="relative overflow-hidden rounded-xl p-4 border-2"
                 :style="`border-color: ${stakingDetail?.poolColor}; background: linear-gradient(135deg, ${stakingDetail?.poolColor}15 0%, ${stakingDetail?.poolColor}08 100%)`">
              <!-- 背景装饰效果 -->
              <div class="absolute inset-0 opacity-20"
                   :style="`background: radial-gradient(circle at 20% 50%, ${stakingDetail?.poolColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${stakingDetail?.poolColor}30 0%, transparent 50%)`"></div>

              <!-- 闪烁装饰点 -->
              <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                   :style="`background: ${stakingDetail?.poolColor}; box-shadow: 0 0 10px ${stakingDetail?.poolColor}`"></div>
              <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                   :style="`background: ${stakingDetail?.poolColor}; box-shadow: 0 0 8px ${stakingDetail?.poolColor}; animation-delay: 0.5s`"></div>

              <!-- 内容区域 -->
              <div class="relative z-10 text-center">
                <!-- 金额显示 -->
                <div class="flex items-center justify-center mb-2 gap-3">
                  <!-- 输入框 -->
                  <input
                      v-model="inputAmount"
                      type="number"
                      class="bg-transparent text-white font-black text-lg text-left border-none outline-none w-32 no-spinner p-0 m-0"
                      :style="`text-shadow: 0 0 15px ${stakingDetail?.poolColor}80, 0 0 30px ${stakingDetail?.poolColor}40; color: white !important;`"
                      placeholder="5000"
                      step="0.01"
                      min="0"
                      @blur="handleInputChange"
                  />
                  <span class="text-white text-lg font-bold">Alpha</span>
                </div>

                <!-- 底部装饰线 -->
                <div class="mt-2 h-0.5 rounded-full opacity-60 mx-auto w-1/1"
                     :style="`background: linear-gradient(90deg, ${stakingDetail?.poolColor} 0%, transparent 100%)`"></div>
              </div>
            </div>
          </div>

          <!-- 详细信息网格 -->
          <div class="space-y-3 mb-4">
            <!-- 第一行：资金池和总容量 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-alpha-surface-light bg-opacity-90 rounded-lg p-4 border border-gray-700">
                <p class="text-gray-400 text-sm mb-1">{{ t('staking.fund_pool') }}</p>
                <p class="text-white font-bold text-base break-all">{{
                    formatNumber(stakingDetail?.totalStaked || '0')
                  }}</p>
              </div>
              <div class="bg-alpha-surface-light bg-opacity-90 rounded-lg p-4 border border-gray-700">
                <p class="text-gray-400 text-sm mb-1">{{ t('staking.total_capacity') }}</p>
                <p class="text-white font-bold text-base break-all">
                  {{ formatNumber(stakingDetail?.maxStakeAmount || '0') }}</p>
              </div>
            </div>

            <!-- 第二行：我的余额和年化率 -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-alpha-surface-light bg-opacity-90 rounded-lg p-4 border border-gray-700">
                <p class="text-gray-400 text-sm mb-1">{{ t('staking.my_balance') }}</p>
                <p class="text-white font-bold text-base break-all">{{ formatNumber(myAlphaBalance) }}</p>
              </div>
              <div class="bg-alpha-surface-light bg-opacity-90 rounded-lg p-4 border border-gray-700">
                <p class="text-gray-400 text-sm mb-1">{{ t('staking.annual_rate') }}</p>
                <p class="font-bold text-base break-all" style="color: #5BF655">{{ stakingDetail?.yearRate }}</p>
              </div>
            </div>

          </div>

          <!-- 底部质押时间按钮 -->
          <button
              @click="handleStakeAction"
              :disabled="isStaking || !walletStore.address"
              class="btn-primary w-full py-4 text-black font-bold text-lg rounded-full transition-all duration-300"
              :class="isStaking ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'"
          >
            <span v-if="isStaking" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              质押中...
            </span>
            <span v-else>{{ t('common.stake') }}</span>
          </button>

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

/* 隐藏数字输入框的增加减少按钮 */
.no-spinner::-webkit-outer-spin-button,
.no-spinner::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
.no-spinner[type=number] {
  -moz-appearance: textfield;
}
</style>
