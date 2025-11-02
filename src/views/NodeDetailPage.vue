<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import toast from '../utils/toast'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// 控制兑换弹窗显示
const showExchangeModal = ref(false)

// 节点详情数据
const nodeDetail = ref({
  id: 1,
  type: 'gold_node',
  points: 10,
  totalPoints: 5000,
  progress: 0.2,
  tokens: 2000,
  uTokens: 1888,
  members: 31543,
  color: '#FFD700',
  bgGradient: 'from-yellow-400 to-yellow-600',
  cardImage: 'https://wufeng98.cn/imgServerApi/images/55c5f24b-ab6e-4a82-a5aa-d0a30613ae11.png',
  description: '金节点是最高级别的节点，拥有最高的收益率和最优的权益。持有金节点可以享受平台的顶级服务和最大化的收益分配。',
  benefits: [
    '最高收益分配权重',
    '优先参与新项目',
    '专属客服服务',
    '高级功能访问权限',
    '社区治理投票权'
  ],
  requirements: [
    '需要2000万ALPHA代币',
    '或1888个U代币',
    '限量发行5000个',
    '永久有效'
  ]
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理兑换按钮点击
const handleExchange = () => {
  showExchangeModal.value = true
}

// 关闭兑换弹窗
const closeExchangeModal = () => {
  showExchangeModal.value = false
}

// 确认兑换
const confirmExchange = (type: string, amount: string) => {
  console.log('兑换确认:', {
    node: t(`node.${nodeDetail.value.type}`),
    type,
    amount
  })

  // 显示成功提示
  const exchangeTypeName = type === 'token' ? t('node.alpha_tokens') : t('node.u_tokens')
  const nodeTypeName = t(`node.${nodeDetail.value.type}`)
  toast.success(t('node.purchase_success', { amount, tokenType: exchangeTypeName, nodeType: nodeTypeName }))

  // 关闭弹窗
  closeExchangeModal()
}

// 根据路由参数初始化节点数据
onMounted(() => {
  const nodeType = route.params.type as string

  if (nodeType === 'silver') {
    nodeDetail.value = {
      ...nodeDetail.value,
      id: 2,
      type: 'silver_node',
      points: 100,
      progress: 2,
      tokens: 500,
      uTokens: 500,
      members: 71543,
      color: '#C0C0C0',
      bgGradient: 'from-gray-300 to-gray-500',
      cardImage: 'https://wufeng98.cn/imgServerApi/images/aa44f88b-d3a9-41f1-9f0e-6041a3261741.png',
      description: '银节点是中级节点，提供稳定的收益和良好的权益。适合中等投资者，平衡风险与收益。',
      benefits: [
        '中等收益分配权重',
        '参与大部分新项目',
        '标准客服服务',
        '基础功能访问权限',
        '部分治理投票权'
      ],
      requirements: [
        '需要500万ALPHA代币',
        '或500个U代币',
        '限量发行5000个',
        '永久有效'
      ]
    }
  } else if (nodeType === 'bronze') {
    nodeDetail.value = {
      ...nodeDetail.value,
      id: 3,
      type: 'bronze_node',
      points: 500,
      progress: 10,
      tokens: 100,
      uTokens: 100,
      members: 115688,
      color: '#CD7F32',
      bgGradient: 'from-orange-400 to-orange-600',
      cardImage: 'https://wufeng98.cn/imgServerApi/images/03d90adf-daf8-4bbe-a8f2-2c779d3f1cf3.png',
      description: '铜节点是入门级节点，为新用户提供基础的收益和权益。是开始参与平台生态的最佳选择。',
      benefits: [
        '基础收益分配权重',
        '参与部分新项目',
        '社区客服支持',
        '基本功能访问',
        '基础投票权'
      ],
      requirements: [
        '需要100万ALPHA代币',
        '或100个U代币',
        '限量发行5000个',
        '永久有效'
      ]
    }
  }
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
          <div class="flex items-center">
            <!-- 返回按钮 -->
            <button @click="goBack" class="mr-3 p-2 rounded-full bg-alpha-surface-light bg-opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <AlphaLogo />
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 节点卡片展示区域 -->
        <div class="flex flex-col items-center mb-8">
          <!-- 节点卡片 -->
          <div class="relative mb-4 transform hover:scale-105 transition-transform duration-300">
            <img
              :src="nodeDetail.cardImage"
              :alt="nodeDetail.type"
              class="w-64 h-auto object-cover rounded-2xl shadow-2xl"
              style="filter: drop-shadow(0 20px 40px rgba(0,0,0,0.5))"
            />

            <!-- 卡片上的光效 -->
            <div class="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-20 rounded-2xl"></div>
          </div>

          <!-- 底座 -->
          <div class="relative">
            <img
              src="https://wufeng98.cn/imgServerApi/images/45541ccd-d7e3-497d-847a-bf7ab7026c31.png"
              alt="Node Base"
              class="w-80 h-auto object-cover"
            />

            <!-- 底座上的文字 -->
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-center">
                <h2 class="text-2xl font-bold text-gray-600 opacity-80">Alpha</h2>
              </div>
            </div>
          </div>
        </div>

        <!-- 购买按钮 -->
        <div class="pt-4">
          <button
            @click="goBack"
            class="w-full py-4 text-black font-bold text-lg rounded-full transition-all duration-300 shadow-lg"
            :class="`bg-gradient-to-r ${nodeDetail.bgGradient} hover:shadow-xl`"
            :style="`box-shadow: 0 4px 20px ${nodeDetail.color}40`"
          >
            {{ t('node.purchase_now') }} {{ t(`node.${nodeDetail.type}`) }}
          </button>
        </div>
      </div>
    </div>

    <!-- 兑换弹窗 -->
    <!--<NodeExchangeModal-->
    <!--  :show="showExchangeModal"-->
    <!--  :node-data="nodeDetail"-->
    <!--  @close="closeExchangeModal"-->
    <!--  @confirm="confirmExchange"-->
    <!--/>-->
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
