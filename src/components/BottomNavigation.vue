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
    </div>
  </nav>
</template>