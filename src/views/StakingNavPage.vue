<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import AlphaLogo from '../components/AlphaLogo.vue'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'
import config from '../assets/config'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

// 处理质押类型选择
const handleStakingTypeSelect = (type: string) => {
  if (type === 'alp') {
    router.push('/staking')
  } else if (type === 'alps') {
    router.push('/staking-alps')
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
      <!-- Header -->
      <header class="p-4 relative">
        <div class="flex justify-between items-center mb-4">
          <AlphaLogo />
          <LanguageSwitcher />
        </div>
      </header>

      <!-- Main Content -->
      <div class="px-4 py-6">
        <!-- 标题 -->
        <h1 class="text-3xl font-bold mb-6" style="color: #5BF655">{{ t('staking.nav_title') }}</h1>

        <!-- 质押类型选择卡片 -->
        <div class="space-y-6">
          <!-- ALP 质押卡片 -->
          <div 
            @click="handleStakingTypeSelect('alp')"
            class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 active:scale-98 transition-transform"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <!-- ALP 图标 -->
                <img
                  src="https://wufeng98.cn/imgServerApi/images/4d35f283-bf43-459b-be74-a1c1810f19a6.png"
                  :alt="config.logo.alt"
                  class="w-8 h-8 mr-4 ml-2"
                />
                
                <!-- 标题和描述 -->
                <div>
                  <h3 class="text-xl font-bold text-white">{{ t('staking.alp_staking') }}</h3>
                  <p class="text-gray-300 text-sm">{{ t('staking.alp_staking_desc') }}</p>
                </div>
              </div>
              
              <!-- 箭头图标 -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          
          <!-- ALPS 质押卡片 -->
          <div 
            @click="handleStakingTypeSelect('alps')"
            class="bg-alpha-surface-light bg-opacity-90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-700 active:scale-98 transition-transform"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <!-- ALPS 图标 -->
                <img
                  :src="config.alpsLogo.path"
                  :alt="config.alpsLogo.alt"
                  class="w-12 h-12 rounded-full mr-4"
                />
                
                <!-- 标题和描述 -->
                <div>
                  <h3 class="text-xl font-bold text-white">{{ t('staking.alps_staking') }}</h3>
                  <p class="text-gray-300 text-sm">{{ t('staking.alps_staking_desc') }}</p>
                </div>
              </div>
              
              <!-- 箭头图标 -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.active\:scale-98:active {
  transform: scale(0.98);
}
</style>