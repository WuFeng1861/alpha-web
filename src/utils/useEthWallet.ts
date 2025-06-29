import EthWallet from './ethersHelper';
import config from '../assets/config';
import { useWalletStore } from '../stores/wallet';
import toast from './toast';
import { ref, computed } from 'vue';
import axios from 'axios';
import { updateTokenBalances, clearTokenBalanceCache } from './useTokenBalance';

let etherWallet = new EthWallet();

// 缓存团队规模数据
const teamSizeCache = ref<{
  address: string;
  size: string;
  timestamp: number;
} | null>(null);

// 缓存直推列表数据
const directRefsCache = ref<{
  address: string;
  refs: Array<{address: string; count: number}>;
  timestamp: number;
} | null>(null);

// 缓存用户贡献点数据
const contributionsCache = ref<{
  address: string;
  amount: string;
  received: string;
  level: number;
  timestamp: number;
} | null>(null);

// 缓存下次可签到时间
const nextClaimTimeCache = ref<{
  address: string;
  time: number;
  timestamp: number;
} | null>(null);

// 缓存下次可开盲盒时间
const nextBoxTimeCache = ref<{
  address: string;
  time: number;
  timestamp: number;
} | null>(null);

// 缓存待领取代币数量
const pendingTokensCache = ref<{
  address: string;
  amount: string;
  timestamp: number;
} | null>(null);

// 获取待领取代币数量
export const updatePendingTokens = async (forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return '0';
  }
  
  // 如果不是强制更新且缓存存在，直接返回缓存的数量
  const now = Date.now();
  if (!forceUpdate &&
      pendingTokensCache.value &&
      pendingTokensCache.value.address === walletStore.address) {
    return pendingTokensCache.value.amount;
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    const amount = await etherWallet.contractFn('getPendingTokens', walletStore.address);
    const formattedAmount = Number(etherWallet.weiToEth(amount)).toString();
    
    // 更新缓存
    pendingTokensCache.value = {
      address: walletStore.address,
      amount: formattedAmount,
      timestamp: now
    };
    
    return formattedAmount;
  } catch (error) {
    console.error('获取待领取代币失败:', error);
    return '0';
  }
};

// 连接钱包并进行链的切换
export const connectWallet = async (accountChange: boolean = false, targetChainId: number = EthWallet.BINANCE.chainId, targetChainParams: any = EthWallet.BINANCE): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  if(EthWallet.walletList.length !== 0 && etherWallet.userAddress?.toLowerCase() && !accountChange) {
    return {
      status: true,
      message: 'wallet connect success',
      data: {
        address: etherWallet.userAddress,
      }
    };
  }
  
  const chainId = await (window as any).ethereum.request({method: 'eth_chainId'});
  console.log('connectWallet', (window as any).ethereum.chainId, chainId, `0x${targetChainId.toString(16)}`);
  
  if (chainId !== `0x${targetChainId.toString(16)}`) {
    let result = await etherWallet.toSwitch(targetChainId, targetChainParams);
    return {
      status: result,
      message: result ? 'switch chain success' : 'switch chain fail',
      data: null
    }
  }
  
  let result = await etherWallet.initAnyChain();
  if(!result.status) {
    return result;
  }
  
  EthWallet.walletList = [etherWallet];
  
  // 监听钱包账户变化
  (window as any).ethereum.once('accountsChanged', async () => {
    let resultTemp = await connectWallet(true);
    if (resultTemp.status && resultTemp.data?.address) {
      console.log(`连接钱包`);
      walletStore.setAddress(resultTemp.data.address)
      
      // 账户变化后，清除旧缓存并获取新的代币余额
      clearTokenBalanceCache();
      updateTokenBalances(resultTemp.data.address).catch(error => {
        console.error('获取代币余额失败:', error);
      });
    
      // 检查是否绑定邀请人
      const upline = await checkUpline(resultTemp.data.address)
      const hasUpline = upline && upline !== '0x0000000000000000000000000000000000000000'
      walletStore.setUplineStatus(hasUpline)
    }
  })
  
  return result;
}

