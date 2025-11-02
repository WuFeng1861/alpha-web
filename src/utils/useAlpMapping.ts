import { ref, computed } from 'vue'
import { ethers } from 'ethers'
import config from '@/assets/config'
import multiTokenExchangeAbi from '@/assets/MultiTokenExchangeAbi'
import toast from './toast'

// 合约地址
const MAPPING_CONTRACT_ADDRESS = config.mappingContractAddress
const ALP_CONTRACT_ADDRESS = config.contractAddress
const ALPS_CONTRACT_ADDRESS = config.alpsContractAddress
const MAX_MAPPING_AMOUNT = 1000000

// ERC20 ABI
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)'
]

export function useAlpMapping() {
  // 状态
  const isLoading = ref(false)
  const isApproving = ref(false)
  const isMapping = ref(false)
  const allowance = ref<string>('0')

  // 获取provider和signer
  const getProviderAndSigner = async () => {
    if (!window.ethereum) {
      throw new Error('请安装MetaMask')
    }
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return { provider, signer }
  }

  // 获取ALP合约实例
  const getAlpContract = async () => {
    const { signer } = await getProviderAndSigner()
    return new ethers.Contract(ALP_CONTRACT_ADDRESS, ERC20_ABI, signer)
  }

  // 获取映射合约实例
  const getMappingContract = async () => {
    const { signer } = await getProviderAndSigner()
    return new ethers.Contract(MAPPING_CONTRACT_ADDRESS, multiTokenExchangeAbi, signer)
  }

  // 获取ALP余额
  const getAlpBalance = async (): Promise<string> => {
    try {
      const { provider, signer } = await getProviderAndSigner()
      const address = await signer.getAddress()
      const contract = new ethers.Contract(ALP_CONTRACT_ADDRESS, ERC20_ABI, provider)
      const balance = await contract.balanceOf(address)
      const decimals = await contract.decimals()
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error('获取ALP余额失败:', error)
      return '0'
    }
  }

  // 获取ALPS余额
  const getAlpsBalance = async (): Promise<string> => {
    try {
      const { provider, signer } = await getProviderAndSigner()
      const address = await signer.getAddress()
      const contract = new ethers.Contract(ALPS_CONTRACT_ADDRESS, ERC20_ABI, provider)
      const balance = await contract.balanceOf(address)
      const decimals = await contract.decimals()
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error('获取ALPS余额失败:', error)
      return '0'
    }
  }

  // 同时获取两种代币余额
  const getBalances = async () => {
    const [alp, alps] = await Promise.all([
      getAlpBalance(),
      getAlpsBalance()
    ])
    return { alp, alps }
  }

  // 检查授权额度
  const checkAlpAllowance = async (): Promise<string> => {
    try {
      const { signer } = await getProviderAndSigner()
      const address = await signer.getAddress()
      const alpContract = await getAlpContract()
      const allowanceAmount = await alpContract.allowance(address, MAPPING_CONTRACT_ADDRESS)
      allowance.value = ethers.formatUnits(allowanceAmount, 18)
      return allowance.value
    } catch (error) {
      console.error('检查授权失败:', error)
      allowance.value = '0'
      return '0'
    }
  }

  // 授权ALP给映射合约
  const approveAlp = async (amount: string, t?: (key: string) => string): Promise<boolean> => {
    try {
      isApproving.value = true
      const alpContract = await getAlpContract()
      const amountInWei = ethers.parseUnits(amount.toString(), 18)
      
      const tx = await alpContract.approve(MAPPING_CONTRACT_ADDRESS, amountInWei)
      toast.info(t ? t('mapping.processing') : '授权交易中...')
      
      await tx.wait()
      toast.success(t ? t('common.success') : '授权成功')
      await checkAlpAllowance()
      return true
    } catch (error: any) {
      console.error('授权失败:', error)
      if (error.code === 'ACTION_REJECTED') {
        toast.error(t ? t('common.errors.user_rejected') : '用户取消了授权')
      } else {
        toast.error(t ? t('mapping.errors.approve_failed') : '授权失败')
      }
      return false
    } finally {
      isApproving.value = false
    }
  }

  // 执行ALP到ALPS的映射
  const executeMapping = async (amount: string, t?: (key: string, params?: any) => string): Promise<boolean> => {
    toast.error(t ? t('mapping.errors.first_mapping_closed') : '第一阶段映射以关闭');
    return false;
    try {
      // 验证输入
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        toast.error(t ? t('mapping.errors.invalid_amount') : '请输入有效的映射数量')
        return false
      }

      if (numAmount > MAX_MAPPING_AMOUNT) {
        toast.error(t ? t('mapping.errors.exceeds_max_amount', { amount: MAX_MAPPING_AMOUNT.toLocaleString() }) : `单次映射不能超过 ${MAX_MAPPING_AMOUNT.toLocaleString()} ALP`)
        return false
      }

      isMapping.value = true

      // 检查余额
      const alpBalance = await getAlpBalance()
      if (parseFloat(alpBalance) < numAmount) {
        toast.error(t ? t('mapping.errors.insufficient_balance') : 'ALP余额不足')
        return false
      }

      // 检查授权
      const currentAllowance = await checkAlpAllowance()
      console.log('当前授权额度:', currentAllowance, numAmount);
      if (parseFloat(currentAllowance) < numAmount) {
        toast.info(t ? t('mapping.errors.approve_first') : '需要先授权ALP给映射合约')
        const approved = await approveAlp(amount, t)
        if (!approved) {
          return false
        }
      }

      // 执行映射
      const mappingContract = await getMappingContract()
      const amountInWei = ethers.parseUnits(amount.toString(), 18)
      
      const tx = await mappingContract.exchange(
        ALP_CONTRACT_ADDRESS,
        ALPS_CONTRACT_ADDRESS,
        amountInWei,
        '0', // 最小输出金额设为0
        { value: ethers.parseEther('0.0006') } // 发送0.0006 BNB作为交易费用
      )
      
      toast.info(t ? t('mapping.processing') : '映射交易中...')
      const receipt = await tx.wait()
      
      if (receipt.status === 1) {
        toast.success(t ? t('mapping.mapping_success', { amount }) : `成功映射 ${amount} ALP 到 ALPS`)
        return true
      } else {
        toast.error(t ? t('mapping.mapping_failed') : '映射交易失败')
        return false
      }

    } catch (error: any) {
      console.error('映射失败:', error)
      if (error.code === 'ACTION_REJECTED') {
        toast.error(t ? t('common.errors.user_rejected') : '用户取消了交易')
      } else if (error.message?.includes('insufficient allowance')) {
        toast.error(t ? t('mapping.errors.insufficient_allowance') : '授权额度不足')
      } else if (error.message?.includes('exceeds max exchange amount')) {
        toast.error(t ? t('mapping.errors.exceeds_max_amount', { amount: MAX_MAPPING_AMOUNT.toLocaleString() }) : `单次映射不能超过 ${MAX_MAPPING_AMOUNT.toLocaleString()} ALP`)
      } else {
        toast.error(t ? t('mapping.mapping_failed') : '映射失败')
      }
      return false
    } finally {
      isMapping.value = false
    }
  }

  return {
    isLoading,
    isApproving,
    isMapping,
    MAX_MAPPING_AMOUNT,
    allowance,
    getAlpBalance,
    getAlpsBalance,
    getBalances,
    checkAlpAllowance,
    approveAlp,
    executeMapping
  }
}