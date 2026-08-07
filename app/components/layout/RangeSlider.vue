<template>
  <Slider v-model="value" class="w-full" :min :max :format />
</template>

<script setup lang="ts">
import Slider from '@vueform/slider'

type Props = {
  min: number
  max: number
  format?: <T>() => T
}

defineProps<Props>()
const value = defineModel()
</script>
