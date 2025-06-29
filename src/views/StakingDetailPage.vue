<script setup lang="ts">
// 质押详情页面组件
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 质押详情数据
const stakingDetail = ref({
  id: '',
  amount: '0',
  reward: '0',
  duration: '30',
  startDate: '',
  endDate: '',
  status: 'active'
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 加载质押详情
onMounted(() => {
  // 这里可以根据路由参数加载具体的质押详情
  const stakingId = route.params.id
  // TODO: 实现加载质押详情的逻辑
})
</script>

<template>
  <div class="min-h-screen bg-alpha-surface pb-16 relative">
    <!-- 头部导航 -->
    <div class="flex items-center justify-between p-4 bg-white shadow-sm">
      <button @click="goBack" class="flex items-center text-gray-600 hover:text-gray-800">
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>
      <h1 class="text-lg font-semibold text-gray-800">质押详情</h1>
      <div class="w-8"></div>
    </div>

    <!-- 质押详情内容 -->
    <div class="p-4">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">质押信息</h2>
        
        <!-- 质押金额 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">质押金额</label>
          <div class="text-2xl font-bold text-blue-600">{{ stakingDetail.amount }} ALPHA</div>
        </div>

        <!-- 预期收益 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">预期收益</label>
          <div class="text-xl font-semibold text-green-600">{{ stakingDetail.reward }} ALPHA</div>
        </div>

        <!-- 质押期限 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">质押期限</label>
          <div class="text-lg text-gray-800">{{ stakingDetail.duration }} 天</div>
        </div>

        <!-- 状态 -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">状态</label>
          <span class="inline-flex px-3 py-1 rounded-full text-sm font-medium"
                :class="stakingDetail.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'">
            {{ stakingDetail.status === 'active' ? '进行中' : '已完成' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 组件样式 */
.bg-alpha-surface {
  background-color: #f8fafc;
}
</style>