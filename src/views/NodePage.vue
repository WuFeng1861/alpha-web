<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import NodeExchangeModal from '../components/NodeExchangeModal.vue'
import config from '../assets/config'
import { useRouter } from 'vue-router'
import toast from '../utils/toast'
import {buyNode, getNodeMessage} from '../utils/useStaking';

const { t } = useI18n()
const router = useRouter()

// 控制兑换弹窗显示
const showExchangeModal = ref(false)
const selectedNode = ref(null)

// 节点数据
const nodeList = ref([
  {
    id: 1,
    type: 'gold_node',
    points: 20,
    totalPoints: 20,
    pointsNow: 0,
    progress: 0.2, // 进度百分比
    tokens: 2000,
    uTokens: 2000,
    members: 2000,
    color: '#FFD700', // 金色
    bgGradient: 'from-yellow-400 to-yellow-600',
    buttonText: 'click_exchange',
    buttonDisabled: false
  },
  {
    id: 2,
    type: 'silver_node',
    points: 300,
    totalPoints: 300,
    pointsNow: 0,
    progress: 2, // 进度百分比
    tokens: 500,
    uTokens: 500,
    members: 500,
    color: '#C0C0C0', // 银色
    bgGradient: 'from-gray-300 to-gray-500',
    buttonText: 'click_exchange',
    buttonDisabled: false
  },
  {
    id: 3,
    type: 'bronze_node',
    points: 1000,
    totalPoints: 1000,
    pointsNow: 0,
    progress: 10, // 进度百分比
    tokens: 100,
    uTokens: 100,
    members: 100,
    color: '#CD7F32', // 铜色
    bgGradient: 'from-orange-400 to-orange-600',
    buttonText: 'click_exchange',
    buttonDisabled: false
  }
].reverse())

// 处理兑换按钮点击
const handleExchange = (node: any) => {
  selectedNode.value = node
  showExchangeModal.value = true
}

// 关闭兑换弹窗
const closeExchangeModal = () => {
  showExchangeModal.value = false
  selectedNode.value = null
}

// 确认兑换
const confirmExchange = async (type: string, amount: string) => {
  // 验证兑换数量
  if (!amount || parseFloat(amount) <= 0) {
    return
  }
  if(!selectedNode.value) {
    return
  }
  console.log('兑换确认:', {
    node: t(`node.${selectedNode.value?.type}`),
    type,
    amount
  })

  // 这里可以添加实际的购买逻辑
  // 比如调用合约方法、更新用户余额等
  await buyNode(selectedNode.value?.id, selectedNode.value?.type, amount, t);

  // 显示成功提示
  const exchangeTypeName = type === 'token' ? t('node.alpha_tokens') : t('node.u_tokens')
  const nodeTypeName = t(`node.${selectedNode.value?.type}`)
  toast.success(t('node.purchase_success', {amount, tokenType: exchangeTypeName, nodeType: nodeTypeName}))


  // 关闭弹窗
  closeExchangeModal()
}

// 处理节点卡片点击
const handleNodeClick = (node: any) => {
  let nodeType = 'gold'
  if (node.type === 'silver_node') {
    nodeType = 'silver'
  } else if (node.type === 'bronze_node') {
    nodeType = 'bronze'
  }
  router.push(`/node/${nodeType}`)
}

onMounted(async () => {
  let dataTemp = await getNodeMessage(t);
  nodeList.value = dataTemp.data;
  console.log('nodeList:', nodeList.value);
})
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
          <AlphaLogo />
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 节点列表 -->
        <div class="space-y-4">
          <div
            v-for="node in nodeList"
            :key="node.id"
            @click="handleNodeClick(node)"
            class="rounded-2xl p-6 shadow-lg relative overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            :class="`bg-gradient-to-br ${node.bgGradient}`"
          >
            <!-- 节点类型图标和标题 -->
            <div class="flex items-center mb-4">
              <!-- 节点图标 -->
              <div class="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-white bg-opacity-20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <h3 class="text-xl font-bold text-white">{{ t(`node.${node.type}`) }}</h3>
              <div class="ml-auto text-right">
                <p class="text-white font-bold text-lg">{{ node.points }}份</p>
                <p class="text-white text-sm opacity-80">{{ node.pointsNow }}/{{ node.totalPoints }}</p>
              </div>
            </div>

            <!-- 进度条 -->
            <div class="mb-4">
              <div class="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div
                  class="bg-white h-2 rounded-full transition-all duration-300"
                  :style="`width: ${node.progress}%`"
                ></div>
              </div>
            </div>

            <!-- 代币信息 -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-4">
                <!-- 代币数量 -->
                <div class="flex items-center">
                  <div class="w-4 h-4 rounded-full bg-white mr-2"></div>
                  <span class="text-white font-medium">{{ node.tokens }}{{ t('node.million') }}</span>
                </div>
                <!-- U代币数量 -->
                <div class="flex items-center">
                  <div class="w-4 h-4 rounded-full bg-white bg-opacity-60 mr-2"></div>
                  <span class="text-white font-medium">{{ node.uTokens }} U</span>
                </div>
              </div>
              <!-- 成员数量 -->
              <div class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span class="text-white text-sm">{{ t('node.contribution_value') }} {{ node.members }}</span>
              </div>
            </div>

            <!-- 兑换按钮 -->
            <button
              @click.stop="handleExchange(node)"
              :disabled="node.buttonDisabled"
              class="w-full py-3 text-black font-bold rounded-full transition-all duration-300 bg-white bg-opacity-90 hover:bg-opacity-100"
              :class="node.buttonDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'"
            >
              {{ t(`node.${node.buttonText}`) }}
            </button>

            <!-- 装饰性背景元素 -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 兑换弹窗 -->
    <NodeExchangeModal
      :show="showExchangeModal"
      :node-data="selectedNode"
      @close="closeExchangeModal"
      @confirm="confirmExchange"
    />
  </div>
</template>

<style scoped>
/* 确保文本在深色背景上清晰可见 */
.text-white {
  color: #ffffff !important;
}
</style>
