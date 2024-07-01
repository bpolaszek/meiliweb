import { navigateTo, useRoute } from '#imports'

type UseTenantTokenReturn = {
  tenantToken: string | undefined
  clearTenantToken: () => void
}

export const useMultiTenancy = (): UseTenantTokenReturn => {
  const route = useRoute()

  const self = reactive({
    tenantToken: computed(() => route.query.tenantToken as string | undefined),
    clearTenantToken: () => {
      const query = { ...toRaw(route.query) }
      delete query.tenantToken
      navigateTo({
        name: route.name as string,
        params: route.params,
        query,
      })
    },
  })

  return self
}
