import EthWallet from './ethersHelper';
import config from '../assets/config';
import { useWalletStore } from '../stores/wallet';
import { getEthWallet } from './useEthWallet';
import { ref } from 'vue';

// USDT合约ABI（简化版，只包含balanceOf方法）
const USDT_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
];

// 代币余额缓存接口
interface TokenBalanceCache {
  address: string;
  alphaBalance: string;
  usdtBalance: string;
  timestamp: number;
}

// 缓存代币余额数据
const tokenBalanceCache = ref<TokenBalanceCache | null>(null);

/**
 * 获取用户的ALPHA代币余额
 * @param userAddress 用户地址
 * @param forceUpdate 是否强制更新缓存
 * @returns ALPHA代币余额（格式化后的字符串）
 */
export const getAlphaBalance = async (userAddress?: string, forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  const address = userAddress || walletStore.address;
  
  if (!address) {
    console.log('用户地址为空，无法获取ALPHA余额');
    return '0';
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return '0';
    }
    
    // 设置ALPHA代币合约ABI和地址
    wallet.setABI(config.contractAbi);
    wallet.updateTokenContract(config.contractAddress);
    
    console.log(`开始获取用户 ${address} 的ALPHA代币余额...`);
    
    // 调用合约的balanceOf方法获取余额
    const balance = await wallet.contractFn('balanceOf', address);
    
    // 转换为可读格式（从wei转换为ether）
    const formattedBalance = wallet.weiToEth(balance);
    
    console.log(`用户 ${address} 的ALPHA余额:`, formattedBalance);
    
    return formattedBalance;
  } catch (error) {
    console.error('获取ALPHA代币余额失败:', error);
    return '0';
  }
};

/**
 * 获取用户的USDT代币余额
 * @param userAddress 用户地址
 * @param forceUpdate 是否强制更新缓存
 * @returns USDT代币余额（格式化后的字符串）
 */
export const getUSDTBalance = async (userAddress?: string, forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  const address = userAddress || walletStore.address;
  
  if (!address) {
    console.log('用户地址为空，无法获取USDT余额');
    return '0';
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return '0';
    }
    
    // 设置USDT代币合约ABI和地址
    wallet.setABI(USDT_ABI);
    wallet.updateTokenContract(config.USDTAddress);
    
    console.log(`开始获取用户 ${address} 的USDT代币余额...`);
    
    // 调用合约的balanceOf方法获取余额
    const balance = await wallet.contractFn('balanceOf', address);
    
    // USDT通常使用18位小数，转换为可读格式
    const formattedBalance = wallet.weiToEth(balance);
    
    console.log(`用户 ${address} 的USDT余额:`, formattedBalance);
    
    return formattedBalance;
  } catch (error) {
    console.error('获取USDT代币余额失败:', error);
    return '0';
  }
};

/**
 * 获取用户的代币余额（带缓存）
 * @param userAddress 用户地址
 * @param forceUpdate 是否强制更新缓存
 * @returns 包含ALPHA和USDT余额的对象
 */
export const getTokenBalances = async (userAddress?: string, forceUpdate: boolean = false): Promise<{
  alphaBalance: string;
  usdtBalance: string;
}> => {
  const walletStore = useWalletStore();
  const address = userAddress || walletStore.address;
  
  if (!address) {
    return {
      alphaBalance: '0',
      usdtBalance: '0'
    };
  }
  
  // 如果不是强制更新且缓存存在且未过期（2分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 2 * 60 * 1000; // 2分钟缓存
  
  if (!forceUpdate &&
      tokenBalanceCache.value &&
      tokenBalanceCache.value.address === address &&
      (now - tokenBalanceCache.value.timestamp) < cacheExpiry) {
    console.log('使用缓存的代币余额数据');
    return {
      alphaBalance: tokenBalanceCache.value.alphaBalance,
      usdtBalance: tokenBalanceCache.value.usdtBalance
    };
  }
  
  try {
    console.log(`开始获取用户 ${address} 的代币余额...`);
    
    // 并发获取ALPHA和USDT余额
    const [alphaBalance, usdtBalance] = await Promise.all([
      getAlphaBalance(address, forceUpdate),
      getUSDTBalance(address, forceUpdate)
    ]);
    
    // 更新缓存
    tokenBalanceCache.value = {
      address,
      alphaBalance,
      usdtBalance,
      timestamp: now
    };
    
    console.log('代币余额获取完成:', { alphaBalance, usdtBalance });
    
    return {
      alphaBalance,
      usdtBalance
    };
  } catch (error) {
    console.error('获取代币余额失败:', error);
    return {
      alphaBalance: '0',
      usdtBalance: '0'
    };
  }
};

/**
 * 更新代币余额缓存
 * @param userAddress 用户地址
 * @returns 更新后的代币余额
 */
export const updateTokenBalances = async (userAddress?: string): Promise<{
  alphaBalance: string;
  usdtBalance: string;
}> => {
  return await getTokenBalances(userAddress, true);
};

/**
 * 清除代币余额缓存
 */
export const clearTokenBalanceCache = (): void => {
  tokenBalanceCache.value = null;
  console.log('代币余额缓存已清除');
};

/**
 * 获取缓存的代币余额（不发起网络请求）
 * @param userAddress 用户地址
 * @returns 缓存的代币余额，如果没有缓存则返回null
 */
export const getCachedTokenBalances = (userAddress?: string): {
  alphaBalance: string;
  usdtBalance: string;
} | null => {
  const walletStore = useWalletStore();
  const address = userAddress || walletStore.address;
  
  if (!address || !tokenBalanceCache.value || tokenBalanceCache.value.address !== address) {
    return null;
  }
  
  return {
    alphaBalance: tokenBalanceCache.value.alphaBalance,
    usdtBalance: tokenBalanceCache.value.usdtBalance
  };
};

/**
 * 检查缓存是否过期
 * @param userAddress 用户地址
 * @returns 缓存是否过期
 */
export const isTokenBalanceCacheExpired = (userAddress?: string): boolean => {
  const walletStore = useWalletStore();
  const address = userAddress || walletStore.address;
  
  if (!address || !tokenBalanceCache.value || tokenBalanceCache.value.address !== address) {
    return true;
  }
  
  const now = Date.now();
  const cacheExpiry = 2 * 60 * 1000; // 2分钟缓存
  
  return (now - tokenBalanceCache.value.timestamp) >= cacheExpiry;
};