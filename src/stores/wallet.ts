import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

export const useWalletStore = defineStore('wallet', () => {
  const { t } = useI18n()
  
  // 钱包地址
  const address = ref('')
  // 是否已绑定邀请人
  const hasUpline = ref(false)
  
  // 设置钱包地址
  function setAddress(newAddress: string) {
    address.value = newAddress
  }
  
  // 设置邀请人状态
  function setUplineStatus(status: boolean) {
    hasUpline.value = status
  }
  
  // 格式化地址显示(前5位...后3位)
  const formattedAddress = computed((): string => {
    if (!address.value) return ''
    if (!hasUpline.value) {
      return `${address.value.slice(0, 5)}...(${t('common.unbind')})`
    }
    const prefix = address.value.slice(0, 5)
    const suffix = `...${address.value.slice(-3)}`
    return prefix + suffix
  })
  
  // 清除钱包地址
  function clearAddress() {
    address.value = ''
    hasUpline.value = false
  }
  
  return {
    address,
    hasUpline,
    setAddress,
    setUplineStatus,
    formattedAddress,
    clearAddress,
  }
})