export type SafeToRefs<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : Ref<T[K]>
}

/**
 * Same as Vue's toRefs, except for functions which are returned as-is
 * (not wrapped as refs)
 * @param object
 */
export function safeToRefs<T extends object>(object: T): SafeToRefs<T> {
  const refs: any = toRefs(object)
  for (const key in refs) {
    if (isRef(refs[key]) && typeof unref(refs[key]) === 'function') {
      refs[key] = refs[key].value
    }
  }
  return refs as {
    [K in keyof T]: T[K] extends Function ? T[K] : Ref<T[K]>
  }
}
