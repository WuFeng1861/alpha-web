<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterView } from 'vue-router';
import BottomNavigation from './components/BottomNavigation.vue';
import { useLocaleStore } from './stores/locale';
import { useWalletStore } from './stores/wallet';

const { locale } = useI18n();
const localeStore = useLocaleStore();
const walletStore = useWalletStore();

// 同步语言设置与存储
watch(() => localeStore.currentLocale, (newLocale) => {
  locale.value = newLocale;
});

onMounted(() => {
  // 初始化存储的语言设置，默认为英语
  locale.value = localeStore.currentLocale;
  
  // 获取URL中的邀请人地址参数
  const urlParams = new URLSearchParams(window.location.search);
  const invAddress = urlParams.get('invAddress');
  if (invAddress) {
    // 缓存邀请人地址
    sessionStorage.setItem('inviterAddress', invAddress);
  }
});
</script>

<template>
  <main class="min-h-screen flex flex-col bg-alpha-surface text-white relative overflow-hidden">
    <div class="flex-grow">
      <RouterView v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </div>
    <BottomNavigation />
  </main>
</template>