<template>
  <UniqueId as="div" v-slot="{ id }" class="inline-flex items-center gap-1">
    <select :id="id" v-model="value" class="form-input text-sm">
      <option v-for="size in sizes" :key="size" :value="size">
        {{ size }}
      </option>
    </select>
    <label :for="id" class="text-sm text-gray-600">
      {{ t('labels.itemsPerPage') }}
    </label>
  </UniqueId>
</template>

<script setup lang="ts">
const sizes = [10, 20, 50, 100, 500]
const value = defineModel({ default: 20 })
const { t } = useI18n()
</script>

<i18n>
en:
  labels:
    itemsPerPage: items per page
</i18n>
