<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { getContributions, getTeamSize, claimBNBReward, getDirectRefsList } from '../utils/useEthWallet'
import { useWalletStore } from '../stores/wallet'
import Clipboard from "clipboard";

const { t } = useI18n()
const walletStore = useWalletStore()
const showCopied = ref(false)
const contributions = ref({amount: '0', level: 0, received: '0'})
const teamSize = ref('0')
const directRefs = ref<Array<{address: string; count: number}>>([])
const currentPage = ref(1)
const pageSize = 10

// 计算要显示的分页按钮
const paginationButtons = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  // 当总页数小于等于5页时，显示所有页码
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // 当当前页在前2页时，显示前3页 + ... + 最后一页
  if (current <= 2) {
    return [1, 2, 3, '...', total]
  }

  // 当当前页在第3页时，显示前4页 + ... + 最后一页
  if (current === 3) {
    return [1, 2, 3, 4, '...', total]
  }

  // 当当前页在第4页时，显示1 + ... + 3,4,5 + ... + 最后一页
  if (current === 4) {
    return [1, '...', 3, 4, 5, '...', total]
  }

  // 当当前页在倒数第3页时，显示第1页 + ... + 最后4页
  if (current === total - 2) {
    return [1, '...', total - 3, total - 2, total - 1, total]
  }

  // 当前页在最后2页时，显示第1页 + ... + 最后3页
  if (current > total - 2) {
    return [1, '...', total - 2, total - 1, total]
  }

  // 其他情况显示第1页 + ... + 当前页及其前后页 + ... + 最后一页
  return [1, '...', current - 1, current, current + 1, '...', total]
})

// 计算当前页的直推列表
const paginatedDirectRefs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return directRefs.value.slice(start, end)
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(directRefs.value.length / pageSize)
})

// 切换页面
const changePage = (page: number) => {
  currentPage.value = page
}

const inviteLink = computed(() => {
  if (!walletStore.address) return '';
  const baseUrl = window.location.origin;
  return `${baseUrl}?invAddress=${walletStore.address}`;
})
let contributionsTimer: number | null = null
let teamSizeTimer: number | null = null
let directRefsTimer: number | null = null

// 更新贡献点显示
const updateContributions = async () => {
  if (walletStore.address && walletStore.hasUpline) {
    contributions.value = await getContributions()
  }
}

// 更新团队规模显示
const updateTeamSize = async () => {
  if (walletStore.address && walletStore.hasUpline) {
    teamSize.value = await getTeamSize()
  }
}

// 更新直推列表显示
const updateDirectRefs = async () => {
  if (walletStore.address && walletStore.hasUpline) {
    directRefs.value = await getDirectRefsList()
  }
}

// 启动定时器，更新贡献点
const startContributionsTimer = () => {
  if (contributionsTimer) return
  updateContributions()
  contributionsTimer = window.setInterval(updateContributions, 1000)
}

// 启动定时器，更新团队规模
const startTeamSizeTimer = () => {
  if (teamSizeTimer) return
  updateTeamSize()
  teamSizeTimer = window.setInterval(updateTeamSize, 1000)
}

// 启动定时器，更新直推列表
const startDirectRefsTimer = () => {
  if (directRefsTimer) return
  updateDirectRefs()
  directRefsTimer = window.setInterval(updateDirectRefs, 1000)
}

// 停止定时器
const stopContributionsTimer = () => {
  if (contributionsTimer) {
    clearInterval(contributionsTimer)
    contributionsTimer = null
  }
}

const stopTeamSizeTimer = () => {
  if (teamSizeTimer) {
    clearInterval(teamSizeTimer)
    teamSizeTimer = null
  }
}

const stopDirectRefsTimer = () => {
  if (directRefsTimer) {
    clearInterval(directRefsTimer)
    directRefsTimer = null
  }
}

onMounted(() => {
  startContributionsTimer()
  startTeamSizeTimer()
  startDirectRefsTimer()
})

onUnmounted(() => {
  stopContributionsTimer()
  stopTeamSizeTimer()
  stopDirectRefsTimer()
})

