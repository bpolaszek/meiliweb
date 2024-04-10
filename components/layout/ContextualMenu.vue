<template>
  <Menu as="div" class="relative flex items-center justify-end">
    <slot name="button">
      <MenuButton
        class="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <span class="sr-only">{{ t('open') }}</span>
        <Icon name="heroicons-solid:dots-vertical" aria-hidden="true" />
      </MenuButton>
    </slot>
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95">
      <MenuItems
        class="absolute right-7 top-0 z-10 mx-3 mt-1 w-48 origin-top-right divide-y divide-gray-200 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
        <slot />
      </MenuItems>
    </transition>
  </Menu>
</template>

<script setup>
import { Menu, MenuButton, MenuItems } from '@headlessui/vue'

const { t } = useI18n()
</script>

<i18n>
en:
  open: Open menu
</i18n>