// 检查用户是否绑定了邀请人
export const checkUpline = async (address: string): Promise<string> => {
  if (!etherWallet) return '';
  
  // 如果是合约发布者地址，直接返回非零地址表示已绑定
  if (address.toLowerCase() === config.creatorAddress.toLowerCase()) {
    return '0x0000000000000000000000000000000001';
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    console.log(`检查用户是否绑定了邀请人`);
    const upline = await etherWallet.contractFn('getUpline', address);
    console.log(`检查用户是否绑定了邀请人:${upline}`);
    return upline;
  } catch (error) {
    console.error('检查邀请人失败:', error);
    return '';
  }
}

// 绑定邀请人
export const bindInviter = async (inviterAddress: string, t: Function): Promise<{status: boolean, message: string, data: any}> => {
  if (!etherWallet) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    }
  }

  try {
    // 验证地址格式
    if (!etherWallet.isAddress(inviterAddress)) {
      return {
        status: false,
        message: t('common.errors.invalid_address'),
        data: null
      }
    }

    // 检查是否是创建者地址
    const isCreator = inviterAddress.toLowerCase() === config.creatorAddress.toLowerCase()
    
    // 如果不是创建者地址，才需要检查邀请人是否已绑定上级
    if (!isCreator) {
      const inviterUpline = await checkUpline(inviterAddress)
      if (!inviterUpline || inviterUpline === '0x0000000000000000000000000000000000000000') {
        return {
          status: false,
          message: t('common.errors.inviter_not_bound'),
          data: null
        }
      }
    }

    // 调用合约绑定方法
    etherWallet.setABI(config.contractAbi)
    etherWallet.updateTokenContract(config.contractAddress)
    
    // 调用合约的bindUpline方法，同时发送0.0006 BNB
    await etherWallet.contractFn('bindUpline', inviterAddress, {
      value: etherWallet.ethToWei('0.0006')
    })
    
    toast.success(t('common.success'))

    return {
      status: true,
      message: t('common.success'),
      data: null
    }
  } catch (error) {
    console.error('绑定邀请人失败:', error)
    let message = t('common.errors.binding_failed')
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected')
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error')
    }
    toast.info(message)
    return {
      status: false,
      message,
      data: null
    }
  }
}

// 获取下次可签到时间
export const getNextClaimTime = async (forceUpdate: boolean = false): Promise<number | null> => {
  if (!etherWallet) return null;
  
  // 如果不是强制更新且缓存存在，直接返回缓存的时间
  const now = Date.now();
  if (!forceUpdate &&
      nextClaimTimeCache.value &&
      nextClaimTimeCache.value.address === etherWallet.userAddress) {
    return nextClaimTimeCache.value.time;
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    const nextTime = await etherWallet.contractFn('getNextPurchaseTime', etherWallet.userAddress);
    console.log(`获取下次可签到时间:${nextTime}`);
    
    // 更新缓存
    nextClaimTimeCache.value = {
      address: etherWallet.userAddress,
      time: Number(nextTime),
      timestamp: now
    };
    
    return Number(nextTime);
  } catch (error) {
    console.error('获取下次签到时间失败:', error);
    return null;
  }
}

// 获取下次可开盲盒时间
export const getNextBoxTime = async (forceUpdate: boolean = false): Promise<number | null> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return null;
  }
  
  // 如果不是强制更新且缓存存在，直接返回缓存的时间
  const now = Date.now();
  if (!forceUpdate &&
      nextBoxTimeCache.value &&
      nextBoxTimeCache.value.address === walletStore.address) {
    return nextBoxTimeCache.value.time;
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    const nextTime = await etherWallet.contractFn('getNextBoxPurchaseTime', walletStore.address);
    
    // 更新缓存
    nextBoxTimeCache.value = {
      address: walletStore.address,
      time: Number(nextTime),
      timestamp: now
    };
    
    return Number(nextTime);
  } catch (error) {
    console.error('获取下次开盲盒时间失败:', error);
    return null;
  }
}

