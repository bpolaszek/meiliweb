import { toRaw } from 'vue'

const keys = new WeakMap<object, number>()
let lastKey = 0

/**
 * A `:key` that follows an item of a `v-for` instead of its position, for items without an id of their own:
 * keyed by index, removing an item would hand its components' local state over to the next one.
 */
export const objectKey = (item: object) => {
  const raw = toRaw(item)
  if (!keys.has(raw)) {
    keys.set(raw, ++lastKey)
  }
  return keys.get(raw)!
}
