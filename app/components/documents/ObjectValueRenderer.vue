<template>
  <div class="table">
    <div v-for="[_key, _value] of Object.entries(value)" class="table-row">
      <dt class="table-cell">{{ _key }}</dt>
      <dd class="table-cell p-1 text-xs">
        <ValueRenderer
          :index-uid="indexUid"
          :field="field"
          :value="_value"
          :level="level + 1" />
      </dd>
    </div>
  </div>
</template>

<script setup lang="ts">
import ValueRenderer from './ValueRenderer.vue'

type Props = {
  indexUid: string
  field: string
  value: Object
  level: number
}

defineProps<Props>()
</script>
