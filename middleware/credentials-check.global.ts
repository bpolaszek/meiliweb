import { useCredentials } from '~/stores'

export default defineNuxtRouteMiddleware((to, from) => {
  const { credentials, logout } = useCredentials()

  if (to.name === 'login') {
    return true
  }

  if (!credentials) {
    return navigateTo('/login')
  }
})
