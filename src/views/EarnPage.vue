<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import config from '../assets/config'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import { ref, onMounted } from 'vue'
import { getTradingPairs, getTokenContracts } from '../api/trading'

const { t } = useI18n()
const showTooltip = ref(false)
const tradingPairs = ref([])
const tokenContracts = ref({})

// 获取第一个代币的logo
const getFirstTokenLogo = (symbol: string) => {
  const token = getFirstToken(symbol)
  const tokenInfo = Object.values(tokenContracts.value).find(t => t.name === token)
  return tokenInfo?.logoUrl || ''
}

// 获取第二个代币的logo
const getSecondTokenLogo = (symbol: string) => {
  const token = getSecondToken(symbol)
  const tokenInfo = Object.values(tokenContracts.value).find(t => t.name === token)
  return tokenInfo?.logoUrl || ''
}

// 获取第一个代币名称
const getFirstToken = (symbol: string) => {
  return symbol.split('-')[0]
}

// 获取第二个代币名称
const getSecondToken = (symbol: string) => {
  return symbol.split('-')[1]
}

// 获取交易对数据
const fetchTradingPairs = async () => {
  try {
    const res = await getTradingPairs()
    if (res.code === 200) {
      tradingPairs.value = res.data.sort((a, b) => Number(b.annualizedRate) - Number(a.annualizedRate))
    }
  } catch (error) {
    console.error('获取交易对失败:', error)
    tradingPairs.value = []
  }
}

// 获取代币合约数据
const fetchTokenContracts = async () => {
  try {
    const res = await getTokenContracts()
    if (res.code === 200 || res.code === 201) {
      tokenContracts.value = res.data.reduce((acc, token) => {
        acc[token.name] = {
          address: token.address,
          name: token.name,
          logoUrl: token.logoUrl
        }
        return acc
      }, {})
    } else {
      tokenContracts.value = {}
    }
  } catch (error) {
    console.error('获取代币合约失败:', error)
    tokenContracts.value = {}
  }
}

// 跳转到 PancakeSwap
const goToPancakeSwap = (symbol) => {
  const [token1, token2] = symbol.split('-')
  const address1 = tokenContracts.value[token1]?.address
  const address2 = tokenContracts.value[token2]?.address
  if (address1 && address2) {
    window.open(`https://pancakeswap.finance/add/${address1}/${address2}`, '_blank')
  }
}

onMounted(() => {
  fetchTradingPairs()
  fetchTokenContracts()
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
      <!-- 头部搜索区域 -->
      <div class="p-4 bg-alpha-surface bg-opacity-30">
        <div class="flex justify-between items-center mb-4">
          <AlphaLogo />
          <LanguageSwitcher />
        </div>

        <!-- 搜索框 -->
        <div class="relative my-2">
          <input
              type="text"
              :placeholder="t('earn.search_placeholder')"
              class="w-full h-12 mb-4 bg-alpha-surface text-gray-300 rounded-lg px-10 py-3 border border-gray-700 focus:outline-none focus:border-alpha-primary"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <!-- Banner区域 -->
        <div class="rounded-xl p-4 mb-4 relative overflow-hidden text-white" style="background: linear-gradient(135deg, rgba(42, 47, 47, 0.3) 0%, rgba(29, 34, 35, 0.3) 100%)">
          <img src="https://wufeng98.cn/imgServerApi/images/1f478a1b-5fcc-473e-b599-e6d49dd40961.png" alt="Binance Alpha Logo" class="h-12 mb-4" />
          <!-- 提示图标 -->
          <div class="absolute top-4 right-4">
            <div class="relative">
              <button
                  @click="showTooltip = !showTooltip"
                  class="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              <!-- 提示框 -->
              <div
                  v-show="showTooltip"
                  class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-gray-900 text-white rounded-lg shadow-lg p-6 z-50"
              >
                <h4 class="text-lg font-bold mb-4">{{ t('earn.tips.title') }}</h4>
                <ul class="space-y-2 text-sm">
                  <li>1. {{ t('earn.tips.apr') }}</li>
                  <li>2. {{ t('earn.tips.earnings') }}</li>
                  <li>3. {{ t('earn.tips.risk') }}</li>
                </ul>
                <!-- 关闭按钮 -->
                <button
                    @click="showTooltip = false"
                    class="absolute top-2 right-2 text-gray-400 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <!-- 遮罩层 -->
                <div
                    v-if="showTooltip"
                    class="fixed inset-0 bg-black bg-opacity-50 z-40"
                    @click="showTooltip = false"
                ></div>
              </div>
            </div>
          </div>
          <div class="text-left">
            <h2 class="text-2xl font-bold mb-2 text-white">{{ t('earn.title') }}</h2>
            <p class="text-base text-gray-500">{{ t('earn.subtitle') }}</p>
            <button class="mt-4 btn-primary w-full py-3 text-black font-bold">
              {{ t('earn.stake') }}
            </button>
          </div>
        </div>

        <!-- 流动性池 -->
        <div class="rounded-xl p-4 bg-white">
          <h3 class="text-lg font-bold mb-4 text-left" style="color: #43D43F">{{ t('earn.liquidity_pools') }}</h3>
          <div v-if="tradingPairs.length > 0" class="space-y-2">
            <div
                v-for="pair in tradingPairs"
                :key="pair.id"
                class="flex items-center justify-between py-3 rounded-lg bg-white cursor-pointer hover:bg-gray-50"
                @click="goToPancakeSwap(pair.symbol)"
            >
              <div class="flex items-center relative">
                <img
                    :src="getFirstTokenLogo(pair.symbol)"
                    :alt="getFirstToken(pair.symbol)"
                    class="w-12 h-12 rounded-full z-10"
                />
                <img
                    :src="getSecondTokenLogo(pair.symbol)"
                    :alt="getSecondToken(pair.symbol)"
                    class="w-12 h-12 rounded-full absolute left-6"
                />
                <img
                    src="https://wufeng98.cn/imgServerApi/images/c02024f0-a0d6-4001-b223-58dc34409ddd.png"
                    alt="Pancake Logo"
                    class="w-4 h-4 rounded-full absolute left-16 top-8"
                />
                <div class="flex flex-col items-start">
                  <span class="text-black text-xl ml-10">{{ pair.symbol }}</span>
                  <span class="text-gray-400 text-[10px] ml-10">PancakeSwapV3</span>
                </div>
              </div>
              <div style="color: #43D43F" class="font-bold">{{ pair.annualizedRate }}%</div>
            </div>
          </div>
          <div v-else class="text-center py-8">
            <p class="text-gray-500 text-lg mb-2">{{ $i18n.locale === 'zh' ? '暂无 Alpha 流动性推荐' : 'No Alpha liquidity recommendations' }}</p>
            <p class="text-gray-400">{{ $i18n.locale === 'zh' ? '请稍后再试' : 'Please try again later' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
