<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useWalletStore } from '../stores/wallet'
import { getEthWallet } from '../utils/useEthWallet'
import { ethers } from 'ethers'
import toast from '../utils/toast'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const walletStore = useWalletStore()

// 转账表单数据
const transferForm = ref({
  toAddress: '',     // 收款地址
  amount: '',        // 转账金额
  memo: ''          // 备注（可选）
})

const isTransferring = ref(false)

// 从路由参数获取代币信息
const tokenInfo = computed(() => {
  return {
    symbol: route.query.symbol as string || 'BNB',
    name: route.query.name as string || 'BNB',
    icon: route.query.icon as string || '',
    color: route.query.color as string || '#F3BA2F',
    gradient: route.query.gradient as string || 'from-yellow-400 to-yellow-600',
    balance: route.query.balance as string || '0'
  }
})

// 验证收款地址格式
const isValidAddress = computed(() => {
  if (!transferForm.value.toAddress.trim()) return true
  try {
    return ethers.isAddress(transferForm.value.toAddress.trim())
  } catch {
    return false
  }
})

// 验证转账金额
const isValidAmount = computed(() => {
  const amount = parseFloat(transferForm.value.amount)
  const balance = parseFloat(tokenInfo.value.balance)
  
  if (!transferForm.value.amount) return true
  if (isNaN(amount) || amount <= 0) return false
  if (amount > balance) return false
  
  return true
})

// 检查表单是否可以提交
const canSubmit = computed(() => {
  return transferForm.value.toAddress.trim() && 
         transferForm.value.amount && 
         isValidAddress.value && 
         isValidAmount.value && 
         !isTransferring.value
})

// 格式化余额显示
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance)
  if (isNaN(num)) return '0'
  return num.toFixed(6)
}

// 设置最大金额
const setMaxAmount = () => {
  // 如果是BNB，需要预留gas费用
  if (tokenInfo.value.symbol === 'BNB') {
    const balance = parseFloat(tokenInfo.value.balance)
    const gasReserve = 0.001 // 预留gas费用  
    const maxAmount = Math.max(0, balance - gasReserve)
    transferForm.value.amount = maxAmount.toFixed(6)
  } else {
    transferForm.value.amount = tokenInfo.value.balance
  }
}

