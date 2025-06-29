<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

const visible = ref(false)
const message = ref('')
const type = ref<'success' | 'error' | 'info'>('info')
let timer: number | null = null

// 显示toast
const show = (options: ToastOptions) => {
  // 如果已经有toast在显示，先清除定时器
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  
  message.value = options.message
  type.value = options.type || 'info'
  visible.value = true
  
  // 设置定时器自动关闭
  timer = window.setTimeout(() => {
    hide()
  }, options.duration || 2000)
}

// 隐藏toast
const hide = () => {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

// 导出方法供外部使用
defineExpose({
  show,
  hide
})
</script>

<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg cursor-pointer"
      :class="[
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
      ]"
      @click="hide"
    >
      <p class="text-white text-sm font-medium">{{ message }}</p>
    </div>
  </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>