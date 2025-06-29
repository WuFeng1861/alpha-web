<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {ref, onMounted, onUnmounted} from 'vue';
import {useRouter} from 'vue-router';
import AlphaLogo from '../components/AlphaLogo.vue';
import LanguageSwitcher from '../components/LanguageSwitcher.vue';
import AddressInputModal from '../components/AddressInputModal.vue';
import config from '../assets/config';
import {useWalletStore} from '../stores/wallet';
import {
  claimPoolDividends,
  getNFTStakingDataWithCache,
  getPoolDividendsWithCache,
  transferPoolOwner,
  type NFTStakingData
} from '../utils/useStaking';
import toast from '../utils/toast';

const {t} = useI18n();
const router = useRouter();
const walletStore = useWalletStore();

// 格式化数字，保留两位小数但去除尾部的0和小数点
const formatNumber = (num: string | number): string => {
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numValue)) return '0';

  // 保留两位小数
  const formatted = numValue.toFixed(2);
  // 去除尾部的0和小数点
  return formatted.replace(/\.?0+$/, '');
};

// NFT质押数据
const nftStakingList = ref<NFTStakingData[]>([]);
const isLoading = ref(false);

// 控制地址输入弹窗显示
const showAddressModal = ref(false);
// 当前要转移的NFT质押记录
const currentTransferNFT = ref<NFTStakingData | null>(null);

// 定时器
let nftStakingTimer: number | null = null;
let dividendsTimer: number | null = null;

