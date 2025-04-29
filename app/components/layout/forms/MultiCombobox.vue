<template>
  <div
    ref="container"
    @keydown.esc="hideOptions"
    @keyup="({ code }) => ['ArrowUp', 'ArrowDown'].includes(code) && showOptions()">
    <Combobox as="div" v-model="selectedKeys" multiple>
      <slot name="label">
        <ComboboxLabel class="block text-sm font-medium leading-5 text-gray-700 empty:hidden">
          {{ label }}
        </ComboboxLabel>
      </slot>

      <div class="relative">
        <span class="inline-block w-full shadow-sm">
          <div
            class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-2 pr-10 text-left transition duration-150 ease-in-out focus-within:border-primary-500 focus-within:outline-none focus-within:ring-1 focus-within:ring-primary-500 sm:text-sm sm:leading-5">
            <span class="flex flex-wrap gap-2">
              <span v-if="selectedKeys.length === 0" class="cursor-pointer p-0.5 empty:hidden" @click="focus">
                <slot name="empty-state" />
              </span>

              <template v-if="!hideTags">
                <span v-for="item in selectedItems" :key="uniqueKey(item)">
                  <slot name="selected-items" v-bind="{ item, stringify, remove }">
                    <span class="flex items-center gap-1 rounded-lg bg-primary-600 px-2 py-0.5 text-white">
                      <span>{{ stringify(item) }}</span>
                      <button role="button" @click="remove(item)">
                        <XMarkIcon class="h-4 w-4" />
                      </button>
                    </span>
                  </slot>
                </span>
              </template>

              <ComboboxInput
                ref="input"
                autocomplete="off"
                v-bind="inputAttrs"
                class="grow border-none p-0 outline-none focus:ring-0"
                @focus="showOptions"
                @blur="onBlur($event.target)"
                @change="query = $event.target.value" />
            </span>

            <div class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
              <button v-if="clearable" type="button" @click="clear">
                <XMarkIcon v-if="0 !== selectedKeys.length" class="h-5 w-5 text-gray-300" aria-hidden="true" />
              </button>
              <button type="button" @click="toggle">
                <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </span>

        <div v-show="open" class="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ComboboxOptions
            :static="!autoHide"
            v-if="availableItems.length > 0"
            class="shadow-xs max-h-60 overflow-auto rounded-md py-1 text-base leading-6 focus:outline-none sm:text-sm sm:leading-5">
            <ComboboxOption
              v-for="item of availableItems"
              :key="uniqueKey(item)"
              v-slot="{ active, selected }"
              :value="uniqueKey(item)"
              :disabled="disabled.includes(uniqueKey(item))"
              @click="() => autoHide && hideOptions()">
              <slot v-bind="{ item, active, selected, stringify }">
                <li
                  class="relative cursor-default select-none py-2 pl-3 pr-9 focus:outline-none"
                  :class="active ? 'bg-primary-600 text-white' : 'text-gray-900'">
                  <span
                    class="block"
                    :class="{
                      truncate: !active,
                      'font-semibold': selected,
                      'font-normal': !selected,
                    }">
                    {{ stringify(item) }}
                  </span>
                  <span
                    v-if="selected"
                    class="absolute inset-y-0 right-0 flex items-center pr-4"
                    :class="{
                      'text-white': active,
                      'text-primary-600': !active,
                    }">
                    <CheckIcon class="h-5 w-5" />
                  </span>
                </li>
              </slot>
            </ComboboxOption>
          </ComboboxOptions>
        </div>
      </div>
    </Combobox>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { Combobox, ComboboxInput, ComboboxLabel, ComboboxOption, ComboboxOptions } from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { get, onClickOutside, set, syncRef, templateRef } from '@vueuse/core'

// eslint-disable-next-line no-undef
const emit = defineEmits(['update:modelValue', 'update:query', 'clear'])