// 开启普通盲盒
export const openBox = async (t: Function): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!etherWallet || !walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    }
  }
  
  // 检查是否已绑定邀请人
  if (!walletStore.hasUpline) {
    return {
      status: false,
      message: t('common.errors.not_bound'),
      data: null
    }
  }

  try {
    // 设置合约ABI和地址
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    
    // 调用合约的purchaseBox方法，同时发送0.0006 BNB
    await etherWallet.contractFn('purchaseBox', {
      value: etherWallet.ethToWei('0.0006')
    });
    
    // 强制更新下次开盲盒时间的缓存
    await getNextBoxTime(true);
    toast.success(t('common.success'));

    return {
      status: true,
      message: t('common.success'),
      data: null
    }
  } catch (error) {
    console.error('开启盲盒失败:', error);
    let message = t('common.errors.claim_failed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('Purchase too frequent')) {
      message = t('common.errors.purchase_too_frequent');
    }
    toast.info(message);
    
    return {
      status: false,
      message,
      data: null
    }
  }
}

// 获取直推列表及其下级数量
export const getDirectRefsList = async (forceUpdate: boolean = false): Promise<Array<{address: string; count: number}>> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return [];
  }
  
  // 如果不是强制更新且缓存存在，直接返回缓存数据
  const now = Date.now();
  if (!forceUpdate &&
      directRefsCache.value &&
      directRefsCache.value.address === walletStore.address) {
    return directRefsCache.value.refs;
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    
    // 获取直推地址列表
    const refs = await etherWallet.contractFn('getDirectRefs', walletStore.address);
    
    // 获取每个直推地址的下级数量
    const refsWithCount = await Promise.all(
      refs.map(async (address: string) => {
        const count = await etherWallet.contractFn('getTeamSize', address);
        return {
          address,
          count: Number(count)
        };
      })
    );
    
    // 更新缓存
    directRefsCache.value = {
      address: walletStore.address,
      refs: refsWithCount,
      timestamp: now
    };
    
    return refsWithCount;
  } catch (error) {
    console.error('获取直推列表失败:', error);
    return [];
  }
};

// 获取当前钱包实例
export const getEthWallet = () => {
  if(EthWallet.walletList.length === 0 || !etherWallet) {
    return null;
  }
  return etherWallet;
};

// 导出实例化的钱包对象（用于其他模块使用）
export const getWalletInstance = (): EthWallet => {
  return etherWallet;
};

// 签到领取代币
export const claimDailyTokens = async (t: Function): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!etherWallet || !walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    }
  }
  
  // 检查是否已绑定邀请人
  if (!walletStore.hasUpline) {
    return {
      status: false,
      message: t('common.errors.not_bound'),
      data: null
    }
  }

  try {
    // 设置合约ABI和地址
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    
    // 调用合约的purchaseTokens方法，同时发送0.0006 BNB
    await etherWallet.contractFn('purchaseTokens', {
      value: etherWallet.ethToWei('0.0006')
    });
    // 强制更新下次可签到时间的缓存
    await getNextClaimTime(true);
    // 更新代币余额
    await updateTokenBalances();
    toast.success(t('common.success'))

    return {
      status: true,
      message: t('common.success'),
      data: null
    }
  } catch (error) {
    console.error('签到领取失败:', error);
    let message = t('common.errors.claim_failed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('Purchase too frequent')) {
      message = t('common.errors.purchase_too_frequent');
    }
    toast.info(message)
    
    return {
      status: false,
      message,
      data: null
    }
  }
}

// 领取待领取的代币
export const claimPendingTokens = async (t: Function): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!etherWallet || !walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    }
  }
  
  // 检查是否已绑定邀请人
  if (!walletStore.hasUpline) {
    return {
      status: false,
      message: t('common.errors.not_bound'),
      data: null
    }
  }
  
  // 检查待领取代币数量
  const pendingAmount = await updatePendingTokens();
  if (Number(pendingAmount) <= 0) {
    return {
      status: false,
      message: t('common.errors.no_pending_tokens'),
      data: null
    }
  }

  try {
    // 设置合约ABI和地址
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    
    // 调用合约的claimPendingTokens方法，同时发送0.0006 BNB
    await etherWallet.contractFn('claimPendingTokens', {
      value: etherWallet.ethToWei('0.0006')
    });
    
    // 强制更新待领取代币数量的缓存
    await updatePendingTokens(true);
    // 更新代币余额
    await updateTokenBalances();
    toast.success(t('common.success'));

    return {
      status: true,
      message: t('common.success'),
      data: null
    }
  } catch (error) {
    console.error('领取代币失败:', error);
    let message = t('common.errors.claim_failed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    }
    toast.info(message);
    
    return {
      status: false,
      message,
      data: null
    }
  }
}

