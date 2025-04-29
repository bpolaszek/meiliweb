import type { ComputedRef, Ref, UnwrapRef } from 'vue'

const DEFAULT_COMPARE_FN = (a: any, b: any) => JSON.stringify(a) === JSON.stringify(b)

type ResettableRef<T> = {
  value: Ref<UnwrapRef<T>>
  reset: (newState?: T) => void
  modified: ComputedRef<boolean>
}

export function resettableRef<T>(initialState: T, compareFn: Function = DEFAULT_COMPARE_FN): ResettableRef<T> {
  const $initialState = ref<T>(initialState)
  const handle = ref<T>(structuredClone(toRaw(initialState)))

  const reset = (newState: any = undefined) => {
    if (undefined !== newState) {
      $initialState.value = structuredClone(toRaw(newState))
    }
    handle.value = structuredClone(toRaw($initialState.value))
  }

  const modified = computed(() => !compareFn(handle.value, $initialState.value))

  return {
    value: handle,
    reset,
    modified,
  }
}