// eslint-disable-next-line no-undef
const props = defineProps({
  items: {
    type: Array, // Choices of the combobox.
    required: true,
  },
  modelValue: {
    type: Array, // Selected choices of the combobox.
    default: () => [],
  },
  query: {
    default: '',
  },
  stringify: {
    type: Function, // How to render a choice as a string.
    default: undefined,
  },
  uniqueKey: {
    type: Function, // How to render a choice as a unique ID.
    default: undefined,
  },
  filter: {
    type: Function, // How to filter choices based on query.
    default: undefined,
  },
  inputAttrs: {
    type: Object, // Attributes to pass to the <input> tag.
    default: () => ({}),
  },
  excludeSelected: {
    type: Boolean, // Exclude already selected choices from available items.
    default: false,
  },
  hideTags: {
    type: Boolean, // Hide selected choices as "tags".
    default: false,
  },
  clearable: {
    type: Boolean, // Display a clear button to remove all selected choices.
    default: false,
  },
  label: {
    type: String, // Label to display.
    default: undefined,
  },
  disabled: {
    type: Array, // Choices that are not selectable.
    default: () => [],
  },
  autoHide: {
    type: Boolean, // Hide choices after picking one.
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
})

const open = ref(false)
const toggle = () => set(open, !get(open))
const { items, excludeSelected, modelValue, query: inputQuery } = toRefs(props)
const stringify = props.stringify ?? ((item) => item?.name ?? item ?? '')
const uniqueKey = props.uniqueKey ?? ((item) => item?.id ?? item)
const cachedItems = reactive([])
const query = ref(get(inputQuery))
const selectedKeys = ref([])
const selectedItems = computed(() =>
  cachedItems.filter((item) => get(selectedKeys).map(uniqueKey).includes(uniqueKey(item))),
)

const filter =
  props.filter ??
  (async (query, items) => get(items).filter((item) => stringify(item).toLowerCase().includes(query.toLowerCase())))
const filteredItems = computed(() =>
  get(items).filter((item) => !get(selectedKeys).map(uniqueKey).includes(uniqueKey(item))),
)
const availableItems = ref(get(items))

const input = templateRef('input')
const showOptions = () => set(open, true)
const hideOptions = () => set(open, false)
const focus = () => get(input).$el.focus()

function onBlur(target) {
  if ('' === target.value && '' !== get(query)) {
    target.value = get(query)
  }
}

async function clear() {
  set(selectedKeys, [])
  set(query, '')
  await nextTick()
  focus()
  emit('clear')
}

async function remove(itemToRemove) {
  set(
    selectedKeys,
    get(selectedKeys).filter((item) => uniqueKey(item) !== uniqueKey(itemToRemove)),
  )
  await nextTick()
  focus()
}

const container = templateRef('container')
onClickOutside(container, () => hideOptions())

watch(
  items,
  (items) => {
    items.forEach((item) => {
      if (-1 === cachedItems.findIndex((cachedItem) => uniqueKey(cachedItem) === uniqueKey(item))) {
        cachedItems.push(item)
      }
    })
  },
  { immediate: true },
)
watch(modelValue, (ids) => set(selectedKeys, ids), { immediate: true })
watch(selectedKeys, (ids) => emit('update:modelValue', ids))
watch(selectedKeys, () => set(query, ''))
watch(query, (query) => emit('update:query', query))
watch(query, async (query) => {
  const results = await filter(get(query), get(excludeSelected) ? get(filteredItems) : get(items))
  set(availableItems, get(results) ?? [])
})
watch(inputQuery, (value) => set(query, null != value ? `${value}` : ''))
syncRef(items, availableItems, { direction: 'ltr' })
watch(query, (query) => (get(input).$el.value = query))
watch(selectedKeys, () => props.autoHide && hideOptions())
watch(query, () => showOptions())
onMounted(() => nextTick().then(() => (get(input).$el.value = get(query))))
onMounted(() => props.autofocus && focus())
</script>
