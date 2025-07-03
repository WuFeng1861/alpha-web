<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import ConnectWalletButton from '../components/ConnectWalletButton.vue'
import InviterModal from '../components/InviterModal.vue'
import config from '../assets/config'
import { bindInviter, claimDailyTokens, getNextClaimTime, updatePendingTokens, claimPendingTokens } from '../utils/useEthWallet'
import { useWalletStore } from '../stores/wallet'
import toast from '../utils/toast'

const { t } = useI18n()
const walletStore = useWalletStore()
const countdown = ref('')
const pendingTokens = ref<string>('0')
let timer: number | null = null

// 控制邀请人弹窗显示
const showInviterModal = ref(false)
const isClaimable = ref(true)

// 打开邀请人弹窗
const openInviterModal = () => {
  showInviterModal.value = true
}

// 更新倒计时
const updateCountdown = async () => {
  if (!walletStore.address || !walletStore.hasUpline) return

  const nextTime = await getNextClaimTime()
  if (!nextTime) return

  const now = Math.floor(Date.now() / 1000)
  const diff = nextTime - now

  if (diff <= 0) {
    isClaimable.value = true
    countdown.value = ''
    return
  }

  isClaimable.value = false
  const hours = Math.floor(diff / 3600)
  const minutes = Math.floor((diff % 3600) / 60)
  const seconds = diff % 60

  countdown.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 更新显示的待领取代币数量
const refreshPendingTokens = async () => {
  pendingTokens.value = await updatePendingTokens();
}

// 启动定时器
const startTimer = () => {
  if (timer) return
  updateCountdown()
  refreshPendingTokens()
  timer = window.setInterval(()=>{
    updateCountdown()
    refreshPendingTokens()
  }, 1000)
}

// 停止定时器
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 领取待领取的代币
const handleClaimPendingTokens = async () => {
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

  const result = await claimPendingTokens(t);
  if (!result.status) {
    console.error(result.message);
  } else {
    // 更新待领取代币数量
    refreshPendingTokens();
  }
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})

// 关闭邀请人弹窗
const closeInviterModal = () => {
  showInviterModal.value = false
}

// 确认绑定邀请人
const confirmInviter = async (address: string) => {
  const result = await bindInviter(address, t)
  if (result.status) {
    walletStore.setUplineStatus(true)
    refreshPendingTokens()
  } else {
    // 显示错误提示
    toast.error(result.message)
  }
  closeInviterModal()
}

// 签到领取
const handleClaim = async () => {
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

  const result = await claimDailyTokens(t);
  if (!result.status) {
    console.error(result.message);
  } else {
    // 更新待领取代币数量
    refreshPendingTokens()
  }
}
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 背景图片 -->
    <div
      class="absolute inset-0 bg-contain bg-center bg-no-repeat z-0"
      :style="{ backgroundImage: `url('${config.backgrounds.home}')` }"
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
        <ConnectWalletButton @showInviterModal="openInviterModal" />
      </div>
    </header>

    <!-- Main Content -->
    <div class="px-4 py-8 mt-40">
      <!-- Daily Alpha Claim Section -->
      <div class="mb-10">
        <h2 :class="[
          'font-extrabold mb-3',
          $i18n.locale === 'en' ? 'text-3xl' : 'text-4xl'
        ]" style="color: #5BF655">{{ t('home.daily_claim') }}</h2>
        <p :class="[
          'text-gray-400 mb-6',
          $i18n.locale === 'en' ? 'text-xs' : 'text-sm'
        ]">{{ t('home.claim_description') }}</p>
        <button
          @click="handleClaim"
          class="btn-primary w-2/3 mx-auto py-3 text-black font-bold relative"
        >
          <span v-if="!countdown">{{ t('home.claim_button') }}</span>
          <span v-else>{{ countdown }}</span>
        </button>
      </div>

      <!-- Pending Alpha Tokens Section -->
      <div class="rounded-xl p-6 mb-6" style="background: linear-gradient(135deg, #2A2F2F 0%, #1D2223 100%)">
        <div class="flex items-center justify-between mb-4">
          <h3 :class="[
            'font-bold text-left',
            $i18n.locale === 'en' ? 'text-lg' : 'text-xl'
          ]" style="color: #4ECD50">{{ t('home.pending_claim') }}</h3>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 cursor-pointer" style="color: #4ECD50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div class="rounded-xl p-6" style="background-color: #45D13F">
          <div :class="['flex items-center justify-start', $i18n.locale === 'en' ? 'text-3xl' : 'text-4xl']">
            <span class="text-4xl font-bold text-white">{{ pendingTokens }}</span>
            <span class="ml-2 text-xl text-white">ALPHA</span>
          </div>
          <p :class="[
            'text-black text-left my-2',
            $i18n.locale === 'en' ? 'text-xs' : 'text-sm'
          ]">{{ t('home.claimable_amount') }}</p>
          <button
            @click="handleClaimPendingTokens"
            class="btn-secondary w-full mt-4 py-3 text-black font-bold rounded-full"
            style="background: linear-gradient(to bottom right, #AEE346, #51E24B)"
          >
            {{ t('home.claim_token') }}
          </button>
        </div>
      </div>
    </div>
    </div>

    <!-- 邀请人弹窗 -->
    <InviterModal
      :show="showInviterModal"
      @close="closeInviterModal"
      @confirm="confirmInviter"
    />
  </div>
</template>
