import EthWallet from './ethersHelper';
import config from '../assets/config';
import { useWalletStore } from '../stores/wallet';
import { getEthWallet } from './useEthWallet';
import { ref } from 'vue';
import { getTokenBalances, updateTokenBalances } from './useTokenBalance';
import toast from './toast';

// 组合式函数：质押相关功能
export const useStaking = () => {
  // 响应式状态
  const stakingPools = ref<ProcessedPool[]>([]);
  const userStakes = ref<ProcessedStakeRecord[]>([]);
  const isLoading = ref(false);

  // 加载质押池数据
  const loadStakingPools = async (forceUpdate: boolean = false) => {
    try {
      isLoading.value = true;
      const pools = await getAllPoolsInfoWithCache(forceUpdate);
      stakingPools.value = pools;
    } catch (error) {
      console.error('加载质押池数据失败:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // 加载用户质押数据
  const loadUserStakes = async (forceUpdate: boolean = false) => {
    try {
      const stakes = await getUserStakesWithCache(forceUpdate);
      userStakes.value = stakes;
    } catch (error) {
      console.error('加载用户质押数据失败:', error);
    }
  };

  // 质押操作
  const stake = async (poolId: string, amount: string) => {
    const result = await performStaking(poolId, amount, (key: string) => key);
    if (!result.status) {
      throw new Error(result.message);
    }
    return result;
  };

  // 取消质押操作
  const unstake = async (poolId: string, amount: string) => {
    const result = await performUnstaking(poolId, amount, (key: string) => key);
    if (!result.status) {
      throw new Error(result.message);
    }
    return result;
  };

  // 领取奖励操作
  const claimRewards = async (poolId: string) => {
    const result = await performClaimDividends(poolId, (key: string) => key);
    if (!result.status) {
      throw new Error(result.message);
    }
    return result;
  };

  return {
    stakingPools,
    userStakes,
    isLoading,
    loadStakingPools,
    loadUserStakes,
    stake,
    unstake,
    claimRewards
  };
};

// 质押池结构体接口定义
export interface Pool {
  poolId: string;
  dividendAddress: string;
  dividendRatio: string; // 分红比例 (百分比)
  stakeToken: string; // 质押币种地址
  apr: string; // 年化收益率 (百分比)
  lockupPeriod: string; // 质押锁定时间(秒)
  maxStakeAmount: string; // 最大质押总量
  totalStaked: string; // 当前总质押量
  lastRewardTime: number; // 上次领取分红时间
  dividendRate: string; // 当前获取分红的速度
  moreGet: string; // 修改为 string (因为是 int256)
}

// 处理后的质押池数据接口
export interface ProcessedPool {
  id: number;
  poolType: 'gold' | 'silver' | 'bronze';
  poolName: string;
  poolColor: string;
  poolGradient: string;
  totalAmount: string;
  yearRate: string;
  status: string;
  statusColor: string;
  contractId: number;
  lockupPeriod: string; // 锁定时间（格式化后）
  maxStakeAmount: string;
  totalStaked: string;
  dividendRatio: string;
}

// 质押记录接口定义
export interface StakeRecord {
  stakeId: string;
  amount: string;
  stakeStartTime: number;
  lockedAPR: string;
  poolId: string;
  isWithdrawn: boolean;
}

// 处理后的质押数据接口
export interface ProcessedStakeRecord {
  id: number;
  poolNumber: number;
  poolType: 'gold' | 'silver' | 'bronze';
  poolName: string;
  poolColor: string;
  poolGradient: string;
  stakingAmount: string;
  yearRate: string;
  status: string;
  statusColor: string;
  stakingReward: string;
  stakeStartTime: number;
  stakeId: string;
}

// 根据poolId获取池子信息
const getPoolInfo = (poolId: string) => {
  const id = parseInt(poolId);
  
  // 定义池子分类数组
  const goldPools = [1, 5]; // 金池
  const silverPools = [2, 3, 4, 6]; // 银池
  // 其他的为铜池
  
  if (goldPools.includes(id)) {
    return {
      poolType: 'gold' as const,
      poolName: '金池',
      poolColor: '#FFD700',
      poolGradient: 'from-yellow-400 to-yellow-600'
    };
  } else if (silverPools.includes(id)) {
    return {
      poolType: 'silver' as const,
      poolName: '银池',
      poolColor: '#C0C0C0',
      poolGradient: 'from-gray-300 to-gray-500'
    };
  } else {
    // 其他所有id都归类为铜池
    return {
      poolType: 'bronze' as const,
      poolName: '铜池',
      poolColor: '#CD7F32',
      poolGradient: 'from-orange-400 to-orange-600'
    };
  }
};

// 获取用户所有质押记录
export const getUserStakes = async (forceUpdate: boolean = false): Promise<ProcessedStakeRecord[]> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    console.log('钱包未连接');
    return [];
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return [];
    }
    
    // 设置质押合约ABI和地址
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    console.log('开始获取用户质押记录...');
    
    // 调用合约获取用户所有质押记录
    const stakes = await wallet.contractFn('getAllUserStakes', walletStore.address, config.contractAddress);
    
    console.log('获取到的原始质押数据:', stakes);
    
    // 过滤掉已经取回的质押记录，并处理数据
    const filteredStakes = stakes
      .filter((stake: any) => !stake.isWithdrawn) // 过滤掉已取回的质押
    
    // 获取所有质押记录的stakeId
    const stakeIds = filteredStakes.map((stake: any) => stake.stakeId.toString());
    
    // 批量获取所有质押记录的收益
    const dividendsMap = await getBatchStakeDividendsWithCache(stakeIds, forceUpdate);
    
    // 处理质押数据
    const processedStakes: ProcessedStakeRecord[] = filteredStakes
      .map((stake: any, index: number) => {
        const poolInfo = getPoolInfo(stake.poolId.toString());
        const amount = wallet.weiToEth(stake.amount);
        const apr = (Number(stake.lockedAPR)).toString();
        const stakeStartTime = Number(stake.stakeStartTime);
        const stakeId = stake.stakeId.toString();
        
        // 从缓存中获取真实的质押收益
        const stakingReward = dividendsMap.get(stakeId) || '0';
        
        return {
          id: stakeId,
          poolNumber: Number(stake.poolId),
          ...poolInfo,
          stakingAmount: amount,
          yearRate: `${apr}%`,
          status: '进行中',
          statusColor: '#5BF655',
          stakingReward,
          stakeStartTime,
          stakeId
        };
      });
    
    console.log('处理后的质押数据:', processedStakes);
    
    return processedStakes;
  } catch (error) {
    console.error('获取用户质押记录失败:', error);
    return [];
  }
};

