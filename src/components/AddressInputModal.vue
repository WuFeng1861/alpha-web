<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ethers } from 'ethers'

const { t } = useI18n()

// 定义属性
defineProps<{
  show: boolean
  title?: string
  placeholder?: string
}>()

// 定义事件
const emit = defineEmits<{
  close: []
  confirm: [address: string]
}>()

// 输入的地址
const inputAddress = ref('')

// 确认转移
const handleConfirm = () => {
  if (!inputAddress.value.trim()) {
    return
  }
  emit('confirm', inputAddress.value.trim())
  // 清空输入框
  inputAddress.value = ''
}

// 关闭弹窗
const handleClose = () => {
  // 清空输入框
  inputAddress.value = ''
  emit('close')
}

// 使用ethers验证地址格式
const isValidAddress = (address: string): boolean => {
  try {
    // 使用ethers的isAddress函数验证地址格式
    return ethers.isAddress(address)
  } catch (error) {
    return false
  }
}

// 检查输入的地址是否有效
const isAddressValid = computed(() => {
  return inputAddress.value.trim() === '' || isValidAddress(inputAddress.value.trim())
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
          {{ title || '输入转移地址' }}
        </h3>

        <!-- 说明文字 -->
        <div class="mb-4">
          <p class="text-gray-300 text-sm text-center mb-2">
            {{t('transfer.transfer_description')}}
          </p>
          <p class="text-gray-400 text-xs text-center">
            {{t('transfer.transfer_note')}}
          </p>
        </div>

        <!-- 地址输入框 -->
        <div class="mb-6">
          <label class="block text-gray-300 text-sm font-medium mb-2">
            {{t('transfer.wallet_address')}}
          </label>
          <input
            v-model="inputAddress"
            type="text"
            :placeholder="placeholder || '请输入钱包地址 (0x...)'"
            class="w-full bg-alpha-surface text-gray-300 rounded-lg px-4 py-3 border transition-colors duration-300 focus:outline-none"
            :class="[
              isAddressValid
                ? 'border-gray-700 focus:border-alpha-primary'
                : 'border-red-500 focus:border-red-400'
            ]"
          />
          <!-- 地址格式错误提示 -->
          <div v-if="!isAddressValid" class="mt-2 text-red-400 text-xs">
            {{t('transfer.invalid_address_format')}}
          </div>
          <!-- 地址格式说明 -->
          <div v-else class="mt-2 text-gray-500 text-xs">
            {{t('transfer.address_format_note')}}
          </div>
        </div>

        <!-- 按钮组 -->
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="handleClose"
            class="py-3 px-6 rounded-full font-bold bg-alpha-surface border border-gray-600 text-gray-300 hover:border-gray-500 transition-all duration-300"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            @click="handleConfirm"
            :disabled="!inputAddress.trim() || !isAddressValid"
            class="py-3 px-6 rounded-full font-bold transition-all duration-300"
            :class="[
              inputAddress.trim() && isAddressValid
                ? 'bg-alpha-primary text-black hover:bg-alpha-primary-light'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            ]"
          >
            {{ t('common.confirm') }}
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

/* 确保输入框文本颜色正确 */
input {
  color: #d1d5db !important;
}

input::placeholder {
  color: #6b7280 !important;
}
</style>
