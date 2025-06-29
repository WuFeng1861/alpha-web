<script setup lang="ts">
defineProps({
  size: {
    type: String,
    default: 'md'
  }
})
</script>

<template>
  <div :class="[
    'inline-flex items-center',
    size === 'sm' ? 'gap-1' : 'gap-2',
    'cursor-pointer'
  ]">
    <img
      :src="'https://wufeng98.cn/imgServerApi/images/2ac15998-1577-476a-ac72-69a7685e1216.png'"
      :alt="'Alpha Logo'"
      :class="[
        'object-contain',
        size === 'sm' ? 'h-6' : size === 'md' ? 'h-8' : 'h-10'
      ]"
    />
  </div>
</template>