/**
 * 执行质押操作
 * @param poolId 质押池ID
 * @param amount 质押数量（字符串格式）
 * @param t 国际化函数
 * @returns 质押结果
 */
export const performStaking = async (
  poolId: string,
  amount: string,
  t: Function
): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    };
  }
  
  // 检查输入金额是否有效
  const stakeAmount = parseFloat(amount);
  if (isNaN(stakeAmount) || stakeAmount <= 0) {
    return {
      status: false,
      message: '请输入有效的质押数量',
      data: null
    };
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      return {
        status: false,
        message: '钱包实例未初始化',
        data: null
      };
    }
    
    console.log(`开始质押流程: 池子ID=${poolId}, 数量=${amount}`);
    
    // 第一步：检查用户ALPHA余额
    console.log('第一步：检查用户ALPHA余额...');
    const balances = await getTokenBalances(walletStore.address, true);
    const userAlphaBalance = parseFloat(balances.alphaBalance);
    
    if (userAlphaBalance < stakeAmount) {
      return {
        status: false,
        message: `余额不足！您的ALPHA余额为 ${balances.alphaBalance}，需要 ${amount}`,
        data: null
      };
    }
    
    console.log(`余额检查通过: 用户余额=${userAlphaBalance}, 需要=${stakeAmount}`);
    
    // 第二步：授权合约使用用户的ALPHA代币
    console.log('第二步：授权合约使用ALPHA代币...');
    
    // 设置ALPHA代币合约
    wallet.setABI(config.contractAbi);
    wallet.updateTokenContract(config.contractAddress);
    
    // 将数量转换为wei格式
    const amountInWei = wallet.ethToWei(amount);
    
    // 调用approve方法授权质押合约使用代币
    console.log(`授权质押合约 ${config.shakingContractAddress} 使用 ${amount} ALPHA...`);
    await wallet.contractFn('approve', config.shakingContractAddress, amountInWei);
    
    console.log('授权成功，等待确认...');
    
    // 第三步：调用质押合约的stake方法
    console.log('第三步：调用质押合约的stake方法...');
    
    // 设置质押合约
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    // 调用stake方法进行质押
    console.log(`调用stake方法: poolId=${poolId}, amount=${amountInWei.toString()}`);
    const stakeResult = await wallet.contractFn('stake', poolId, amountInWei);
    
    console.log('质押交易成功:', stakeResult);
    
    // 第四步：更新缓存数据
    console.log('第四步：更新缓存数据...');
    
    // 强制更新用户代币余额
    await updateTokenBalances(walletStore.address);
    
    // 强制更新质押池数据
    await getAllPoolsInfoWithCache(true);
    
    // 强制更新用户质押数据
    await getUserStakesWithCache(true);
    
    console.log('质押流程完成');
    
    return {
      status: true,
      message: `质押成功！已质押 ${amount} ALPHA 到池子 ${poolId}`,
      data: stakeResult
    };
    
  } catch (error) {
    console.error('质押失败:', error);
    
    let message = '质押失败';
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('insufficient funds')) {
      message = '余额不足或gas费不够';
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('execution reverted')) {
      // 合约执行失败，可能是业务逻辑错误
      if (error.message.includes('ERC20: transfer amount exceeds balance')) {
        message = 'ALPHA代币余额不足';
      } else if (error.message.includes('ERC20: transfer amount exceeds allowance')) {
        message = '授权额度不足，请重试';
      } else {
        message = '合约执行失败，请检查参数或稍后重试';
      }
    }
    
    return {
      status: false,
      message,
      data: null
    };
  }
};

