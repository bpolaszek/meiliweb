<template>
  <Popover as="template" v-slot="{ open }">
    <header
      :class="[
        open ? 'fixed inset-0 z-40 overflow-y-auto' : '',
        'relative z-10 bg-white lg:static lg:overflow-y-visible', // Added z-50 and relative
      ]">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          class="relative flex justify-between lg:gap-8 xl:grid xl:grid-cols-12">
          <div
            class="flex md:absolute md:inset-y-0 md:left-0 lg:static xl:col-span-2">
            <div class="flex flex-shrink-0 items-center">
              <div class="flex items-center gap-2">
                <a href="/">
                  <img
                    class="size-16 shrink-0 grow-0"
                    src="~/assets/images/logo.svg"
                    alt="Meiliweb" />
                </a>
                <div class="flex flex-col">
                  <a href="/" class="text-lg font-semibold">Meiliweb</a>
                  <div class="-mt-1 flex items-center gap-2">
                    <a href="/" class="text-sm font-light text-gray-600">
                      {{ credentials!.baseUri }} - Meilisearch
                      {{ version?.pkgVersion }}
                    </a>
                    <Menu as="div" class="relative -mt-1">
                      <MenuButton
                        v-tippy="t('actions.switchInstance')"
                        class="rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50">
                        <Icon name="heroicons:chevron-down" class="size-4" />
                      </MenuButton>
                      <transition
                        enter-active-class="transition ease-out duration-100"
                        enter-from-class="transform opacity-0 scale-95"
                        enter-to-class="transform opacity-100 scale-100"
                        leave-active-class="transition ease-in duration-75"
                        leave-from-class="transform opacity-100 scale-100"
                        leave-to-class="transform opacity-0 scale-95">
                        <MenuItems
                          class="absolute right-0 mt-2 w-72 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div v-if="savedInstances.length > 0">
                            <MenuItem
                              v-for="instance in savedInstances.filter(
                                ({ id }) => id !== credentials?.id,
                              )"
                              :key="instance.baseUri"
                              v-slot="{ active }">
                              <span
                                :class="[
                                  active ? 'bg-gray-50' : '',
                                  'flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs',
                                ]">
                                <button
                                  type="button"
                                  class="flex w-full items-center gap-2"
                                  @click="switchInstance(instance.id)">
                                  <Icon
                                    :name="
                                      instance.baseUri === credentials?.baseUri
                                        ? 'heroicons:server'
                                        : 'heroicons:server'
                                    "
                                    class="h-5 w-5" />
                                  <span class="flex flex-col items-start">
                                    <span>
                                      {{ instance.name || instance.baseUri }}
                                    </span>
                                    <span
                                      v-if="instance.name"
                                      class="text-xs text-gray-500">
                                      {{ instance.baseUri }}
                                    </span>
                                  </span>
                                </button>
                                <button
                                  @click="removeInstance(instance.id)"
                                  class="text-gray-400 hover:text-gray-600">
                                  <Icon
                                    name="heroicons:trash"
                                    class="h-4 w-4" />
                                </button>
                              </span>
                            </MenuItem>
                          </div>
                          <div>
                            <MenuItem v-slot="{ active }">
                              <NuxtLink
                                to="/login"
                                :class="[
                                  active ? 'bg-gray-50' : '',
                                  'flex items-center gap-2 rounded-md px-2 py-1.5 text-xs',
                                ]">
                                <Icon
                                  name="heroicons:plus-circle"
                                  class="h-5 w-5" />
                                {{ t('actions.connectToInstance') }}
                              </NuxtLink>
                            </MenuItem>
                          </div>
                        </MenuItems>
                      </transition>
                    </Menu>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1 md:px-8 lg:px-0 xl:col-span-6">
            <div
              class="flex items-center px-6 py-4 md:mx-auto md:max-w-3xl lg:mx-0 lg:max-w-none xl:px-0">
              <div class="invisible w-full">
                <label for="search" class="sr-only">Search</label>
                <div class="relative">
                  <div
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon
                      class="h-5 w-5 text-gray-400"
                      aria-hidden="true" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    class="block w-full rounded-lg border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6"
                    placeholder="Search"
                    type="search" />
                </div>
              </div>
            </div>
          </div>
          <div
            class="flex items-center md:absolute md:inset-y-0 md:right-0 lg:hidden">
            <!-- Mobile menu button -->
            <PopoverButton
              class="relative -mx-2 inline-flex items-center justify-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
              <span class="absolute -inset-0.5" />
              <span class="sr-only">Open menu</span>
              <Bars3Icon
                v-if="!open"
                class="block h-6 w-6"
                aria-hidden="true" />
              <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </PopoverButton>
          </div>
          <div
            class="hidden lg:flex lg:items-center lg:justify-end xl:col-span-4">
            <GithubButton />
            <LogoutButton />
          </div>
        </div>
        <nav class="hidden lg:flex lg:space-x-8 lg:py-2" aria-label="Global">
          <NuxtLink
            v-for="item in navigation"
            :key="item.name"
            :to="item.href"
            :class="[
              item.current
                ? 'bg-primary-600 text-gray-50'
                : 'text-gray-900 hover:bg-gray-50 hover:text-gray-900',
              'inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium',
            ]"
            :aria-current="item.current ? 'page' : undefined">
            {{ item.name }}
          </NuxtLink>
        </nav>
      </div>

      <PopoverPanel as="nav" class="lg:hidden" aria-label="Global">
        <div class="mx-auto max-w-3xl space-y-1 px-2 pb-3 pt-2 sm:px-4">
          <NuxtLink
            v-for="item in navigation"
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
        <div class="border-t border-gray-200 pb-3 pt-4">
          <div
            class="mx-auto flex max-w-3xl items-center justify-center px-4 sm:px-6">
            <GithubButton />
            <LogoutButton />
          </div>
        </div>
      </PopoverPanel>
    </header>
  </Popover>
</template>

<script setup lang="ts">
import { safeToRefs, useConfirmationDialog, useRoute } from '#imports'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverPanel,
} from '@headlessui/vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/20/solid'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import { asyncComputed } from '@vueuse/core'
import { computed, reactive, toRefs } from 'vue'
import GithubButton from '~/components/layout/GithubButton.vue'
import LogoutButton from '~/components/layout/LogoutButton.vue'
import { useCredentials } from '~/stores'

const route = useRoute()
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
    name: 'Dumps',
    href: '/dumps',
    current: computed(() => route.name?.startsWith('dumps')),
  },
  {
    name: 'Snapshots',
    href: '/snapshots',
    current: computed(() => route.name?.startsWith('snapshots')),
  },
])

const {
  credentials,
  records,
  switchInstance,
  removeInstance: doRemoveInstance,
} = safeToRefs(useCredentials())
const meili = useMeiliClient()
const { confirm } = useConfirmationDialog()
const version = asyncComputed(() => meili.getVersion())
const self: any = reactive({
  records,
  savedInstances: computed(() => Array.from(self.records.values())),
})

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
