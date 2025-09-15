<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useWalletStore } from '../stores/wallet'
import { formatBalance } from '../utils/utils'
import toast from '../utils/toast'
import { useAlpMapping } from '../utils/useAlpMapping'

const { t } = useI18n()
const router = useRouter()
const walletStore = useWalletStore()
const { MAX_MAPPING_AMOUNT } = useAlpMapping()

// 映射表单数据
const mappingForm = ref({
  alpAmount: '',     // ALP数量
  alpsAmount: ''     // ALPS数量 (自动计算，1:1映射)
})

const isMappingInProgress = ref(false)

// 从钱包 store 获取实时余额
const alpBalance = computed(() => walletStore.alpBalance)
const alpsBalance = computed(() => walletStore.alpsBalance)

// 验证映射数量
const validationError = computed(() => {
  const amount = parseFloat(mappingForm.value.alpAmount)
  const balance = parseFloat(alpBalance.value)

  if (!mappingForm.value.alpAmount) return ''
  if (isNaN(amount) || amount <= 0) return '请输入有效的映射数量'
  if (amount > balance) return 'ALP余额不足'
  if (amount > MAX_MAPPING_AMOUNT) return `单次映射不能超过 ${MAX_MAPPING_AMOUNT.toLocaleString()} ALP`

  return ''
})

const isValidAmount = computed(() => !validationError.value)

// 检查表单是否可以提交
const canSubmit = computed(() => {
  return mappingForm.value.alpAmount &&
         isValidAmount.value &&
         !isMappingInProgress.value &&
         walletStore.address
})

// 监听ALP数量变化，自动计算ALPS数量 (1:1映射)
const updateAlpsAmount = () => {
  const alpAmount = parseFloat(mappingForm.value.alpAmount)
  if (!isNaN(alpAmount) && alpAmount > 0) {
    mappingForm.value.alpsAmount = alpAmount.toString()
  } else {
    mappingForm.value.alpsAmount = ''
  }
}

// 设置最大数量
const setMaxAmount = () => {
  const balance = parseFloat(alpBalance.value)
  const maxAmount = Math.min(balance, MAX_MAPPING_AMOUNT)
  mappingForm.value.alpAmount = maxAmount.toString()
  updateAlpsAmount()
}

