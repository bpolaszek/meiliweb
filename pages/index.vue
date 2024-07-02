<template>
  <div />
</template>

<script setup>
import { useMeiliClient } from '~/composables'
import { useCredentials } from '~/stores'

const meili = useMeiliClient()
const { credentials, logout } = useCredentials()
try {
  await meili.getVersion()
} catch (e) {
  if (null !== credentials) {
    logout()
  }
}
navigateTo('/indexes', { replace: true })
</script>
