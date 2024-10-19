<template>
  <Modal :title @close="rejectDialog()">
    <slot :resolve="resolveDialog" :close="rejectDialog" />
  </Modal>
</template>

<script setup lang="ts">
import { usePromisifiedDialogs } from '~/stores'
import Modal from '~/components/layout/Modal.vue'

type Props = {
  title?: string
}
defineProps<Props>()
const { resolveDialog, rejectDialog } = usePromisifiedDialogs()
</script>
