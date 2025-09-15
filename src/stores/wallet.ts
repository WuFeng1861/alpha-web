import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ethers } from 'ethers'
import { formatBalance } from '@/utils/utils'
import { useAlpMapping } from '@/utils/useAlpMapping'
import {getAlphaBalance} from '@/utils/useTokenBalance'
import config from '@/assets/config'

export const useWalletStore = defineStore('wallet', () => {
  const { t } = useI18n()
  
  // 钱包地址
  const address = ref('')
  // 是否已绑定邀请人
  const hasUpline = ref(false)
  
  // 代币余额
  const alpBalance = ref<string>('0')
  const alpsBalance = ref<string>('0')
  
  // ALPS合约地址
  const ALPS_CONTRACT_ADDRESS = config.alpsContractAddress
  
  // ERC20标准ABI
  const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ]
  
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
  
  // 格式化的ALP余额（保留2位小数）
  const formattedAlpBalance = computed(() => {
    console.log(111,alpBalance.value, formatBalance(alpBalance.value, 2))
    return formatBalance(alpBalance.value, 2)
  })
  
  // 格式化的ALPS余额（保留2位小数）
  const formattedAlpsBalance = computed(() => formatBalance(alpsBalance.value, 2))
  
  // 获取ALP余额
  const updateAlpBalance = async () => {
    let formattedBalance = await getAlphaBalance(address.value);
    alpBalance.value = formattedBalance
    return formattedBalance;
  }
  
  // 获取ALPS余额
  const updateAlpsBalance = async () => {
    if (!address.value) return '0'
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const alpsContract = new ethers.Contract(ALPS_CONTRACT_ADDRESS, ERC20_ABI, provider)
      
      const balance = await alpsContract.balanceOf(address.value)
      const decimals = await alpsContract.decimals()
      
      const formattedBalance = ethers.formatUnits(balance, decimals)
      alpsBalance.value = formattedBalance
      return formattedBalance
    } catch (error) {
      console.error('获取ALPS余额失败:', error)
      return '0'
    }
  }
  
  // 更新所有余额
  const updateBalances = async () => {
    if (!address.value) return
    
    try {
      await Promise.all([
        updateAlpBalance(),
        updateAlpsBalance()
      ])
    } catch (error) {
      console.error('更新余额失败:', error)
    }
  }
  
  // 使用useAlpMapping进行真实的ALP到ALPS映射
  const mapAlpToAlps = async (amount: string): Promise<boolean> => {
    if (!address.value) {
      // toast.error('请先连接钱包')
      return false
    }
    console.log('映射金额:', amount)
    const { executeMapping } = useAlpMapping()
    return await executeMapping(amount, t)
  }

  // 检查ALP授权额度
  const checkAlpAllowance = async (): Promise<string> => {
    if (!address.value) return '0'
    
    const { checkAlpAllowance: checkAllowance } = useAlpMapping()
    return await checkAllowance(address.value)
  }

  // 授权ALP给映射合约
  const approveAlpForMapping = async (amount: string): Promise<boolean> => {
    if (!address.value) {
      // toast.error('请先连接钱包')
      return false
    }

    const { approveAlp } = useAlpMapping()
    return await approveAlp(amount, t)
  }
  
  // 清除钱包地址
  function clearAddress() {
    address.value = ''
    hasUpline.value = false
    alpBalance.value = '0'
    alpsBalance.value = '0'
  }
  
  return {
    address,
    hasUpline,
    alpBalance,
    alpsBalance,
    formattedAlpBalance,
    formattedAlpsBalance,
    setAddress,
    setUplineStatus,
    formattedAddress,
    updateAlpBalance,
    updateAlpsBalance,
    updateBalances,
    mapAlpToAlps,
    checkAlpAllowance,
    approveAlpForMapping,
    clearAddress,
  }
})