// 领取BNB奖励
export const claimBNBReward = async (t: Function): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!etherWallet || !walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    }
  }
  
  // 检查是否已绑定邀请人
  if (!walletStore.hasUpline) {
    return {
      status: false,
      message: t('common.errors.not_bound'),
      data: null
    }
  }
  
  try {
    // 获取用户贡献点
    const { amount } = await getContributions();
    if (Number(amount) <= 0) {
      return {
        status: false,
        message: t('common.errors.no_contribution'),
        data: null
      }
    }
    
    // 设置合约ABI和地址
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    
    // 调用合约的claimContribution方法，同时发送0.0006 BNB
    await etherWallet.contractFn('claimContribution', {
      value: etherWallet.ethToWei('0.0006')
    });
    
    // 强制更新贡献点缓存
    await getContributions(true);
    // 更新代币余额
    await updateTokenBalances();
    toast.success(t('common.success'));

    return {
      status: true,
      message: t('common.success'),
      data: null
    }
  } catch (error) {
    console.error('领取BNB失败:', error);
    let message = t('common.errors.claim_failed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    }
    toast.info(message);
    
    return {
      status: false,
      message,
      data: null
    }
  }
}

// 计算等级
const calculateLevel = (contributions: string): number => {
  const value = Number(contributions);
  if (value >= 1000000) return 10;
  if (value >= 100000) return 9;
  if (value >= 50000) return 8;
  if (value >= 30000) return 7;
  if (value >= 10000) return 6;
  if (value >= 2000) return 5;
  if (value >= 500) return 4;
  if (value >= 100) return 3;
  if (value >= 30) return 2;
  if (value >= 1) return 1;
  return 0;
}

// 获取用户贡献点
export const getContributions = async (forceUpdate: boolean = false): Promise<{amount: string; level: number}> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return {amount: '0', level: 0};
  }
  
  // 如果不是强制更新且缓存存在，直接返回缓存数据
  const now = Date.now();
  if (!forceUpdate &&
      contributionsCache.value &&
      contributionsCache.value.address === walletStore.address) {
    return {
      amount: contributionsCache.value.amount,
      received: contributionsCache.value.received,
      level: contributionsCache.value.level
    };
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    const amount = await etherWallet.contractFn('getContributions', walletStore.address);
    let receivedAmount = await getContributionsReceived();
    const formattedAmount = Number(amount) + Number(receivedAmount);
    const level = calculateLevel(formattedAmount.toString());
    
    // 更新缓存
    contributionsCache.value = {
      address: walletStore.address,
      amount: amount.toString(),
      received: receivedAmount,
      level,
      timestamp: now
    };
    
    return {amount: amount.toString(), level, received: receivedAmount};
  } catch (error) {
    console.error('获取贡献点失败:', error);
    return {amount: '0', level: 0};
  }
};

// 获取用户以领取贡献点
export const getContributionsReceived = async (): Promise<string> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return '0';
  }
  try {
    let result = await axios.get(`https://alpha.ac.cn/alphaServerApi/api/contribution/${walletStore.address}`);
    return result.data.contribution.toString();
  } catch (error) {
    console.error('获取以领取贡献点失败：', error);
    return '0';
  }
};

// 获取团队规模
export const getTeamSize = async (forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address || !walletStore.hasUpline) {
    return '0';
  }
  
  // 如果不是强制更新且缓存存在，直接返回缓存数据
  const now = Date.now();
  if (!forceUpdate &&
      teamSizeCache.value &&
      teamSizeCache.value.address === walletStore.address) {
    return teamSizeCache.value.size;
  }
  
  try {
    etherWallet.setABI(config.contractAbi);
    etherWallet.updateTokenContract(config.contractAddress);
    const size = await etherWallet.contractFn('getTeamSize', walletStore.address);
    
    // 更新缓存
    teamSizeCache.value = {
      address: walletStore.address,
      size: size.toString(),
      timestamp: now
    };
    
    return size.toString();
  } catch (error) {
    console.error('获取团队规模失败:', error);
    return '0';
  }
};

