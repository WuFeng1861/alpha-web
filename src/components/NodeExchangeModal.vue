<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 定义事件
const emit = defineEmits<{
  close: []
  confirm: [type: string, amount: string]
}>()

// 兑换类型：'token' 或 'u'
const exchangeType = ref<'token' | 'u'>('token')
// 兑换数量
const exchangeAmount = ref('')

// 当前选择的兑换信息
const currentExchangeInfo = computed(() => {
  if (exchangeType.value === 'token') {
    return {
      type: t('node.alpha_tokens'),
      unit: 'ALPHA',
      available: '10000',
      price: props.nodeData?.tokens ? `${props.nodeData.tokens}${t('node.million')}` : '0',
      description: t('node.exchange_description_alpha', {
        amount: props.nodeData?.tokens || 0,
        nodeType: props.nodeData?.type ? t(`node.${props.nodeData.type}`) : t('node.title')
      }),
      icon: '🪙',
      gradient: 'from-yellow-400 via-yellow-500 to-yellow-600'
    }
  } else {
    return {
      type: t('node.u_tokens'),
      unit: 'U',
      available: '5000',
      price: props.nodeData?.uTokens ? `${props.nodeData.uTokens}` : '0',
      description: t('node.exchange_description_u', {
        amount: props.nodeData?.uTokens || 0,
        nodeType: props.nodeData?.type ? t(`node.${props.nodeData.type}`) : t('node.title')
      }),
      icon: '💰',
      gradient: 'from-green-400 via-green-500 to-green-600'
    }
  }
})

// 定义props
const props = defineProps<{
  show: boolean
  nodeData: any
}>()

// 节点类型配置
const nodeConfig = computed(() => {
  const type = props.nodeData?.type
  if (type === 'gold_node') {
    return {
      name: t('node.gold_node'),
      icon: 'https://wufeng98.cn/imgServerApi/images/55c5f24b-ab6e-4a82-a5aa-d0a30613ae11.png',
      color: '#FFD700',
      gradient: 'from-yellow-300 via-yellow-400 to-yellow-500',
      bgPattern: 'radial-gradient(circle at 30% 40%, rgba(255,215,0,0.3), transparent 70%)',
      decorativeIcons: ['✨', '💎', '⭐', '🔥']
    }
  } else if (type === 'silver_node') {
    return {
      name: t('node.silver_node'),
      icon: 'https://wufeng98.cn/imgServerApi/images/aa44f88b-d3a9-41f1-9f0e-6041a3261741.png',
      color: '#C0C0C0',
      gradient: 'from-gray-300 via-gray-400 to-gray-500',
      bgPattern: 'radial-gradient(circle at 30% 40%, rgba(192,192,192,0.3), transparent 70%)',
      decorativeIcons: ['⚡', '💫', '🌟', '🔱']
    }
  } else {
    return {
      name: t('node.bronze_node'),
      icon: 'https://wufeng98.cn/imgServerApi/images/03d90adf-daf8-4bbe-a8f2-2c779d3f1cf3.png',
      color: '#CD7F32',
      gradient: 'from-orange-300 via-orange-400 to-orange-500',
      bgPattern: 'radial-gradient(circle at 30% 40%, rgba(205,127,50,0.3), transparent 70%)',
      decorativeIcons: ['⚡', '🌟', '🔸', '💥']
    }
  }
})

// 切换兑换类型
const switchExchangeType = (type: 'token' | 'u') => {
  exchangeType.value = type
  // 自动设置为节点所需的代币数量
  if (type === 'token') {
    exchangeAmount.value = props.nodeData?.tokens ? (props.nodeData.tokens * 10000).toString() : '0'
  } else {
    exchangeAmount.value = props.nodeData?.uTokens?.toString() || '0'
  }
}

// 初始化金额
const initializeAmount = () => {
  if (exchangeType.value === 'token') {
    exchangeAmount.value = props.nodeData?.tokens ? (props.nodeData.tokens * 10000).toString() : '0'
  } else {
    exchangeAmount.value = props.nodeData?.uTokens?.toString() || '0'
  }
}