const copyInviteLink = () => {
  // 复制邀请链接到剪贴板
  let text = inviteLink.value;
  if (text) {
    const clipboard = new Clipboard('#copyFriendsLink', {
      text: () => text,
    })
    clipboard.on('success', (e) => {
      showCopied.value = true
      setTimeout(() => {
        showCopied.value = false
      }, 2000)
      clipboard.destroy()
    })
    clipboard.on('error', function(e) {
      console.log('copy failed')
      clipboard.destroy()
    });
  }

}
// 领取BNB奖励
const handleClaimBNB = async () => {
  if (!walletStore.address) {
    // 如果未连接钱包，显示连接钱包提示
    const connectButton = document.querySelector('.btn-connect');
    if (connectButton) {
      connectButton.classList.add('animate-pulse');
      setTimeout(() => {
        connectButton.classList.remove('animate-pulse');
      }, 1000);
    }
    return;
  }

  const result = await claimBNBReward(t);
  if (!result.status) {
    console.error(result.message);
  }
}

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
    <!-- 带模糊背景的页头 -->
    <header class="p-4 relative">
      <div class="flex justify-between items-center mb-4">
        <AlphaLogo />
        <LanguageSwitcher />
      </div>
      <div class="absolute right-0 mt-2">
        <!--<ConnectWalletButton />-->
      </div>
    </header>

    <!-- 主要内容 -->
    <div class="px-4 py-6 mt-0 pt-0">
      <!-- 等级卡片 -->
      <div class="rounded-xl py-6 px-4 mb-3 flex items-center bg-opacity-30" style="background: linear-gradient(135deg, rgba(42, 47, 47, 0.9) 0%, rgba(29, 34, 35, 0.9) 100%)">
        <img
          src="https://wufeng98.cn/imgServerApi/images/23cc70b9-a640-404b-b210-479a50e24728.png"
          alt="Level"
          class="h-16 w-16 object-contain mr-4"
        />
        <div class="text-left">
          <p class="text-sm mb-1 tracking-widest" style="color: #45CD44">{{ t('friends.current_level') }}{{Number(contributions.received) > 0 ? `(${Number(contributions.received)+Number(contributions.amount)}`: `(${Number(contributions.amount)}`}})</p>
          <p class="text-2xl font-bold tracking-widest" style="color: #45CD44">Lv{{ contributions.level }}</p>
        </div>
      </div>

      <!-- 团队规模卡片 -->
      <div class="rounded-xl py-6 px-4 mb-3 flex items-center" style="background: linear-gradient(to bottom, #7CDD3D 0%, #53CB43 100%)">
        <div class="h-16 w-16 rounded-full flex items-center justify-center mr-4" style="background: linear-gradient(135deg, #AEE346 0%, #4BD341 100%)">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="text-left">
          <p class="text-black text-sm mb-1">{{ t('friends.team_size') }}</p>
          <p class="text-2xl font-bold text-black">{{ teamSize }} <span class="text-black text-base">{{ t('friends.people') }}</span></p>
        </div>
      </div>

      <!-- 直推列表卡片 -->
      <div class="rounded-xl py-6 px-4 mb-3" style="background-color: #327430">
        <div class="flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 class="text-base font-bold text-white">{{ t('friends.livestream_list') }}</h3>
        </div>
        <div v-if="!walletStore.address" class="btn-primary w-full py-3 text-black font-bold">
          {{ t('friends.connect_wallet_view') }}
        </div>
        <div v-else class="space-y-4">
          <div v-for="ref in paginatedDirectRefs" :key="ref.address" class="bg-alpha-surface bg-opacity-30 rounded-lg p-4">
            <div class="flex justify-between items-center">
              <span class="text-white">{{ ref.address.slice(0, 6) }}...{{ ref.address.slice(-4) }}</span>
              <span class="text-alpha-primary">{{ ref.count }} {{ t('friends.people') }}</span>
            </div>
          </div>
          <div v-if="paginatedDirectRefs.length === 0" class="text-center text-gray-400 py-2">
            {{ t('friends.no_direct_refs') }}
          </div>
          <!-- 分页控制 -->
          <div v-if="directRefs.length > 0" class="flex justify-center items-center gap-2 mt-4">
            <template v-for="(item, index) in paginationButtons" :key="item + index + index.toString()" >
              <span
                v-if="item === '...'"
                class="px-2 text-gray-400"
              >...</span>
              <button
              v-else
              @click="changePage(item)"
              :class="[
                'w-8 h-8 rounded-full text-sm font-medium transition-colors duration-300',
                Number(currentPage) === Number(item)
                  ? 'bg-alpha-primary text-black'
                  : 'bg-alpha-surface-light text-gray-400 hover:bg-alpha-primary hover:text-black'
              ]"
              >
                {{ item }}
              </button>
            </template>
          </div>
        </div>
      </div>

      <!-- 贡献点数卡片 -->
      <div class="rounded-xl py-6 px-4 mb-3" style="background: linear-gradient(to bottom, #7CDD3D 0%, #53CB43 100%)">
        <!-- BNB和贡献点显示 -->
        <div class="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <img
                src="https://wufeng98.cn/imgServerApi/images/7151f34e-2b93-4684-91e9-c74d25d1c70f.png"
                alt="BNB"
                class="w-12 h-12 mr-3"
              />
              <div class="flex flex-col">
                <span class="text-3xl font-bold text-black">{{ Number((Number(contributions.amount) * 0.000024).toFixed(6)) }}</span>
                <div class="flex items-center mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm text-black">{{ contributions.amount }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          @click="handleClaimBNB"
          class="btn-secondary w-full py-3 text-black font-bold rounded-full"
          style="background: linear-gradient(to bottom right, #AEE346, #51E24B)"
        >
          {{ t('friends.claim_bnb') }}
        </button>
      </div>

      <!-- 邀请链接卡片 -->
      <div class="rounded-xl py-6 px-4" style="background: linear-gradient(135deg, #2A2F2F 0%, #1D2223 100%)">
        <h3 class="text-xl font-bold mb-3" style="color: #5BF655">{{ t('friends.your_invitation_link') }}</h3>
        <div class="relative">
          <div class="flex">
            <input
              type="text"
              :value="inviteLink"
              readonly
              class="bg-alpha-surface text-gray-300 rounded-l-lg px-3 py-3 flex-grow border border-gray-700 focus:outline-none"
            />
            <button
              @click="copyInviteLink"
              class="text-black font-bold px-6 py-3 rounded-r-lg focus:outline-none transition-all duration-300"
              style="background: linear-gradient(135deg, #AEE346 0%, #4BD341 100%)"
              id="copyFriendsLink"
            >
              {{ t('friends.copy') }}
            </button>
          </div>
          <div
            v-if="showCopied"
            class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-alpha-primary text-white px-3 py-1 rounded text-sm animate-pulse"
          >
            {{ t('common.copied') }}
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>
