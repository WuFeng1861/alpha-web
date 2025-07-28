<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'

const { t } = useI18n()

// 复制功能
const showCopied = ref(false)
const alphaAddress = '0x8A4D3D7A9F1B23D8A2E3D4C'

const copyAddress = () => {
  navigator.clipboard.writeText(alphaAddress).then(() => {
    showCopied.value = true
    setTimeout(() => {
      showCopied.value = false
    }, 2000)
  })
}

// 下拉选择状态
const selectedToken1 = ref('ALP代币选择')
const selectedToken2 = ref('BNB')
const selectedAmount = ref('1000')

const token1Options = ['ALP代币选择', 'ALPHA', 'BoBo']
const token2Options = ['BNB']
const amountOptions = ['1000', '5000', '10000', '50000']

const showToken1Dropdown = ref(false)
const showToken2Dropdown = ref(false)
const showAmountDropdown = ref(false)

const selectToken1 = (option: string) => {
  selectedToken1.value = option
  showToken1Dropdown.value = false
}

const selectToken2 = (option: string) => {
  selectedToken2.value = option
  showToken2Dropdown.value = false
}

const selectAmount = (option: string) => {
  selectedAmount.value = option
  showAmountDropdown.value = false
}
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
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
      <div class="px-4 py-6 space-y-6">
        <!-- 每日签到卡片 -->
        <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-bobo-green">
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-bobo-green rounded-lg flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-l font-bold text-white">每日签到</h2>
            </div>
            <div class="text-right">
              <p class="text-white text-sm">今日奖励:<span class="text-bobo-green text-sm">赠送BoBo</span></p>
            </div>
          </div>

          <!-- BoBo 图标区域 -->
          <div class="text-center mb-6">
            <!-- BoBo 图片 -->
            <div class="relative inline-block">
              <img
                  src="https://wufeng98.cn/imgServerApi/images/63d52292-8b7b-42e5-82d4-d7a892e06ab3.png"
                  alt="BoBo"
                  class="w-48 h-48 mx-auto object-contain"
              />
            </div>
          </div>

          <!-- 签到按钮 -->
          <button class="w-full py-4 bg-gradient-to-r from-bobo-green to-[#4EBB4B] text-white font-bold text-lg rounded-full mb-4 hover:shadow-lg transition-all duration-300">
            点击金币签到
          </button>

          <!-- 说明文字 -->
          <p class="text-gray-300 text-sm text-left leading-relaxed mb-4">
            每日签到可获得随机数量的 BoBo 代币奖励！连续签到奖励更多,奖励结算平均,奖励将直接发放到您的钱包,可用于交易或参与生态建设:
          </p>

          <!-- ALPHA代币地址 -->
          <div class="bg-alpha-surface rounded-lg p-3 flex items-center justify-between">
            <div class="flex-1">
              <p class="text-gray-400 text-xs mb-1">BoBo代币合约地址</p>
              <p class="text-white text-sm font-mono break-all">{{ alphaAddress }}</p>
            </div>
            <button
                @click="copyAddress"
                class="ml-3 px-4 py-2 bg-bobo-green text-black font-bold rounded-lg text-sm hover:bg-bobo-green-light transition-colors duration-300"
            >
              {{ showCopied ? '已复制' : '复制' }}
            </button>
          </div>
        </div>

        <!-- 生态代币卡片 -->
        <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-bobo-green">
          <!-- 标题栏 -->
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-bobo-green rounded-lg flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 class="text-xl font-bold text-white">生态代币</h2>
          </div>

          <!-- ALP 平台币 -->
          <div class="bg-alpha-surface rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-bobo-green rounded-full flex items-center justify-center mr-3">
                  <span class="text-black font-bold">A</span>
                </div>
                <div>
                  <h3 class="text-white font-bold text-left">ALP 平台币</h3>
                  <p class="text-bobo-green font-bold">15,320.00 ALP</p>
                </div>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="mb-3">
              <div class="flex justify-between text-sm text-gray-400 mb-1">
                <span>正在进行中</span>
                <span>210 亿</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-bobo-green h-2 rounded-full" style="width: 65%"></div>
              </div>
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>15.3 ALP</span>
              </div>
            </div>

            <div class="mb-3">
              <div class="flex justify-between text-sm text-gray-400 mb-1">
                <span>以销毁</span>
                <span>29 亿</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-bobo-green h-2 rounded-full" style="width: 45%"></div>
              </div>
              <div class="text-sm text-gray-400 mt-1">
                <span>已完成</span>
              </div>
            </div>
          </div>

          <!-- 比特币 -->
          <div class="bg-alpha-surface rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <img src="https://wufeng98.cn/imgServerApi/images/63d52292-8b7b-42e5-82d4-d7a892e06ab3.png"/>
                </div>
                <div>
                  <h3 class="text-white font-bold text-left">BoBo</h3>
                  <p class="text-yellow-400 font-bold">0.125 BoBo</p>
                </div>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="mb-3">
              <div class="flex justify-between text-sm text-gray-400 mb-1">
                <span>正在进行中</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2">
                <div class="bg-yellow-500 h-2 rounded-full" style="width: 20%"></div>
              </div>
              <div class="flex justify-between text-sm text-gray-400 mt-1">
                <span>总量</span>
                <span>4.2%</span>
              </div>
            </div>

            <button class="w-full py-2 bg-gray-600 text-gray-300 rounded-lg text-sm">
              上线即可接进行交易
            </button>
          </div>
        </div>

        <!-- 创建交易对卡片 -->
        <div class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-bobo-green">
          <!-- 标题栏 -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-bobo-green rounded-lg flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h2 class="text-xl font-bold text-white">创建交易对</h2>
            </div>
            <div class="text-right">
              <p class="text-white text-sm">手续费:0.3%</p>
            </div>
          </div>

          <!-- 表单 -->
          <div class="space-y-4">
            <!-- 选择代币1 -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">选择代币 1</label>
              <div class="relative">
                <button
                    @click="showToken1Dropdown = !showToken1Dropdown"
                    class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 text-left flex items-center justify-between border border-gray-600 hover:border-bobo-green transition-colors duration-300"
                >
                  <span>{{ selectedToken1 }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div v-if="showToken1Dropdown" class="absolute top-full left-0 right-0 bg-alpha-surface border border-gray-600 rounded-lg mt-1 z-10">
                  <button
                      v-for="option in token1Options"
                      :key="option"
                      @click="selectToken1(option)"
                      class="w-full text-left px-4 py-2 text-white hover:bg-bobo-green hover:text-black transition-colors duration-300"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 选择代币2 -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">选择代币 2</label>
              <div class="relative">
                <button
                    @click="showToken2Dropdown = !showToken2Dropdown"
                    class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 text-left flex items-center justify-between border border-gray-600 hover:border-bobo-green transition-colors duration-300"
                >
                  <span>{{ selectedToken2 }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div v-if="showToken2Dropdown" class="absolute top-full left-0 right-0 bg-alpha-surface border border-gray-600 rounded-lg mt-1 z-10">
                  <button
                      v-for="option in token2Options"
                      :key="option"
                      @click="selectToken2(option)"
                      class="w-full text-left px-4 py-2 text-white hover:bg-bobo-green hover:text-black transition-colors duration-300"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 数量选择 -->
            <div>
              <label class="block text-gray-300 text-sm font-medium mb-2">数量选择</label>
              <div class="relative">
                <button
                    @click="showAmountDropdown = !showAmountDropdown"
                    class="w-full bg-alpha-surface text-white rounded-lg px-4 py-3 text-left flex items-center justify-between border border-gray-600 hover:border-bobo-green transition-colors duration-300"
                >
                  <span>{{ selectedAmount }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div v-if="showAmountDropdown" class="absolute top-full left-0 right-0 bg-alpha-surface border border-gray-600 rounded-lg mt-1 z-10">
                  <button
                      v-for="option in amountOptions"
                      :key="option"
                      @click="selectAmount(option)"
                      class="w-full text-left px-4 py-2 text-white hover:bg-bobo-green hover:text-black transition-colors duration-300"
                  >
                    {{ option }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 创建按钮 -->
            <button class="w-full py-3 bg-bobo-green text-black font-bold rounded-lg hover:bg-bobo-green-light transition-colors duration-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              创建交易对
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

/* 下拉菜单动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
