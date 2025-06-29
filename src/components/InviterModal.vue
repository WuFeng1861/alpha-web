<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// 定义属性
defineProps<{
  show: boolean
}>()

// 定义事件
const emit = defineEmits<{
  close: []
  confirm: [inviterAddress: string]
}>()

// 邀请人地址
const inviterAddress = ref(sessionStorage.getItem('inviterAddress') || '')

// 确认绑定邀请人
const handleConfirm = () => {
  emit('confirm', inviterAddress.value)
  inviterAddress.value = ''
  // 清除缓存的邀请人地址
  sessionStorage.removeItem('inviterAddress')
}

// 关闭弹窗
const handleClose = () => {
  emit('close')
  inviterAddress.value = ''
  // 清除缓存的邀请人地址
  sessionStorage.removeItem('inviterAddress')
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-50 flex items-start justify-center pt-20 overflow-y-auto">
      <!-- 遮罩层 -->
      <div class="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" @click="handleClose"></div>

      <!-- 弹窗内容 -->
      <div class="relative w-11/12 max-w-md rounded-2xl p-6 z-10 overflow-visible mb-20" style="min-height: 400px">
        <!-- 背景图片 -->
        <div
          class="absolute inset-0 bg-cover bg-center bg-no-repeat rounded-2xl"
          style="background-image: url('https://wufeng98.cn/imgServerApi/images/72dbae18-fc76-4fb1-89de-8a1d6bfe803a.png')"
        ></div>

        <!-- 关闭按钮 -->
        <button
          @click="handleClose"
          class="absolute right-4 top-4 text-gray-200 hover:text-white z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- 标题 -->
        <h3 class="text-2xl font-bold mb-6 text-center absolute -top-10 left-0 right-0 z-10" style="color: #5BF655">
          {{ t('home.bind_inviter') }}
        </h3>

        <!-- 输入框 -->
        <div class="absolute left-6 right-6 bottom-6 z-10">
          <input
            v-model="inviterAddress"
            type="text"
            :placeholder="t('home.inviter_address_placeholder')"
            class="w-full bg-alpha-surface text-gray-300 rounded-lg px-4 py-3 border border-gray-700 focus:outline-none focus:border-alpha-primary mb-4"
          />

        <!-- 确认按钮 -->
          <button
          @click="handleConfirm"
          class="w-full btn-primary py-3 text-black font-bold"
          >
          {{ t('home.confirm_inviter') }}
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
</style>
