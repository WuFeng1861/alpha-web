import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLocaleStore = defineStore('locale', () => {
  // 默认使用英语
  const currentLocale = ref(localStorage.getItem('locale') || 'en')
  
  function setLocale(locale: string) {
    currentLocale.value = locale
    localStorage.setItem('locale', locale)
  }
  
  function toggleLocale() {
    const newLocale = currentLocale.value === 'en' ? 'zh' : 'en'
    setLocale(newLocale)
  }
  
  return {
    currentLocale,
    setLocale,
    toggleLocale,
  }
})