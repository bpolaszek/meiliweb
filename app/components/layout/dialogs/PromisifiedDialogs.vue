<template>
  <transition v-bind="transitionAttrs">
    <component
      :is="dialogRef.dialog"
      v-if="dialogRef && dialogRef.wrapper === name"
      v-bind="dialogRef.props"
      ref="dialogInstance"></component>
  </transition>
</template>

<script setup lang="ts">
import { type ComponentPublicInstance, ref, watch } from 'vue'
import { type DialogInstance, usePromisifiedDialogs } from '~/stores'
import { safeToRefs } from '~/utils'

type Props = {
  name?: string
  transitionAttrs?: any
}

withDefaults(defineProps<Props>(), {
  name: 'default',
  transitionAttrs: {},
})

const { dialogRef } = safeToRefs(usePromisifiedDialogs())

const dialogInstance = ref<ComponentPublicInstance<DialogInstance>>()

watch(dialogInstance, () => {
  if (dialogRef.value) {
    dialogRef.value.comp = dialogInstance.value
  }
})
</script>
