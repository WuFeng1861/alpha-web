<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useWalletStore } from '../stores/wallet'
import { connectWallet, checkUpline } from '../utils/useEthWallet'
import { ref } from 'vue'

const { t } = useI18n()
const walletStore = useWalletStore()
const showInviterModal = ref(false)

const emit = defineEmits(['showInviterModal'])

// 连接钱包
const handleConnectWallet = async () => {
  const result = await connectWallet()
  if (result.status && result.data?.address) {
    console.log(`连接钱包`);
    walletStore.setAddress(result.data.address)

    // 检查是否绑定邀请人
    const upline = await checkUpline(result.data.address)
    const hasUpline = upline && upline !== '0x0000000000000000000000000000000000000000'
    walletStore.setUplineStatus(hasUpline)
    if (!hasUpline) {
      emit('showInviterModal')
    }
  }
}
</script>

<template>
  <button 
    @click="handleConnectWallet"
    :class="[
      'btn-connect flex items-center justify-center gap-2 px-6 py-2 pr-8',
      $i18n.locale === 'en' ? 'text-sm' : 'text-base'
    ]"
  >
    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    <span class="tracking-[0.15em]">
      {{ walletStore.address ? walletStore.formattedAddress : t('home.connect_wallet') }}
    </span>
  </button>
</template>