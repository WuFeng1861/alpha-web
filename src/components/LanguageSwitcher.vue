<script setup lang="ts">
import { useLocaleStore } from '../stores/locale'
import { useI18n } from 'vue-i18n'

const localeStore = useLocaleStore()
const { t } = useI18n()

const toggleLanguage = () => {
  localeStore.toggleLocale()
}
</script>

<template>
  <button 
    @click="toggleLanguage" 
    class="inline-flex items-center justify-center px-3 py-1 border border-alpha-primary rounded-full text-sm font-medium text-alpha-primary hover:bg-alpha-primary hover:text-white transition-all duration-300"
  >
    <span v-if="localeStore.currentLocale === 'en'">中文</span>
    <span v-else>English</span>
  </button>
</template>