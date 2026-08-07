<template>
  <div>
    <header
      :class="[
        mobileMenuOpen ? 'fixed inset-0 z-40 overflow-y-auto' : '',
        'relative z-10 bg-white lg:static lg:overflow-y-visible', // Added z-50 and relative
      ]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="relative flex justify-between lg:gap-8 xl:grid xl:grid-cols-12">
          <div class="flex md:absolute md:inset-y-0 md:left-0 lg:static xl:col-span-2">
            <div class="flex shrink-0 items-center">
              <div class="flex items-center gap-2">
                <a href="/">
                  <img class="size-16 shrink-0 grow-0" src="~/assets/images/logo.svg" alt="Meiliweb" />
                </a>
                <div class="flex flex-col">
                  <a href="/" class="text-lg font-semibold">Meiliweb</a>
                  <div class="-mt-1 flex items-center gap-2">
                    <a href="/" class="text-sm font-light text-gray-600">
                      {{ credentials!.baseUri }} - Meilisearch
                      {{ version?.pkgVersion }}
                    </a>
                    <UDropdownMenu :items="instanceMenuItems" :content="{ align: 'end' }" :ui="{ content: 'w-72' }">
                      <button
                        type="button"
                        v-tippy="t('actions.switchInstance')"
                        class="relative -mt-1 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50">
                        <Icon name="heroicons:chevron-down" class="size-4" />
                      </button>
                      <template #instance="{ item }">
                        <span class="flex w-full items-center justify-between text-xs">
                          <button
                            type="button"
                            class="flex w-full items-center gap-2"
                            @click="switchInstance(item.instance.id)">
                            <Icon name="heroicons:server" class="h-5 w-5" />
                            <span class="flex flex-col items-start">
                              <span>
                                {{ item.instance.name || item.instance.baseUri }}
                              </span>
                              <span v-if="item.instance.name" class="text-xs text-gray-500">
                                {{ item.instance.baseUri }}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            class="text-gray-400 hover:text-gray-600"
                            @click.stop="removeInstance(item.instance.id)">
                            <Icon name="heroicons:trash" class="h-4 w-4" />
                          </button>
                        </span>
                      </template>
                    </UDropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6">
            <div class="flex items-center px-6 py-4 md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none xl:px-0">
              <div class="invisible w-full">
                <label for="search" class="sr-only">Search</label>
                <div class="relative">
                  <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Icon name="heroicons:magnifying-glass-20-solid" class="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    class="block w-full rounded-lg border-0 bg-white py-1.5 pr-3 pl-10 text-gray-900 ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500 focus:ring-inset sm:text-sm sm:leading-6"
                    placeholder="Search"
                    type="search" />
                </div>
              </div>
            </div>
          </div>
          <div class="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
            <!-- Mobile menu button -->
            <button
              type="button"
              class="relative -mx-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-hidden focus:ring-inset"
              @click="mobileMenuOpen = !mobileMenuOpen">
              <span class="absolute -inset-0.5" />
              <span class="sr-only">Open menu</span>
              <Icon v-if="!mobileMenuOpen" name="heroicons:bars-3" class="block h-6 w-6" aria-hidden="true" />
              <Icon v-else name="heroicons:x-mark" class="block h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div class="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
            <GithubButton />
            <LogoutButton />
          </div>
        </div>
        <nav class="hidden lg:flex lg:space-x-8 lg:py-2" aria-label="Global">
          <NuxtLink
            v-for="item in visibleNavigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current ? 'bg-primary-600 text-gray-50' : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
              'inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium',
            ]"
            :aria-current="item.current ? 'page' : undefined">
            {{ item.name }}
          </NuxtLink>
        </nav>
      </div>

      <nav v-if="mobileMenuOpen" class="lg:hidden" aria-label="Global">
        <div class="mx-auto max-w-3xl space-y-1 px-2 pt-2 pb-3 sm:px-4">
          <NuxtLink
            v-for="item in visibleNavigation"
            :key="item.name"
            :to="item.href"
            :aria-current="item.current ? 'page' : undefined"
            :class="[
              item.current ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50',
              'block rounded-lg px-3 py-2 text-base font-medium',
            ]">
            {{ item.name }}
          </NuxtLink>
        </div>
        <div class="border-t border-gray-200 pt-4 pb-3">
          <div class="mx-auto flex max-w-3xl items-center justify-center px-4 sm:px-6">
            <GithubButton />
            <LogoutButton />
          </div>
        </div>
      </nav>
    </header>
  </div>