// 确认兑换
const handleConfirm = () => {
  const requiredAmount = exchangeType.value === 'token'
      ? (props.nodeData?.tokens || 0) * 10000
      : (props.nodeData?.uTokens || 0)

  if (!exchangeAmount.value || parseFloat(exchangeAmount.value) !== requiredAmount) {
    return
  }
  emit('confirm', exchangeType.value, exchangeAmount.value)
  handleClose()
}

// 关闭弹窗
const handleClose = () => {
  exchangeType.value = 'token'
  initializeAmount()
  emit('close')
}

// 监听nodeData变化，初始化金额
watch(() => props.nodeData, () => {
  if (props.nodeData) {
    initializeAmount()
  }
}, { immediate: true })

// 监听兑换类型变化
watch(exchangeType, () => {
  initializeAmount()
})
</script>

<template>
  <Transition name="modal">
    <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
    >
      <!-- 遮罩层 -->
      <div
          class="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
          @click="handleClose"
      ></div>

      <!-- 弹窗容器 - 优化尺寸 -->
      <div
          class="relative w-full max-w-sm max-h-[85vh] rounded-3xl z-10 overflow-hidden shadow-2xl transform-gpu flex flex-col"
          @click.stop
      >
        <!-- 节点主题背景 -->
        <div class="absolute inset-0 opacity-90"
             :style="`background: linear-gradient(135deg, ${nodeConfig.color}15 0%, ${nodeConfig.color}05 50%, ${nodeConfig.color}15 100%)`"></div>

        <!-- 装饰性背景图案 -->
        <div class="absolute inset-0 opacity-20"
             :style="`background: ${nodeConfig.bgPattern}`"></div>

        <!-- 内容区域 -->
        <div class="relative bg-gray-900/95 backdrop-blur-md border border-yellow-300/20 rounded-3xl flex flex-col h-full">

          <!-- 可滚动的内容区域 -->
          <div
              class="flex-1 overflow-y-auto p-6 pb-2"
              style="scrollbar-width: none; -ms-overflow-style: none;"
          >

            <!-- 关闭按钮 -->
            <button
                @click="handleClose"
                class="absolute right-4 top-4 text-yellow-100 hover:text-white z-10 p-2 rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- 节点卡片展示 -->
            <div class="text-center mb-6 pt-4">
              <!-- 主节点图标 -->
              <div class="relative mb-4">
                <div class="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center relative overflow-hidden"
                     :style="`background: linear-gradient(135deg, ${nodeConfig.gradient}); box-shadow: 0 8px 32px rgba(0,0,0,0.3)`">
                  <!-- 光泽效果 -->
                  <div class="absolute inset-1 rounded-xl bg-gradient-to-br from-white/30 to-transparent"></div>

                  <!-- 节点图标 -->
                  <img
                      :src="nodeConfig.icon"
                      :alt="nodeConfig.name"
                      class="w-12 h-12 z-10 object-contain"
                  />

                  <!-- 装饰性小图标 -->
                  <div
                      v-for="(icon, index) in nodeConfig.decorativeIcons"
                      :key="index"
                      class="absolute text-sm animate-pulse"
                      :style="`
                      ${index === 0 ? 'top: -8px; right: -8px;' : ''}
                      ${index === 1 ? 'bottom: -8px; left: -8px;' : ''}
                      ${index === 2 ? 'top: -8px; left: -8px;' : ''}
                      ${index === 3 ? 'bottom: -8px; right: -8px;' : ''}
                      animation-delay: ${index * 0.5}s;
                    `"
                  >
                    {{ icon }}
                  </div>
                </div>
              </div>

              <h3 class="text-xl font-bold text-white mb-2">
                {{ nodeConfig.name }}
              </h3>

              <div class="w-16 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full"></div>
            </div>

            <!-- 兑换类型选择 -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <button
                  @click="switchExchangeType('token')"
                  :class="[
                  'relative overflow-hidden py-3 px-3 rounded-xl font-medium transition-all duration-300 transform-gpu',
                  exchangeType === 'token'
                    ? 'bg-yellow-400 text-gray-900 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <div class="flex items-center justify-center space-x-1">
                  <img
                      src="https://wufeng98.cn/imgServerApi/images/4d35f283-bf43-459b-be74-a1c1810f19a6.png"
                      alt="ALPHA"
                      class="w-5 h-5 object-contain"
                  />
                  <span class="text-sm">ALPHA</span>
                </div>
              </button>

              <button
                  @click="switchExchangeType('u')"
                  :class="[
                  'relative overflow-hidden py-3 px-3 rounded-xl font-medium transition-all duration-300 transform-gpu',
                  exchangeType === 'u'
                    ? 'bg-green-400 text-gray-900 shadow-lg scale-105'
                    : 'bg-white/20 text-white hover:bg-white/30'
                ]"
              >
                <div class="flex items-center justify-center space-x-1">
                  <img
                      src="http://wufeng98.cn/imgServerApi/images/8b4ac19c-a29c-490f-9a91-6ffe467fed7e.png"
                      alt="USDT"
                      class="w-5 h-5 object-contain"
                  />
                  <span class="text-sm">USDT</span>
                </div>
              </button>
            </div>

            <!-- 兑换信息卡片 -->
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-5 border border-white/20">
              <div class="space-y-3">
                <!-- 所需数量 -->
                <div class="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                  <span class="text-white/80 text-sm flex items-center">
                    <span class="mr-2">⚡</span>
                    {{ t('node.required_amount') }}
                  </span>
                  <span class="text-yellow-200 font-bold">{{ currentExchangeInfo.price }} {{ currentExchangeInfo.unit }}</span>
                </div>

                <!-- 将获得 -->
                <div class="flex justify-between items-center p-3 bg-green-500/20 rounded-lg border border-green-400/30">
                  <span class="text-white/80 text-sm flex items-center">
                    <span class="mr-2">🎁</span>
                    {{ t('node.will_receive') }}
                  </span>
                  <span class="text-green-300 font-bold">1 {{ nodeConfig.name }}</span>
                </div>
              </div>
            </div>

            <!-- 底部间距 -->
            <div class="h-4"></div>
          </div>

          <!-- 固定在底部的按钮区域 -->
          <div class="flex-shrink-0 p-6 pt-3 bg-gradient-to-t from-black/30 to-transparent">
            <div class="grid grid-cols-2 gap-3">
              <button
                  @click="handleClose"
                  class="py-3 px-4 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {{ t('common.cancel') }}
              </button>

              <button
                  @click="handleConfirm"
                  class="py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  :style="`background: linear-gradient(135deg, ${nodeConfig.gradient}); box-shadow: 0 6px 20px ${nodeConfig.color}60, 0 0 30px ${nodeConfig.color}40; filter: brightness(1.2);`"
              >
                <div class="flex items-center justify-center space-x-1" style="color: #FFD700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                  <span>⚡</span>
                  <span class="text-sm">{{ t('node.confirm_purchase') }}</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- 装饰性粒子效果 -->
        <div
            v-for="(icon, index) in ['✨', '💫', '⭐', '🌟']"
            :key="index"
            class="absolute w-2 h-2 text-yellow-400 animate-pulse pointer-events-none"
            :style="`
            ${index === 0 ? 'top: 10%; right: 15%;' : ''}
            ${index === 1 ? 'top: 20%; left: 10%;' : ''}
            ${index === 2 ? 'bottom: 30%; right: 20%;' : ''}
            ${index === 3 ? 'bottom: 20%; left: 15%;' : ''}
            animation-delay: ${index * 0.8}s;
          `"
        >
          {{ icon }}
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 确保按钮hover效果平滑 */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 增强transform效果 */
.transform-gpu {
  transform: translateZ(0);
}

/* 确保滚动区域的平滑滚动 */
.overflow-y-auto {
  /* 隐藏滚动条样式 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE和Edge */
  scroll-behavior: smooth;
  /* 针对移动端的滚动优化 */
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* 隐藏Webkit滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}
</style>
