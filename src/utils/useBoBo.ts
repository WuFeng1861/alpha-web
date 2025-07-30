import {getEthWallet} from './useEthWallet.ts';
import config from '../assets/config.ts';
import {useWalletStore} from '../stores/wallet.ts';
import {getBoBoBalance, getTokenBalances} from './useTokenBalance.ts';

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
    console.log(wallet.weiToEth(reserves[0]), wallet.weiToEth(reserves[1]));
    if (!reserves[0] || !reserves[1]) {
      console.log('查询储备失败');
      return {
        buy: 0,
        sell: 0,
      };
    }
    const buy = Number(Number((reserves[1] / reserves[0])).toFixed(6));
    const sell = Number(Number((reserves[0] / (reserves[1]))).toFixed(6));
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
export const boboSwapTokens = async (amountIn: number, isBuy: boolean, t: Function): Promise<{
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
    if (isBuy) {
      // 检查用户bnb余额是否足够
      const balance = await wallet.getAddressEthBalance(walletStore.address);
      if (Number(balance) < amountIn) {
        return {
          status: false,
          message: t('BoBo.tips.BNBNotEnough'),
          data: null
        };
      }
      let result = await wallet.sendTran(config.boboContractAddress, amountIn);
      if (result.status) {
        return {
          status: true,
          message: t('BoBo.tips.SwapTokenSuccess'),
          data: null
        };
      }
      throw new Error(result.message)
    }
    // 如果是isBuy false 转账bobo代币到bobo合约地址
    // 检查用户bobo代币余额是否足够
    const balance = await getBoBoBalance(walletStore.address);
    if (Number(balance) < amountIn) {
      return {
        status: false,
        message: t('BoBo.tips.BoBoCoinNotEnough'),
        data: null
      };
    }
    wallet.setABI(config.boboAbi)
    wallet.updateTokenContract(config.boboContractAddress);
    const amountInWei = wallet.ethToWei(amountIn.toString())
    await wallet.contractFn('transfer', config.boboContractAddress, amountInWei)
    return {
      status: true,
      message: t('BoBo.tips.SwapTokenSuccess'),
      data: null
    }
  } catch (error: any) {
    console.error('swapTokensError:', error);
    
    let message = t('BoBo.tips.SwapTokenFailed');
    
    if (error.message.includes('user rejected')) {
      message = t('common.errors.user_rejected');
    } else if (error.message.includes('Sender must wait for cooldown')) {
      message = t('BoBo.tips.swap_wait')
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

// 购买0.006bnb的bobo
export const dailyBuy = async (t: Function): Promise<{ status: boolean; message: string; data: any }> => {
  const bnbValue = 0.0006;
  const isBuy = true;
  return await boboSwapTokens(bnbValue, isBuy, t);
}