</template>

<script setup lang="ts">
import { safeToRefs, useConfirmationDialog, useRoute } from '#imports'
import type { DropdownMenuItem } from '@nuxt/ui'
import { computed, reactive, ref, toRefs } from 'vue'
import GithubButton from '~/components/layout/GithubButton.vue'
import LogoutButton from '~/components/layout/LogoutButton.vue'
import { EXPORT_MIN_VERSION } from '~/composables'
import { useChatAvailability, useCredentials, useVersion } from '~/stores'

const route = useRoute()
const { available: chatAvailable } = safeToRefs(useChatAvailability())
const navigation = reactive([
  {
    name: 'Indexes',
    href: '/indexes',
    current: computed(() => route.name?.startsWith('indexes')),
  },
  {
    name: 'Access Keys',
    href: '/keys',
    current: computed(() => route.name?.startsWith('keys')),
  },
  {
    name: 'Tasks',
    href: '/tasks',
    current: computed(() => route.name?.startsWith('tasks')),
  },
  {
    name: 'Network',
    href: '/network',
    current: computed(() => route.name?.startsWith('network')),
  },
  {
    name: 'Backup',
    href: '/backup/dumps',
    current: computed(() => route.name?.startsWith('backup')),
  },
  {
    name: 'Webhooks',
    href: '/webhooks',
    current: computed(() => route.name?.startsWith('webhooks')),
  },
  {
    name: 'Search rules',
    href: '/search-rules',
    current: computed(() => route.name?.startsWith('search-rules')),
  },
  {
    name: 'Chat',
    href: '/chat',
    current: computed(() => route.name?.startsWith('chat')),
    visible: computed(() => chatAvailable.value),
  },
  {
    name: 'Export',
    href: '/export',
    current: computed(() => route.name?.startsWith('export')),
    visible: computed(() => satisfiesVersion(EXPORT_MIN_VERSION)),
  },
  {
    name: 'Experimental',
    href: '/experimental-features',
    current: computed(() => route.name?.startsWith('experimental-features')),
  },
])

// Entries without a `visible` flag are always shown.
const visibleNavigation = computed(() => navigation.filter((item) => item.visible ?? true))

const { credentials, records, switchInstance, removeInstance: doRemoveInstance } = safeToRefs(useCredentials())
const { confirm } = useConfirmationDialog()
const { version, satisfiesVersion } = useVersion()
const mobileMenuOpen = ref(false)
const self: any = reactive({
  records,
  savedInstances: computed(() => Array.from(self.records.values())),
})

const instanceMenuItems = computed<DropdownMenuItem[][]>(() => [
  self.savedInstances
    .filter(({ id }: { id: string }) => id !== credentials.value?.id)
    .map((instance: any) => ({ slot: 'instance' as const, instance })),
  [
    {
      label: t('actions.connectToInstance'),
      icon: 'heroicons:plus-circle',
      to: '/login',
    },
  ],
])

const removeInstance = async (id: string) => {
  if (await confirm({ text: t('confirm.removeInstance') })) {
    doRemoveInstance(id)
  }
}
const { t } = useI18n()
const { savedInstances } = toRefs(self)
</script>

<i18n>
en:
  actions:
    connectToInstance: Connect to another instance
    switchInstance: Switch Instance
  confirm:
    removeInstance: Are you sure you want to log out from this instance?
</i18n>
