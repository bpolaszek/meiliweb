import match from 'match-operator'
import type { MaybeRef, Ref } from 'vue'
import { safeToRefs, type SafeToRefs } from '~/utils'

type UsePagination = {
  offset: number
  itemsPerPage: number
  totalItems: number
  currentPage: number
  previousPage: number
  nextPage: number
  lastPage: number
  getPageOffset: (page: number) => number
}

export const usePagination = (itemsPerPage: MaybeRef<number>): SafeToRefs<UsePagination> => {
  const totalItems: Ref<number> = ref(0)
  const offset: Ref<number> = ref(0)
  const self: UsePagination = reactive({
    offset,
    itemsPerPage,
    totalItems,
    lastPage: computed(() =>
      match(0, [
        [[self.itemsPerPage, self.totalItems], 1],
        [match.default, Math.ceil(self.totalItems / self.itemsPerPage)],
      ]),
    ),
    currentPage: computed(() =>
      match(0, [
        [[self.itemsPerPage, self.totalItems], 1],
        [match.default, Math.ceil((self.offset + self.itemsPerPage) / self.itemsPerPage)],
      ]),
    ),
    previousPage: computed(() =>
      match(self.currentPage, [
        [1, 1],
        [match.default, self.currentPage - 1],
      ]),
    ),
    nextPage: computed(() =>
      match(self.currentPage, [
        [self.lastPage, self.lastPage],
        [match.default, self.currentPage + 1],
      ]),
    ),
    getPageOffset: (page: number) => self.itemsPerPage * page - self.itemsPerPage,
  })

  watch(toRef(self, 'itemsPerPage'), () => {
    self.offset = 0
  })

  return safeToRefs(self)
}