// 执行转账
const handleTransfer = async () => {
  if (!canSubmit.value) return
  
  try {
    isTransferring.value = true
    toast.info(t('common.processing') + '...')
    
    const wallet = getEthWallet()
    if (!wallet) {
      toast.error(t('token.transfer.wallet_not_initialized'))
      return
    }

    const toAddress = transferForm.value.toAddress.trim()
    const amount = parseFloat(transferForm.value.amount)

    let result
    
    if (tokenInfo.value.symbol === 'BNB') {
      // BNB转账
      result = await wallet.sendTran(toAddress, amount)
    } else if (tokenInfo.value.symbol === 'ALPHA') {
      // ALPHA代币转账
      wallet.setABI(config.contractAbi)
      wallet.updateTokenContract(config.contractAddress)
      const amountInWei = wallet.ethToWei(amount.toString())
      result = await wallet.contractFn('transfer', toAddress, amountInWei)
    } else if (tokenInfo.value.symbol === 'USDT') {
      // USDT代币转账 
      wallet.setABI([
        {
          "inputs": [{"internalType": "address", "name": "to", "type": "address"}, 
                    {"internalType": "uint256", "name": "value", "type": "uint256"}],
          "name": "transfer",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ])
      wallet.updateTokenContract(config.USDTAddress)
      const amountInWei = wallet.ethToWei(amount.toString())
      result = await wallet.contractFn('transfer', toAddress, amountInWei)
    }

    if (result) {
      toast.success(t('token.transfer.transfer_success'))
      // 清空表单
      transferForm.value = { toAddress: '', amount: '', memo: '' }
      
      // 延迟返回上一页
      setTimeout(() => {
        router.back()
      }, 2000)
    }

  } catch (error) {
    console.error('转账失败:', error)
    let message = t('token.transfer.transfer_failed')
    
    if (error.message.includes('user rejected')) {
      message = t('token.transfer.user_cancelled')
    } else if (error.message.includes('insufficient funds')) {
      message = t('token.transfer.insufficient_funds')
    } else if (error.message.includes('network')) {
      message = t('token.transfer.network_error')
    }
    
    toast.error(message)
  } finally {
    isTransferring.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 页面初始化
onMounted(() => {
  // 检查必要参数
  if (!route.query.symbol) {
    router.replace('/token')
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
        <h1 class="text-2xl font-bold mb-6 text-center" style="color: #5BF655">
          {{ t('token.transfer.transfer_token', { token: tokenInfo.name }) }}
        </h1>

        <!-- 代币信息卡片 -->
        <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <!-- 代币图标 -->
              <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                   :class="`bg-gradient-to-br ${tokenInfo.gradient}`">
                <img :src="tokenInfo.icon" :alt="tokenInfo.name" class="w-8 h-8 object-contain" />
              </div>
              <!-- 代币信息 -->
              <div class="text-left">
                <h3 class="text-lg font-bold text-white">{{ tokenInfo.name }}</h3>
                <p class="text-gray-400 text-sm">{{ t('token.available_balance') }}: {{ formatBalance(tokenInfo.balance) }} {{ tokenInfo.symbol }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 转账表单 -->
        <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700">
          <form @submit.prevent="handleTransfer" class="space-y-6">
            <!-- 收款地址 -->
            <div>
              <label class="block text-white text-sm font-medium mb-2 text-left">{{ t('token.transfer.recipient_address') }}</label>
              <input
                v-model="transferForm.toAddress"
                type="text"
                :placeholder="t('token.transfer.recipient_address_placeholder')"
                class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 border transition-colors duration-300 focus:outline-none"
                :class="[
                  isValidAddress ? 'border-gray-700 focus:border-alpha-primary' : 'border-red-500 focus:border-red-400'
                ]"
              />
              <div v-if="!isValidAddress" class="mt-2 text-red-400 text-xs">
                {{ t('token.transfer.invalid_address') }}
              </div>
            </div>

            <!-- 转账金额 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-white text-sm font-medium text-left">{{ t('token.transfer.transfer_amount') }}</label>
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
                  v-model="transferForm.amount"
                  type="number"
                  step="0.000001"
                  :placeholder="t('token.transfer.transfer_amount_placeholder')"
                  class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 pr-20 border transition-colors duration-300 focus:outline-none"
                  :class="[
                    isValidAmount ? 'border-gray-700 focus:border-alpha-primary' : 'border-red-500 focus:border-red-400'
                  ]"
                />
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  {{ tokenInfo.symbol }}
                </div>
              </div>
              <div v-if="!isValidAmount && transferForm.amount" class="mt-2 text-red-400 text-xs">
                {{ t('token.transfer.invalid_amount') }}
              </div>
            </div>

            <!-- 备注 (可选) -->
            <div>
              <label class="block text-white text-sm font-medium mb-2 text-left">{{ t('token.transfer.memo_optional') }}</label>
              <input
                v-model="transferForm.memo"
                type="text"
                :placeholder="t('token.transfer.memo_placeholder')"
                class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-alpha-primary transition-colors duration-300"
              />
            </div>

            <!-- 转账按钮 -->
            <button
              type="submit"
              :disabled="!canSubmit"
              class="w-full py-4 text-black font-bold text-lg rounded-full transition-all duration-300"
              :class="[
                canSubmit
                  ? `bg-gradient-to-r ${tokenInfo.gradient} hover:shadow-lg`
                  : 'bg-gray-600 cursor-not-allowed'
              ]"
            >
              <span v-if="isTransferring" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ t('token.transfer.transferring') }}
              </span>
              <span v-else>{{ t('token.transfer.confirm_transfer') }}</span>
            </button>
          </form>
        </div>

        <!-- 风险提示 -->
        <div class="mt-6 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
          <div class="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-left">
              <h4 class="text-yellow-500 font-medium text-sm mb-1 text-left">{{ t('token.transfer.risk_warning.title') }}</h4>
              <p class="text-yellow-100 text-xs text-left">
                {{ t('token.transfer.risk_warning.address_warning') }}<br>
                {{ t('token.transfer.risk_warning.token_support') }}<br>
                {{ t('token.transfer.risk_warning.gas_fee') }}
              </p>
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