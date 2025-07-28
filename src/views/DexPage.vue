<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { useWalletStore } from '../stores/wallet'

const { t } = useI18n()
const router = useRouter()
const walletStore = useWalletStore()

// 交易模式：买入或卖出
const tradeMode = ref<'buy' | 'sell'>('buy')

// 交易输入数据
const fromAmount = ref('100000')
const toAmount = ref('200')
const fromToken = ref('BoBo')
const toToken = ref('BNB')
const tokenLogo = ref({
  BoBo: 'https://wufeng98.cn/imgServerApi/images/63d52292-8b7b-42e5-82d4-d7a892e06ab3.png',
  BNB: 'https://wufeng98.cn/imgServerApi/images/7151f34e-2b93-4684-91e9-c74d25d1c70f.png'
})

// 汇率信息
const exchangeRate = ref('1 BNB = 500 BoBo')
const estimatedValue = ref('200 BNB')

// 切换交易模式
const switchTradeMode = (mode: 'buy' | 'sell') => {
  tradeMode.value = mode
  // 切换时交换代币
  if (mode === 'buy') {
    fromToken.value = 'BNB'
    toToken.value = 'BoBo'
    fromAmount.value = '200'
    toAmount.value = '100000'
  } else {
    fromToken.value = 'BoBo'
    toToken.value = 'BNB'
    fromAmount.value = '100000'
    toAmount.value = '200'
  }
}

// 交换代币位置
const swapTokens = () => {
  const tempToken = fromToken.value
  const tempAmount = fromAmount.value

  fromToken.value = toToken.value
  toToken.value = tempToken
  fromAmount.value = toAmount.value
  toAmount.value = tempAmount

  // 同时切换交易模式
  tradeMode.value = tradeMode.value === 'buy' ? 'sell' : 'buy'
}

// 执行交易
const executeTrade = () => {
  console.log('执行交易:', {
    mode: tradeMode.value,
    from: fromToken.value,
    to: toToken.value,
    fromAmount: fromAmount.value,
    toAmount: toAmount.value
  })
  // 这里添加实际的交易逻辑
}

</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 内容层 -->
    <div class="relative z-10">
      <!-- Header -->
      <header class="p-4 relative">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <AlphaLogo />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <!-- 灰色背景卡片 -->
      <div class="px-4 py-6 space-y-6 ">
        <div class="bg-[#222627] bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <!-- 页面标题 -->
          <div class="text-center mb-6">
            <p class="text-gray-400 text-sm mb-2">下一代交易平台 | 安全 • 高速 • 低费率</p>
          </div>

          <!-- 买入/卖出切换按钮 -->
          <div class="grid grid-cols-2 mb-6 bg-alpha-surface-light rounded-lg p-1">
            <button
                @click="switchTradeMode('buy')"
                :class="[
                'py-2 px-4 font-bold transition-all duration-300 rounded-l-lg',
                tradeMode === 'buy'
                  ? 'bg-[#4EBB4B] text-white'
                  : 'text-gray-400 hover:text-white'
              ]"
            >
              买入
            </button>
            <button
                @click="switchTradeMode('sell')"
                :class="[
                'py-2 px-4 font-bold transition-all duration-300 rounded-r-lg',
                tradeMode === 'sell'
                  ? 'bg-[#4EBB4B] text-white'
                  : 'text-gray-400 hover:text-white'
              ]"
            >
              卖出
            </button>
          </div>

          <!-- 交易表单 -->
          <div class="space-y-4">
            <!-- 兑换货币卡片 -->
            <div class="bg-alpha-surface-light rounded-lg p-4">
              <!-- 标题和余额 -->
              <div class="flex justify-between items-center mb-4">
                <span class="text-white text-base font-medium">兑换货币</span>
                <span class="text-bobo-green text-base font-medium">{{ tradeMode === 'buy' ? '买入' : '卖出' }} BoBo</span>
              </div>

              <!-- 支付部分 -->
              <div class="mb-4">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-bobo-green text-sm">支付</span>
                  <span class="text-gray-400 text-sm">余额: 1000000 {{ fromToken }}</span>
                </div>

                <div class="flex items-center space-x-3">
                  <!-- 融合的代币输入框 -->
                  <div class="flex bg-[#181C1D] border border-bobo-green rounded-lg overflow-hidden w-full">
                    <!-- 代币图标和名称 -->
                    <div class="flex items-center bg-[#4EBB4B] px-3 py-2 flex-shrink-0">
                      <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                        <img :src="tokenLogo[fromToken]">
                      </div>
                      <span class="text-black font-bold">{{ fromToken }}</span>
                    </div>

                    <!-- 金额输入 -->
                    <input
                        v-model="fromAmount"
                        type="number"
                        class="flex-1 bg-transparent text-white text-right text-xl font-bold outline-none px-3 py-2 min-w-0"
                        placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <!-- 交换按钮 -->
              <div class="flex justify-center mb-4">
                <button
                    @click="swapTokens"
                    class="p-3 bg-alpha-surface-light rounded-full hover:bg-alpha-surface transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#4EBB4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              <!-- 获得部分 -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-400 text-sm">获得</span>
                  <span class="text-bobo-green text-sm">余额: 0.25 {{ toToken }}</span>
                </div>

                <div class="flex items-center space-x-3">
                  <!-- 融合的代币输入框 -->
                  <div class="flex bg-[#181C1D] border border-bobo-green rounded-lg overflow-hidden w-full">
                    <!-- 代币图标和名称 -->
                    <div class="flex bg-[#4EBB4B] px-3 py-2 flex-shrink-0">
                      <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                        <!--<span class="text-[#4EBB4B] font-bold text-sm">{{ toToken.charAt(0) }}</span>-->
                        <img :src="tokenLogo[toToken]">
                      </div>
                      <span class="text-black font-bold">{{ toToken }}</span>
                    </div>

                    <!-- 金额输入 -->
                    <input
                        v-model="toAmount"
                        type="number"
                        class="flex-1 bg-transparent text-white text-right text-xl font-bold outline-none px-3 py-2 min-w-0"
                        placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 汇率信息 -->
            <div class="text-center text-bobo-green text-sm">
              <p>当前汇率：{{ exchangeRate }}</p>
            </div>

            <!-- 预估获得 -->
            <div class="text-center">
              <p class="text-gray-400 text-sm mb-1">你将获得</p>
              <p class="text-[#4EBB4B] text-2xl font-bold">$ {{ estimatedValue }}</p>
            </div>

            <!-- 立即买入按钮 -->
            <button
                @click="executeTrade"
                class="w-full py-2 bg-[#4EBB4B] text-black font-bold text-lg rounded-lg hover:bg-[#45a043] transition-all duration-300 shadow-lg"
            >
              {{ tradeMode === 'buy' ? '立即买入' : '立即卖出' }}
            </button>
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

/* 隐藏数字输入框的增加减少按钮 */
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