// 执行映射
const handleMapping = async () => {
  if (!canSubmit.value) return

  try {
    isMappingInProgress.value = true
    toast.info(t('mapping.processing'))

    const amount = parseFloat(mappingForm.value.alpAmount)
    await walletStore.mapAlpToAlps(amount)

    // 清空表单
    mappingForm.value = { alpAmount: '', alpsAmount: '' }

    // 刷新余额
    await walletStore.updateBalances()
  } catch (error) {
    console.error('映射失败:', error)
    // 错误已在钱包存储中处理
  } finally {
    isMappingInProgress.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面初始化
onMounted(() => {
  if (walletStore.address) {
    walletStore.updateBalances()
  }
})

// 监听钱包连接状态变化
watch(() => walletStore.address, (newAddress) => {
  if (newAddress) {
    walletStore.updateBalances()
  }
})
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
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <AlphaLogo />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 页面标题 -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold mb-2" style="color: #5BF655">
            {{ t('mapping.title') }}
          </h1>
          <p class="text-gray-300 text-sm">
            {{ t('mapping.subtitle') }}
          </p>
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
            <p class="text-gray-400 text-sm">{{ t('mapping.connect_wallet_desc') }}</p>
          </div>
        </div>

        <!-- 映射界面 -->
        <div v-else class="space-y-6">
          <!-- 余额显示卡片 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 class="text-lg font-semibold text-white mb-2">
                ALP {{ $t('mapping.available_balance') }}
              </h3>
              <p class="text-3xl font-bold text-green-400">
                {{ formatBalance(alpBalance) }} ALP
              </p>
            </div>
            
            <div class="bg-white/10 backdrop-blur-md rounded-2xl p-6">
              <h3 class="text-lg font-semibold text-white mb-2">
                ALPS {{ $t('mapping.current_balance') }}
              </h3>
              <p class="text-3xl font-bold text-blue-400">
                {{ formatBalance(alpsBalance) }} ALPS
              </p>
            </div>
          </div>

          <!-- 映射表单 -->
          <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700">
            <!-- 映射比例说明 -->
            <div class="text-center mb-6 space-y-2">
              <div class="inline-flex items-center bg-gradient-to-r from-blue-500 to-purple-500 bg-opacity-20 rounded-full px-4 py-2 border border-blue-400 border-opacity-30">
                <span class="text-blue-300 text-sm font-medium">1 ALP = 1 ALPS</span>
              </div>
              <div class="text-xs text-yellow-300">
                {{ t('mapping.max_mapping_amount', { amount: MAX_MAPPING_AMOUNT.toLocaleString() }) }}
              </div>
            </div>

            <form @submit.prevent="handleMapping" class="space-y-6">
              <!-- ALP输入 -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-white text-sm font-medium text-left">{{ t('mapping.alp_amount') }}</label>
                  <button
                    type="button"
                    @click="setMaxAmount"
                    class="text-alpha-primary text-xs hover:underline"
                  >
                    {{ t('token.transfer.max') }}
                  </button>
                </div>
                <div class="relative">
                  <input
                    v-model="mappingForm.alpAmount"
                    @input="updateAlpsAmount"
                    type="number"
                    step="0.000001"
                    :max="Math.min(parseFloat(alpBalance), MAX_MAPPING_AMOUNT)"
                    :placeholder="t('mapping.alp_amount_placeholder')"
                    class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 pr-16 border transition-colors duration-300 focus:outline-none"
                    :class="[
                      isValidAmount ? 'border-gray-700 focus:border-alpha-primary' : 'border-red-500 focus:border-red-400'
                    ]"
                  />
                  <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                    ALP
                  </div>
                </div>
                <div v-if="validationError" class="mt-2 text-red-400 text-xs">
                  {{ validationError }}
                </div>
              </div>

              <!-- 映射箭头 -->
              <div class="flex justify-center">
                <div class="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              <!-- ALPS输出 -->
              <div>
                <label class="block text-white text-sm font-medium mb-2 text-left">{{ t('mapping.alps_amount') }}</label>
                <div class="relative">
                  <input
                    v-model="mappingForm.alpsAmount"
                    type="number"
                    step="0.000001"
                    :placeholder="t('mapping.alps_amount_placeholder')"
                    readonly
                    class="w-full bg-alpha-surface bg-opacity-50 text-white rounded-lg px-4 py-3 pr-20 border border-gray-700 cursor-not-allowed"
                  />
                  <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm font-medium">
                    ALPS
                  </div>
                </div>
                <p class="mt-1 text-gray-400 text-xs text-left">{{ t('mapping.auto_calculated') }}</p>
              </div>

              <!-- 映射按钮 -->
              <button
                type="submit"
                :disabled="!canSubmit"
                class="w-full py-4 text-black font-bold text-lg rounded-full transition-all duration-300"
                :class="[
                  canSubmit
                    ? 'bg-gradient-to-r from-blue-400 to-purple-500 hover:shadow-lg hover:from-blue-500 hover:to-purple-600'
                    : 'bg-gray-600 cursor-not-allowed'
                ]"
              >
                <span v-if="isMappingInProgress" class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ t('mapping.mapping_in_progress') }}
                </span>
                <span v-else>{{ t('mapping.confirm_mapping') }}</span>
              </button>
            </form>
          </div>

          <!-- 映射说明 -->
          <div class="bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg p-4">
            <div class="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="text-left">
                <h4 class="text-blue-400 font-medium text-sm mb-2">{{ t('mapping.info.title') }}</h4>
                <div class="text-blue-100 text-xs space-y-1 text-left">
                  <p>• {{ t('mapping.info.ratio') }}</p>
                  <p>• {{ t('mapping.info.irreversible') }}</p>
                  <p>• {{ t('mapping.info.gas_fee') }}</p>
                  <p>• {{ t('mapping.info.balance_update') }}</p>
                </div>
              </div>
            </div>
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

/* 隐藏数字输入框的增减按钮 */
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type=number] {
  -moz-appearance: textfield;
}
</style>