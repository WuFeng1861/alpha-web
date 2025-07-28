import {getEthWallet} from './useEthWallet.ts';
import config from '../assets/config.ts';
import {useWalletStore} from '../stores/wallet.ts';

// 查询储备
const BoBoRateCache = {buy: 0, sell: 0};
export const getBoBoReserves = async (refresh: boolean = false): Promise<{ buy: number, sell: number }> => {
  if (!refresh && BoBoRateCache.buy) {
    return BoBoRateCache;
  }
  try {
    const wallet = getEthWallet();
    if (!wallet) {
      console.log('钱包实例未初始化');
      return {
        buy: 0,
        sell: 0,
      };
    }
    // 设置质押合约ABI和地址
    wallet.setABI(config.boboAbi);
    wallet.updateTokenContract(config.boboContractAddress);
    
    // 查询储备
    const reserves = await wallet.contractFn('getReserves');
    // console.log(reserves[0], reserves[1]);
    if (!reserves[0] || !reserves[1]) {
      console.log('查询储备失败');
      return {
        buy: 0,
        sell: 0,
      };
    }
    const buy = Number(Number((reserves[1] / 10000n / reserves[0])).toFixed(6));
    const sell = Number(Number((reserves[0] / (reserves[1] / 10000n))).toFixed(6));
    return {buy, sell};
  } catch (error) {
    console.log(error, 'getBoBoReserves error');
    return {
      buy: 0,
      sell: 0,
    };
  }
};
// 计算获得币
export const getRewardCoin = async (amount: number, isBuy: boolean): Promise<number> => {
  if (amount <= 0) {
    return 0;
  }
  try {
    const wallet = getEthWallet();
    if (!wallet) {
      console.log('钱包实例未初始化');
      return 0;
    }
    // 设置质押合约ABI和地址
    wallet.setABI(config.boboAbi);
    wallet.updateTokenContract(config.boboContractAddress);
    
    // 计算获得
    const amountIn = wallet.ethToWei(amount);
    const amountOut = await wallet.contractFn('getAmountOut', amountIn, isBuy);
    return Number(wallet.weiToEth(amountOut));
  } catch (error) {
    console.log(error, 'getRewardCoin error');
    return 0;
  }
};

// 发起兑换
export const swapTokens = (amountIn: number, isBuy: boolean, t?: Function): Promise<{
  status: boolean,
  message: string,
  data: any
}> => {
  const walletStore = useWalletStore();
  
  if (!walletStore.address) {
    console.log('钱包未连接');
    return {
      status: false,
      message: t('common.errors.wallet_not_connected'),
      data: null
    };
  }
  
  try {
    const wallet = getEthWallet();
    
    if (!wallet) {
      console.log('钱包实例未初始化');
      return {
        status: false,
        message: t('staking.errors.wallet_not_initialized'),
        data: null
      };
    }
    // 如果是isBuy true 转账bnb到bobo合约地址
    // 如果是isBuy false 转账bobo代币到bobo合约地址
    
  } catch (error) {
    console.error('领取质押池收益失败:', error);
    
    let message = t('staking.errors.claim_pool_dividends_failed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('insufficient funds')) {
      message = t('staking.errors.insufficient_funds_or_gas');
    } else if (error.message.includes('network')) {
      message = t('common.errors.network_error');
    } else if (error.message.includes('execution reverted')) {
      message = t('staking.errors.contract_execution_failed');
    }
    
    return {
      status: false,
      message,
      data: null
    };
  }
};
