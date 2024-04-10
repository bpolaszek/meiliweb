<template>
  <div />
</template>

<script setup>
import { useCredentials } from '~/stores'

const { logout } = useCredentials()
onMounted(() => {
  logout()
  navigateTo('/login', { replace: true })
})
</script>
