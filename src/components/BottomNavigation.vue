<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const currentRoute = computed(() => route.path)

const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 w-full bg-alpha-secondary border-t border-gray-800 px-4 py-2 z-50">
    <div class="flex justify-around items-center">
      <button
        @click="navigateTo('/')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span class="text-xs mt-1">{{ t('nav.home') }}</span>
      </button>

      <button
        @click="navigateTo('/friends')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/friends' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <span class="text-xs mt-1">{{ t('nav.friends') }}</span>
      </button>

      <button
        @click="navigateTo('/box')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/box' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <span class="text-xs mt-1">{{ t('nav.box') }}</span>
      </button>

      <!--<button-->
      <!--    @click="navigateTo('/bobo')"-->
      <!--    class="flex flex-col items-center py-1 transition-all duration-300"-->
      <!--    :class="currentRoute === '/bobo' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"-->
      <!--&gt;-->
      <!--  <img-->
      <!--      :src="'https://wufeng98.cn/imgServerApi/images/7d2f5c20-2dcd-45eb-a572-045f627a2c7c.png'"-->
      <!--      class="w-6 h-6"-->
      <!--      :class="currentRoute !== '/bobo' ? 'opacity-40' : ''"-->
      <!--      alt="BoBo"-->
      <!--  />-->
      <!--  <span class="text-xs mt-1">{{t('nav.BoBo')}}</span>-->
      <!--</button>-->

      <!--<button-->
      <!--    @click="navigateTo('/dex')"-->
      <!--    class="flex flex-col items-center py-1 transition-all duration-300"-->
      <!--    :class="currentRoute === '/dex' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"-->
      <!--&gt;-->
      <!--  <img-->
      <!--      :src="'https://wufeng98.cn/imgServerApi/images/877ce503-d353-4c57-8458-a345d7ee91a9.png'"-->
      <!--      class="w-6 h-6"-->
      <!--      :class="currentRoute !== '/dex' ? 'opacity-40' : ''"-->
      <!--      alt="Dex"-->
      <!--  />-->
      <!--  <span class="text-xs mt-1">{{t('nav.Dex')}}</span>-->
      <!--</button>-->

      <button
        @click="navigateTo('/staking-nav')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/staking-nav' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <img
          :src="'https://wufeng98.cn/imgServerApi/images/6f4c3eff-a594-49a5-82a2-be9e4a808452.png'"
          class="w-6 h-6"
          :class="currentRoute !== '/staking-nav' ? 'opacity-40' : ''"
          alt="质押"
        />
        <span class="text-xs mt-1">{{ t('nav.staking') }}</span>
      </button>

      <button
       @click="navigateTo('/node')"
       class="flex flex-col items-center py-1 transition-all duration-300"
       :class="currentRoute === '/node' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
       >
       <img
         :src="'https://wufeng98.cn/imgServerApi/images/dec88fbd-3e2c-42f7-998b-7f53ed650728.png'"
         class="w-6 h-6"
         :class="currentRoute !== '/node' ? 'opacity-40' : ''"
         alt="节点"
       />
       <span class="text-xs mt-1">{{ t('nav.node') }}</span>
      </button>

      <button
        @click="navigateTo('/token')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/token' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <img
          :src="'https://wufeng98.cn/imgServerApi/images/327806d7-3a0a-4203-b8da-bbc504ab75c0.png'"
          class="w-6 h-6"
          :class="currentRoute !== '/token' ? 'opacity-40' : ''"
          alt="代币"
        />
        <span class="text-xs mt-1">{{ t('nav.token') }}</span>
      </button>

      <button
        @click="navigateTo('/alp-mapping')"
        class="flex flex-col items-center py-1 transition-all duration-300"
        :class="currentRoute === '/alp-mapping' ? 'text-alpha-primary' : 'text-gray-400 hover:text-gray-200'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span class="text-xs mt-1">{{ t('nav.mapping') }}</span>
      </button>
    </div>
  </nav>
</template>
