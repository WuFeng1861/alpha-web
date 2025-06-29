<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import BoxRewardModal from '../components/BoxRewardModal.vue'
import config from '../assets/config'
import { useWalletStore } from '../stores/wallet'
import { getNextBoxTime, openBox, openTenBox } from '../utils/useEthWallet'

const { t } = useI18n()
const walletStore = useWalletStore()

// 控制奖励弹窗显示
const showRewardModal = ref(false)
const isShareReward = ref(false)
const countdown = ref('')
let timer: number | null = null

// 更新倒计时
const updateCountdown = async () => {
  if (!walletStore.address || !walletStore.hasUpline) return

  const nextTime = await getNextBoxTime()
  if (!nextTime) return

  const now = Math.floor(Date.now() / 1000)
  const diff = nextTime - now

  if (diff <= 0) {
    countdown.value = ''
    return
  }

  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60

  countdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 启动定时器
const startTimer = () => {
  if (timer) return
  updateCountdown()
  timer = window.setInterval(updateCountdown, 1000)
}

// 停止定时器
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

// 打开普通盲盒
const handleOpenBox = async () => {
  if (!walletStore.address) {
    // 如果未连接钱包，显示连接钱包提示
    const connectButton = document.querySelector('.btn-connect');
    if (connectButton) {
      connectButton.classList.add('animate-pulse');
      setTimeout(() => {
        connectButton.classList.remove('animate-pulse');
      }, 1000);
    }
    return;
  }

  // 如果在倒计时中，显示购买太频繁的提示
  if (countdown.value) {
    toast.info(t('common.errors.purchase_too_frequent'))
    return
  }

  const result = await openBox(t)
  if (!result.status) {
    console.error(result.message)
    return
  }

  isShareReward.value = false
  showRewardModal.value = true
}

// 关闭奖励弹窗
const closeRewardModal = () => {
  showRewardModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 背景图片 -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
      :style="{ backgroundImage: `url('${config.backgrounds.box}')` }"
    ></div>

    <!-- 内容层 -->
    <div class="relative z-10">
    <!-- Header -->
    <header class="p-4 relative">
      <div class="flex justify-between items-center mb-4">
        <AlphaLogo />
        <LanguageSwitcher />
      </div>
      <div class="absolute right-0 mt-2">
        <!--<ConnectWalletButton />-->
      </div>
    </header>

    <!-- Main Content -->
    <div class="px-4 py-6 relative flex flex-col min-h-[calc(100vh-140px)] justify-end">
      <!-- 占位空间 -->
      <div class="mb-16"></div>

      <!-- 盲盒操作卡片 -->
      <div class="rounded-xl py-6 px-4 bg-opacity-30 mb-16" style="background: linear-gradient(135deg, rgba(42, 47, 47, 0.9) 0%, rgba(29, 34, 35, 0.9) 100%)">
        <div class="flex flex-col gap-4 mb-6">
          <button @click="handleOpenBox" class="btn-secondary w-full py-3 text-black font-bold rounded-full" style="background: linear-gradient(to bottom right, #AEE346, #51E24B)">
            {{ countdown ? countdown : t('box.open_box') }}
          </button>
          <!--<button @click="handleOpenShareBox" class="btn-secondary w-full py-3 text-black font-bold rounded-full" style="background: linear-gradient(to bottom right, #AEE346, #51E24B)">-->
          <!--  {{ countdown ? countdown : t('box.share_box') }}-->
          <!--</button>-->
        </div>

        <!-- 描述文字 -->
        <div class="text-sm text-gray-400 text-left">
          <p class="flex items-start gap-2 leading-relaxed tracking-[0.15em]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-alpha-primary flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {{ t('box.box_description') }}
          </p>
        </div>
      </div>

      <!-- 底部占位空间 -->
      <div class="mb-4"></div>

      <!-- Footer -->
      <footer class="flex justify-between items-center text-gray-500 text-xs absolute bottom-0 left-0 right-0 px-4 mb-4">
        <p class="text-left">{{ t('box.footer') }}</p>
        <div class="flex gap-4">
          <a
            v-for="link in config.socialLinks"
            :key="link.name"
            :href="link.url"
            :title="link.name"
            target="_blank"
            rel="noopener noreferrer"
            class="text-gray-400 hover:text-alpha-primary transition-colors"
          >
            <svg v-if="link.icon === 'twitter'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="#6FE34A" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.059 10.059 0 01-3.127 1.195 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.16a4.822 4.822 0 00-.665 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
            </svg>
            <svg v-if="link.icon === 'github'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="#6FE34A" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <svg v-if="link.icon === 'telegram'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="#6FE34A" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10-10-4.486-10-10 4.486-10 10-10zm2.784 14.184l-3.204 1.68c-.259.136-.47-.004-.47-.265v-7.206c0-.261.211-.401.47-.265l3.203 1.68c.259.136.26.355 0 .492l-3.204 1.68 3.204 1.68c.26.137.259.356 0 .492z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
    </div>

    <!-- 奖励弹窗 -->
    <BoxRewardModal
      :show="showRewardModal"
      :is-share="isShareReward"
      @close="closeRewardModal"
    />
  </div>
</template>