// 缓存用户质押数据
const userStakesCache = ref<{
  address: string;
  stakes: ProcessedStakeRecord[];
  timestamp: number;
} | null>(null);

// 获取用户质押数据（带缓存）
export const getUserStakesWithCache = async (forceUpdate: boolean = false): Promise<ProcessedStakeRecord[]> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    return [];
  }
  
  // 如果不是强制更新且缓存存在且未过期（5分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
  
  if (!forceUpdate &&
      userStakesCache.value &&
      userStakesCache.value.address === walletStore.address &&
      (now - userStakesCache.value.timestamp) < cacheExpiry) {
    console.log('使用缓存的质押数据');
    return userStakesCache.value.stakes;
  }
  
  // 获取新数据
  const stakes = await getUserStakes(forceUpdate);
  
  // 更新缓存
  userStakesCache.value = {
    address: walletStore.address,
    stakes,
    timestamp: now
  };
  
  return stakes;
};

// 格式化锁定时间
const formatLockupPeriod = (seconds: string): string => {
  const sec = parseInt(seconds);
  const hours = Math.floor(sec / 3600);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}天`;
  } else if (hours > 0) {
    return `${hours}小时`;
  } else {
    return `${sec}秒`;
  }
};

// 获取所有质押池信息
export const getAllPoolsInfo = async (forceUpdate: boolean = false): Promise<ProcessedPool[]> => {
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return [];
    }
    
    // 设置质押合约ABI和地址
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    console.log('开始获取所有质押池信息...');
    
    // 调用合约获取所有质押池信息
    const pools = await wallet.contractFn('getAllPoolsInfo', config.contractAddress);
    
    console.log('获取到的原始质押池数据:', pools, config.contractAddress);
    
    // 处理质押池数据
    const processedPools: ProcessedPool[] = pools.map((pool: any) => {
      console.log(pool);
      const poolId = pool.poolId.toString();
      const poolInfo = getPoolInfo(poolId);
      
      // 格式化数据
      const totalAmount = wallet.weiToEth(pool.totalStaked);
      const maxAmount = wallet.weiToEth(pool.maxStakeAmount);
      const apr = (Number(pool.apr)).toString();
      const lockupPeriod = formatLockupPeriod(pool.lockupPeriod.toString());
      const dividendRate = (Number(pool.dividendRate)).toString();
      console.log(totalAmount, maxAmount, pool.totalStaked, pool.maxStakeAmount, '获取所有质押池信息');
      return {
        id: Number(poolId),
        ...poolInfo,
        totalAmount,
        yearRate: `${apr}%`,
        status: '进行中',
        statusColor: '#5BF655',
        contractId: Number(poolId), // 生成合约ID
        lockupPeriod,
        maxStakeAmount: maxAmount,
        totalStaked: totalAmount,
        dividendRate
      };
    });
    
    console.log('处理后的质押池数据:', processedPools);
    
    return processedPools;
  } catch (error) {
    console.error('获取质押池信息失败:', error);
    return [];
  }
};

// 缓存质押池数据
const poolsInfoCache = ref<{
  pools: ProcessedPool[];
  timestamp: number;
} | null>(null);

// 缓存用户质押收益数据
const stakeDividendsCache = ref<{
  address: string;
  dividends: Map<string, string>; // key: stakeId, value: dividends
  timestamp: number;
} | null>(null);

// 获取质押池数据（带缓存）
export const getAllPoolsInfoWithCache = async (forceUpdate: boolean = false): Promise<ProcessedPool[]> => {
  // 如果不是强制更新且缓存存在且未过期（10分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 10 * 60 * 1000; // 10分钟缓存（质押池信息变化较少）
  
  if (!forceUpdate &&
      poolsInfoCache.value &&
      (now - poolsInfoCache.value.timestamp) < cacheExpiry) {
    console.log('使用缓存的质押池数据', poolsInfoCache.value);
    return poolsInfoCache.value.pools;
  }
  
  // 获取新数据
  const pools = await getAllPoolsInfo(forceUpdate);
  
  // 更新缓存
  poolsInfoCache.value = {
    pools,
    timestamp: now
  };
  
  return pools;
};

// 获取用户在指定质押记录的收益
export const getStakeDividends = async (stakeId: string, forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    console.log('钱包未连接');
    return '0';
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return '0';
    }
    
    // 设置质押合约ABI和地址
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    console.log(`开始获取质押记录 ${stakeId} 的收益...`);
    
    // 调用合约获取指定质押记录的收益
    const dividends = await wallet.contractFn('getStakeDividends', walletStore.address, stakeId);
    console.log(dividends, 'getStakeDividends');
    // 转换为可读格式
    const formattedDividends = wallet.weiToEth(dividends);
    
    console.log(`质押记录 ${stakeId} 的收益:`, formattedDividends);
    
    return formattedDividends;
  } catch (error) {
    console.error(`获取质押记录 ${stakeId} 收益失败:`, error);
    return '0';
  }
};

// 获取用户质押收益（带缓存）
export const getStakeDividendsWithCache = async (stakeId: string, forceUpdate: boolean = false): Promise<string> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    return '0';
  }
  
  // 如果不是强制更新且缓存存在且未过期（1分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 1 * 60 * 1000; // 1分钟缓存（收益变化较快）
  
  if (!forceUpdate &&
      stakeDividendsCache.value &&
      stakeDividendsCache.value.address === walletStore.address &&
      (now - stakeDividendsCache.value.timestamp) < cacheExpiry &&
      stakeDividendsCache.value.dividends.has(stakeId)) {
    console.log(`使用缓存的质押收益数据 - stakeId: ${stakeId}`);
    return stakeDividendsCache.value.dividends.get(stakeId) || '0';
  }
  
  // 获取新数据
  const dividends = await getStakeDividends(stakeId, forceUpdate);
  
  // 更新缓存
  if (!stakeDividendsCache.value || stakeDividendsCache.value.address !== walletStore.address) {
    stakeDividendsCache.value = {
      address: walletStore.address,
      dividends: new Map(),
      timestamp: now
    };
  }
  
  stakeDividendsCache.value.dividends.set(stakeId, dividends);
  stakeDividendsCache.value.timestamp = now;
  
  return dividends;
};

// 批量获取多个质押记录的收益（带缓存）
export const getBatchStakeDividendsWithCache = async (stakeIds: string[], forceUpdate: boolean = false): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  
  // 并发获取所有质押记录的收益
  const promises = stakeIds.map(async (stakeId) => {
    const dividends = await getStakeDividendsWithCache(stakeId, forceUpdate);
    return { stakeId, dividends };
  });
  
  const dividendsResults = await Promise.all(promises);
  
  // 将结果存入Map
  dividendsResults.forEach(({ stakeId, dividends }) => {
    results.set(stakeId, dividends);
  });
  
  return results;
};

/**
 * 执行取消质押操作
 * @param poolId 质押池ID
 * @param amount 取消质押数量（字符串格式）
 * @param t 国际化函数
 * @returns 取消质押结果
 */
export const performUnstaking = async (
  poolId: string,
  amount: string,
  t: Function
): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    };
  }
  
  // 检查输入金额是否有效
  const unstakeAmount = parseFloat(amount);
  if (isNaN(unstakeAmount) || unstakeAmount <= 0) {
    return {
      status: false,
      message: '请输入有效的取消质押数量',
      data: null
    };
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      return {
        status: false,
        message: '钱包实例未初始化',
        data: null
      };
    }
    
    console.log(`开始取消质押流程: 池子ID=${poolId}, 数量=${amount}`);
    
    // 设置质押合约
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    // 将数量转换为wei格式
    const amountInWei = wallet.ethToWei(amount);
    
    // 调用unstake方法取消质押
    console.log(`调用unstake方法: poolId=${poolId}, amount=${amountInWei.toString()}`);
    const unstakeResult = await wallet.contractFn('unstake', poolId, amountInWei);
    
    console.log('取消质押交易成功:', unstakeResult);
    
    // 更新缓存数据
    console.log('更新缓存数据...');
    
    // 强制更新用户代币余额
    await updateTokenBalances(walletStore.address);
    
    // 强制更新质押池数据
    await getAllPoolsInfoWithCache(true);
    
    // 强制更新用户质押数据
    await getUserStakesWithCache(true);
    
    console.log('取消质押流程完成');
    
    return {
      status: true,
      message: `取消质押成功！已从池子 ${poolId} 取消质押 ${amount} ALPHA`,
      data: unstakeResult
    };
    
  } catch (error) {
    console.error('取消质押失败:', error);
    
    let message = '取消质押失败';
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('insufficient funds')) {
      message = '余额不足或gas费不够';
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('execution reverted')) {
      message = '合约执行失败，请检查参数或稍后重试';
    }
    
    return {
      status: false,
      message,
      data: null
    };
  }
};

/**
 * 执行领取分红操作
 * @param poolId 质押池ID
 * @param t 国际化函数
 * @returns 领取分红结果
 */
export const performClaimDividends = async (
  poolId: string,
  t: Function
): Promise<{status: boolean, message: string, data: any}> => {
  const walletStore = useWalletStore();
  
  // 检查钱包是否连接
  if (!walletStore.address) {
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    };
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      return {
        status: false,
        message: '钱包实例未初始化',
        data: null
      };
    }
    
    console.log(`开始领取分红流程: 池子ID=${poolId}`);
    
    // 设置质押合约
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    // 调用claimDividends方法领取分红
    console.log(`调用claimDividends方法: poolId=${poolId}`);
    const claimResult = await wallet.contractFn('claimDividends', poolId);
    
    console.log('领取分红交易成功:', claimResult);
    
    // 更新缓存数据
    console.log('更新缓存数据...');
    
    // 强制更新用户代币余额
    await updateTokenBalances(walletStore.address);
    
    // 强制更新质押池数据
    await getAllPoolsInfoWithCache(true);
    
    // 强制更新用户质押数据
    await getUserStakesWithCache(true);
    
    console.log('领取分红流程完成');
    
    return {
      status: true,
      message: `领取分红成功！已从池子 ${poolId} 领取分红`,
      data: claimResult
    };
    
  } catch (error) {
    console.error('领取分红失败:', error);
    
    let message = '领取分红失败';
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('insufficient funds')) {
      message = '余额不足或gas费不够';
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('execution reverted')) {
      message = '合约执行失败，请检查参数或稍后重试';
    }
    
    return {
      status: false,
      message,
      data: null
    };
  }
};

// NFT质押数据接口
export interface NFTStakingData {
  id: number;
  amount: string;
  claimableReward: string; // 可领取收益
  level: string;
  levelColor: string;
  levelGradient: string;
  yearRate: string;
  stakingRate: string; // 质押分红率
  status: string;
  statusColor: string;
  poolId: string;
}

// 获取用户的NFT质押数据（当前地址和质押池dividendAddress一样的池子）
export const getNFTStakingData = async (forceUpdate: boolean = false): Promise<NFTStakingData[]> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    console.log('钱包未连接');
    return [];
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return [];
    }
    
    // 设置质押合约ABI和地址
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    console.log('开始获取NFT质押数据...');
    
    // 获取所有质押池信息
    const pools = await wallet.contractFn('getAllPoolsInfo', config.contractAddress);
    
    console.log('获取到的原始质押池数据:', pools);
    
    // 过滤出当前地址和dividendAddress一样的池子
    const matchingPools = pools.filter((pool: any) =>
      pool.dividendAddress.toLowerCase() === walletStore.address.toLowerCase()
    );
    
    console.log('匹配的质押池:', matchingPools);
    
    if (matchingPools.length === 0) {
      console.log('没有找到匹配的质押池');
      return [];
    }
    
    // 处理匹配的质押池数据
    const nftStakingData: NFTStakingData[] = await Promise.all(
      matchingPools.map(async (pool: any, index: number) => {
        const poolId = pool.poolId.toString();
        const poolInfo = getPoolInfo(poolId);
        
        // 获取池子的可领取收益
        const claimableReward = await getPoolDividends(poolId, forceUpdate);
        
        // 格式化数据
        const totalAmount = wallet.weiToEth(pool.totalStaked);
        const apr = (Number(pool.apr)).toString();
        const dividendRate = (Number(pool.dividendRatio)).toString(); // 转换为百分比
        console.log(pool, dividendRate);
        
        return {
          id: index + 1,
          amount: totalAmount,
          claimableReward,
          level: poolInfo.poolType === 'gold' ? '金卡' : poolInfo.poolType === 'silver' ? '银卡' : '铜卡',
          levelColor: poolInfo.poolColor,
          levelGradient: poolInfo.poolGradient,
          yearRate: `${apr}%`,
          stakingRate: `${dividendRate}%`,
          status: '进行中',
          statusColor: '#5BF655',
          poolId
        };
      })
    );
    
    console.log('处理后的NFT质押数据:', nftStakingData);
    
    return nftStakingData;
  } catch (error) {
    console.error('获取NFT质押数据失败:', error);
    return [];
  }
};

// 缓存NFT质押数据
const nftStakingCache = ref<{
  address: string;
  data: NFTStakingData[];
  timestamp: number;
} | null>(null);

// 获取NFT质押数据（带缓存）
export const getNFTStakingDataWithCache = async (forceUpdate: boolean = false): Promise<NFTStakingData[]> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    return [];
  }
  
  // 如果不是强制更新且缓存存在且未过期（2分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 2 * 60 * 1000; // 2分钟缓存
  
  if (!forceUpdate &&
      nftStakingCache.value &&
      nftStakingCache.value.address === walletStore.address &&
      (now - nftStakingCache.value.timestamp) < cacheExpiry) {
    console.log('使用缓存的NFT质押数据');
    return nftStakingCache.value.data;
  }
  
  // 获取新数据
  const data = await getNFTStakingData(forceUpdate);
  
  // 更新缓存
  nftStakingCache.value = {
    address: walletStore.address,
    data,
    timestamp: now
  };
  
  return data;
};

// 获取质押池的可领取收益
export const getPoolDividends = async (poolId: string, forceUpdate: boolean = false): Promise<string> => {
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return '0';
    }
    
    // 设置质押合约ABI和地址
    wallet.setABI(config.shakingContractAbi);
    wallet.updateTokenContract(config.shakingContractAddress);
    
    console.log(`开始获取质押池 ${poolId} 的可领取收益...`);
    
    // 调用合约获取质押池的可领取收益
    const dividends = await wallet.contractFn('getPoolDividends', poolId);
    
    // 转换为可读格式
    const formattedDividends = wallet.weiToEth(dividends);
    
    console.log(`质押池 ${poolId} 的可领取收益:`, formattedDividends);
    
    return formattedDividends;
  } catch (error) {
    console.error(`获取质押池 ${poolId} 可领取收益失败:`, error);
    return '0';
  }
};

// 缓存质押池收益数据
const poolDividendsCache = ref<{
  dividends: Map<string, string>; // key: poolId, value: dividends
  timestamp: number;
} | null>(null);

// 获取质押池收益（带缓存）
export const getPoolDividendsWithCache = async (poolId: string, forceUpdate: boolean = false): Promise<string> => {
  // 如果不是强制更新且缓存存在且未过期（1分钟），直接返回缓存数据
  const now = Date.now();
  const cacheExpiry = 1 * 60 * 1000; // 1分钟缓存
  
  if (!forceUpdate &&
      poolDividendsCache.value &&
      (now - poolDividendsCache.value.timestamp) < cacheExpiry &&
      poolDividendsCache.value.dividends.has(poolId)) {
    console.log(`使用缓存的质押池收益数据 - poolId: ${poolId}`);
    return poolDividendsCache.value.dividends.get(poolId) || '0';
  }
  
  // 获取新数据
  const dividends = await getPoolDividends(poolId, forceUpdate);
  
  // 更新缓存
  if (!poolDividendsCache.value) {
    poolDividendsCache.value = {
      dividends: new Map(),
      timestamp: now
    };
  }
  
  poolDividendsCache.value.dividends.set(poolId, dividends);
  poolDividendsCache.value.timestamp = now;
  
  return dividends;
};