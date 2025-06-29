<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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
      })
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
      })
    }
  }
})

// 定义props
const props = defineProps<{
  show: boolean
  nodeData: any
}>()

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
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="handleClose"></div>

      <!-- 弹窗内容 -->
      <div class="relative w-11/12 max-w-md bg-alpha-surface-light rounded-2xl p-6 z-10 border border-gray-700">
        <!-- 关闭按钮 -->
        <button
          @click="handleClose"
          class="absolute right-4 top-4 text-gray-400 hover:text-white z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- 标题 -->
        <h3 class="text-2xl font-bold mb-6 text-center" style="color: #5BF655">
          {{ nodeData?.type ? t(`node.${nodeData.type}`) : '' }}{{ t('node.exchange') }}
        </h3>

        <!-- 兑换类型选择 -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button
            @click="switchExchangeType('token')"
            :class="[
              'py-3 px-4 rounded-lg font-medium transition-all duration-300',
              exchangeType === 'token' 
                ? 'bg-alpha-primary text-black' 
                : 'bg-alpha-surface border border-gray-600 text-gray-300 hover:border-alpha-primary'
            ]"
          >
            {{ t('node.alpha_tokens') }}
          </button>
          <button
            @click="switchExchangeType('u')"
            :class="[
              'py-3 px-4 rounded-lg font-medium transition-all duration-300',
              exchangeType === 'u' 
                ? 'bg-alpha-primary text-black' 
                : 'bg-alpha-surface border border-gray-600 text-gray-300 hover:border-alpha-primary'
            ]"
          >
            {{ t('node.u_tokens') }}
          </button>
        </div>

        <!-- 兑换信息显示 -->
        <div class="bg-alpha-surface rounded-lg p-4 mb-4 border border-gray-600">
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-400 text-sm">{{ t('node.exchange_type') }}</span>
            <span class="text-white font-medium">{{ currentExchangeInfo.type }}</span>
          </div>
          <div class="flex justify-between items-center mb-2">
            <span class="text-gray-400 text-sm">{{ t('node.available_balance') }}</span>
            <span class="text-white font-medium">{{ currentExchangeInfo.available }} {{ currentExchangeInfo.unit }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-400 text-sm">{{ t('node.required_amount') }}</span>
            <span class="text-alpha-primary font-medium">{{ currentExchangeInfo.price }} {{ currentExchangeInfo.unit }}</span>
          </div>
        </div>

        <!-- 兑换说明 -->
        <div class="mb-4">
          <div class="bg-alpha-surface rounded-lg p-4 border border-gray-600">
            <p class="text-gray-300 text-sm leading-relaxed">
              {{ currentExchangeInfo.description }}
            </p>
          </div>
        </div>

        <!-- 兑换结果 -->
        <div class="bg-alpha-primary bg-opacity-10 rounded-lg p-4 mb-6 border border-alpha-primary border-opacity-30">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">{{ t('node.will_receive') }}</span>
            <span class="text-alpha-primary font-bold text-lg">
              1个 {{ nodeData?.type ? t(`node.${nodeData.type}`) : '' }}
            </span>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="handleClose"
            class="py-3 px-6 rounded-full font-bold bg-alpha-surface border border-gray-600 text-gray-300 hover:border-gray-500 transition-all duration-300"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleConfirm"
            class="py-3 px-6 rounded-full font-bold bg-alpha-primary text-black hover:bg-alpha-primary-light transition-all duration-300"
          >
            {{ t('node.confirm_purchase') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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