// 更新NFT质押数据
const updateNFTStakingData = async (forceUpdate: boolean = false) => {
  if (!walletStore.address) {
    nftStakingList.value = [];
    return;
  }

  if (!forceUpdate && isLoading.value) {
    return; // 防止重复请求
  }

  try {
    isLoading.value = true;
    console.log('开始更新NFT质押数据...');
    const data = await getNFTStakingDataWithCache(forceUpdate);
    nftStakingList.value = data;
    console.log('NFT质押数据更新完成:', data);
  } catch (error) {
    console.error('更新NFT质押数据失败:', error);
    nftStakingList.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 更新可领取收益数据
const updateClaimableRewards = async (forceUpdate: boolean = false) => {
  if (!walletStore.address || nftStakingList.value.length === 0) {
    return;
  }

  try {
    console.log('开始更新可领取收益数据...');

    // 并发获取所有质押池的可领取收益
    const promises = nftStakingList.value.map(async (nft) => {
      const claimableReward = await getPoolDividendsWithCache(nft.poolId, forceUpdate);
      return {id: nft.id, claimableReward};
    });

    const rewardsResults = await Promise.all(promises);

    // 更新NFT质押列表中的可领取收益数据
    nftStakingList.value.forEach(nft => {
      const result = rewardsResults.find(r => r.id === nft.id);
      if (result) {
        nft.claimableReward = result.claimableReward;
      }
    });

    console.log('可领取收益数据更新完成');
  } catch (error) {
    console.error('更新可领取收益数据失败:', error);
  }
};

// 启动定时器更新NFT质押数据
const startNFTStakingTimer = () => {
  if (nftStakingTimer) return;
  updateNFTStakingData(true); // 立即执行一次
  nftStakingTimer = window.setInterval(() => {
    updateNFTStakingData(); // 每5分钟更新一次
  }, 5 * 60 * 1000);
};

// 启动定时器更新可领取收益数据
const startDividendsTimer = () => {
  if (dividendsTimer) return;
  updateClaimableRewards(true); // 立即执行一次
  dividendsTimer = window.setInterval(() => {
    updateClaimableRewards(); // 每30秒更新一次收益
  }, 30000);
};

// 停止定时器
const stopNFTStakingTimer = () => {
  if (nftStakingTimer) {
    clearInterval(nftStakingTimer);
    nftStakingTimer = null;
  }
};

const stopDividendsTimer = () => {
  if (dividendsTimer) {
    clearInterval(dividendsTimer);
    dividendsTimer = null;
  }
};

onMounted(() => {
  console.log(2);
  startNFTStakingTimer();
  startDividendsTimer();
});

onUnmounted(() => {
  console.log(3);
  stopNFTStakingTimer();
  stopDividendsTimer();
});

// 返回上一页
const goBack = () => {
  router.back();
};

// 处理领取按钮
const handleClaim = async (id: number, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  await claimPoolDividends(id.toString(), t);
};

// 处理转移按钮
const handleTransfer = (nft: NFTStakingData, event?: Event) => {
  if (event) {
    event.stopPropagation();
  }
  // 保存当前要转移的NFT记录
  currentTransferNFT.value = nft;
  // 显示地址输入弹窗
  showAddressModal.value = true;
};

// 关闭地址输入弹窗
const closeAddressModal = () => {
  showAddressModal.value = false;
  currentTransferNFT.value = null;
};

// 确认转移地址
const confirmTransfer = async (address: string) => {
  if (!currentTransferNFT.value) {
    toast.error('转移信息错误，请重试');
    return;
  }

  if (!walletStore.address) {
    toast.error(t('common.errors.wallet_not_connected'));
    return;
  }

  try {
    toast.info('开始转移分红地址，请在钱包中确认交易...');

    // 调用转移分红地址的函数
    const result = await transferPoolOwner(
        currentTransferNFT.value.poolId,
        address,
        t
    );

    if (result.status) {
      toast.success(result.message);

      // 转移成功后强制更新NFT质押数据
      await updateNFTStakingData(true);

      console.log(`成功将质押池 ${currentTransferNFT.value.poolId} 的分红地址转移到 ${address}`);
    } else {
      toast.error(result.message);
    }
  } catch (error) {
    console.error('转移分红地址失败:', error);
    toast.error('转移失败，请重试');
  } finally {
    // 关闭弹窗
    closeAddressModal();
  }
};

// 处理NFT卡片点击
const handleNFTCardClick = (nft: any) => {
};
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 背景图片 -->
    <div
        class="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        :style="{ backgroundImage: `url('${config.backgrounds.friends}')` }"
    ></div>

    <!-- 内容层 -->
    <div class="relative z-10">
      <!-- Header -->
      <header class="p-4 relative">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <!-- 返回按钮 -->
            <button @click="goBack" class="mr-3 p-2 rounded-full bg-alpha-surface-light bg-opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <AlphaLogo/>
          </div>
          <LanguageSwitcher/>
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 标题 -->
        <h1 class="text-2xl font-bold mb-2 text-left" style="color: #5BF655">{{ t('staking.title') }}</h1>

        <!-- 绿色背景容器 - 与质押合约页面保持一致 -->
        <div class="rounded-2xl p-4 mb-6"
             style="background: linear-gradient(135deg, rgba(124, 221, 61, 0.8) 0%, rgba(83, 203, 67, 0.8) 100%)">

          <!-- 我的质押按钮 -->
          <button
              class="btn-primary w-full mb-6 py-4 text-black font-bold text-lg rounded-full flex items-center justify-center">
            <span>{{ t('staking.my_staking_pool') }}</span>
            <div class="ml-2 bg-white bg-opacity-30 rounded-full px-2 py-1">
              <span class="text-black text-sm font-bold">{{ nftStakingList.length }}{{
                  t('staking.cards_count')
                }}</span>
            </div>
          </button>

          <!-- 加载状态 -->
          <div v-if="isLoading" class="text-center py-8">
            <div
                class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-alpha-primary transition ease-in-out duration-150">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ t('common.loading') }}
            </div>
          </div>

          <!-- 暂无NFT质押状态 -->
          <div v-else-if="!walletStore.address" class="text-center py-12">
            <div
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
              <!-- 钱包图标 -->
              <div
                  class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-white mb-2">请先连接钱包</h3>
              <p class="text-gray-400 text-sm">连接钱包后即可查看您的NFT质押记录</p>
            </div>
          </div>

          <!-- 暂无NFT质押记录 -->
          <div v-else-if="nftStakingList.length === 0" class="text-center">
            <div
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-700">
              <!-- NFT图标 -->
              <div
                  class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-600 bg-opacity-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-white mb-2">暂无NFT质押记录</h3>
              <p class="text-gray-400 text-sm mb-4">您的地址不是任何质押池的分红地址，无法查看NFT质押数据</p>
              <p class="text-gray-400 text-xs">
                只有当您的地址与质押池的dividendAddress相同时，才能查看对应的NFT质押信息</p>
            </div>
          </div>

          <!-- NFT质押卡片列表 -->
          <div v-else class="space-y-4">
            <div
                v-for="nft in nftStakingList"
                :key="nft.id"
                @click="handleNFTCardClick(nft)"
                class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700"
            >
              <!-- 卡片头部 - 等级标签和状态 -->
              <div class="flex items-center justify-between mb-4">
                <!-- 等级标签 -->
                <div class="flex items-center text-left">
                  <!-- 等级图标 -->
                  <div class="w-10 h-10 rounded-full flex items-center justify-center mr-3 relative"
                       :class="`bg-gradient-to-br ${nft.levelGradient}`"
                       style="box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                    <!-- 内部光泽效果 -->
                    <div class="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                    <!-- NFT图标 -->
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white z-10" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    <!-- 装饰性光环 -->
                    <div class="absolute -inset-1 rounded-full opacity-50"
                         :style="`background: conic-gradient(from 0deg, ${nft.levelColor}, transparent, ${nft.levelColor})`"></div>
                  </div>
                  <!-- 等级名称和数量 -->
                  <div>
                    <div class="flex items-center">
                      <h3 class="text-lg font-bold text-white mr-2">{{
                          t(`staking.${nft.level === '金卡' ? 'gold' : nft.level === '银卡' ? 'silver' : 'bronze'}_card`)
                        }}</h3>
                    </div>
                    <p class="text-gray-400 text-sm">{{ t('staking.nft_staking_card') }}</p>
                  </div>
                </div>

                <!-- 状态标签 -->
                <div class="px-3 py-1.5 rounded-full text-xs font-medium shadow-lg"
                     :class="`bg-gradient-to-r ${nft.levelGradient}`">
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1.5" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span class="text-white font-medium">{{ t('staking.status_active') }}</span>
                  </div>
                </div>
              </div>

              <!-- 主要信息区域 - 质押金额和可领取收益 -->
              <div class="space-y-3 mb-4">
                <!-- 质押金额单独一行 -->
                <div class="relative overflow-hidden rounded-xl p-4 border-2"
                     :style="`border-color: ${nft.levelColor}; background: linear-gradient(135deg, ${nft.levelColor}15 0%, ${nft.levelColor}08 100%)`">
                  <!-- 背景装饰效果 -->
                  <div class="absolute inset-0 opacity-20"
                       :style="`background: radial-gradient(circle at 20% 50%, ${nft.levelColor}40 0%, transparent 50%), radial-gradient(circle at 80% 50%, ${nft.levelColor}30 0%, transparent 50%)`"></div>

                  <!-- 闪烁装饰点 -->
                  <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                       :style="`background: ${nft.levelColor}; box-shadow: 0 0 10px ${nft.levelColor}`"></div>
                  <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                       :style="`background: ${nft.levelColor}; box-shadow: 0 0 8px ${nft.levelColor}; animation-delay: 0.5s`"></div>

                  <!-- 内容区域 -->
                  <div class="relative z-10">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-gray-300 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5"
                             :style="`color: ${nft.levelColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ t('staking.staking_amount') }}
                      </p>
                      <!-- 趋势图标 -->
                      <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-bounce"
                             :style="`color: ${nft.levelColor}`" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                      </div>
                    </div>

                    <!-- 金额显示 -->
                    <div class="flex items-baseline">
                      <p class="text-white font-black text-xl break-all mr-2"
                         :style="`text-shadow: 0 0 20px ${nft.levelColor}80, 0 0 40px ${nft.levelColor}40`">
                        {{ formatNumber(nft.amount) }}
                      </p>
                      <span class="text-gray-400 text-sm font-medium">ALPHA</span>
                    </div>

                    <!-- 底部装饰线 -->
                    <div class="mt-2 h-0.5 rounded-full opacity-60"
                         :style="`background: linear-gradient(90deg, ${nft.levelColor} 0%, transparent 100%)`"></div>
                  </div>
                </div>

                <!-- 可领取收益单独一行 -->
                <div class="relative overflow-hidden rounded-xl p-4 border-2"
                     style="border-color: #5BF655; background: linear-gradient(135deg, #5BF65515 0%, #5BF65508 100%)">
                  <!-- 背景装饰效果 -->
                  <div class="absolute inset-0 opacity-20"
                       style="background: radial-gradient(circle at 20% 50%, #5BF65540 0%, transparent 50%), radial-gradient(circle at 80% 50%, #5BF65530 0%, transparent 50%)"></div>

                  <!-- 闪烁装饰点 -->
                  <div class="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                       style="background: #5BF655; box-shadow: 0 0 10px #5BF655"></div>
                  <div class="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full animate-pulse"
                       style="background: #5BF655; box-shadow: 0 0 8px #5BF655; animation-delay: 0.5s"></div>

                  <!-- 内容区域 -->
                  <div class="relative z-10">
                    <div class="flex items-center justify-between mb-2">
                      <p class="text-gray-300 text-sm font-medium flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" style="color: #5BF655"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        {{ t('staking.claimable_reward') }}
                      </p>
                      <!-- 收益图标 -->
                      <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 animate-pulse" style="color: #5BF655"
                             fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>

                    <!-- 收益显示 -->
                    <div class="flex items-baseline">
                      <p class="text-white font-black text-xl break-all mr-2"
                         style="text-shadow: 0 0 20px #5BF65580, 0 0 40px #5BF65540">
                        {{ formatNumber(nft.claimableReward) }}
                      </p>
                      <span class="text-gray-400 text-sm font-medium">ALPHA</span>
                    </div>

                    <!-- 底部装饰线 -->
                    <div class="mt-2 h-0.5 rounded-full opacity-60"
                         style="background: linear-gradient(90deg, #5BF655 0%, transparent 100%)"></div>
                  </div>
                </div>
              </div>

              <!-- 详细数据网格 -->
              <div class="grid grid-cols-2 gap-3 mb-4">
                <!-- 年化率 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.annual_rate') }}</p>
                  <p class="font-bold text-base break-all" style="color: #5BF655">{{ nft.yearRate }}</p>
                </div>

                <!-- 质押分红 -->
                <div class="bg-alpha-surface rounded-lg p-3 border border-gray-600">
                  <p class="text-gray-400 text-sm mb-1">{{ t('staking.staking_dividend') }}</p>
                  <p class="text-white font-bold text-base">{{ nft.stakingRate }}</p>
                </div>
              </div>

              <!-- 领取按钮 -->
              <!-- 按钮组 -->
              <div class="grid grid-cols-2 gap-3">
                <!-- 领取按钮 -->
                <button
                    @click="handleClaim(nft.id, $event)"
                    class="py-3 text-black font-bold rounded-full transition-all duration-300"
                    :class="`bg-gradient-to-r ${nft.levelGradient} hover:shadow-lg`"
                    :style="`box-shadow: 0 4px 15px ${nft.levelColor}40`"
                >
                  {{ t('common.claim') }}
                </button>

                <!-- 转移按钮 -->
                <button
                    @click="handleTransfer(nft, $event)"
                    class="py-3 text-white font-bold rounded-full transition-all duration-300 bg-alpha-surface-light border border-gray-600 hover:bg-alpha-surface hover:border-gray-500"
                >
                  {{ t('common.transfer') }}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 地址输入弹窗 -->
    <AddressInputModal
        :show="showAddressModal"
        title="转移分红地址"
        placeholder="请输入新的分红接收地址 (0x...)"
        @close="closeAddressModal"
        @confirm="confirmTransfer"
    />
  </div>
</template>

<style scoped>
/* 确保文本在深色背景上清晰可见 */
.text-white {
  color: #ffffff !important;
}

.text-gray-300 {
  color: #d1d5db !important;
}

.text-gray-400 {
  color: #9ca3af !important;
}
</style>
