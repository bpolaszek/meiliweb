import match from 'match-operator'
import type { ComputedRef, MaybeRef } from 'vue'
import { useIndexLocalSettings } from './useIndexLocalSettings'

type UseFieldsReturn = {
  fields: ComputedRef<Array<string>>
  fieldsWithoutPrimaryKey: ComputedRef<Array<string>>
  nameField: ComputedRef<string>
}

export const useFields = (
  primaryKey: MaybeRef<string>,
  fields: MaybeRef<Array<string>>,
  indexUid?: string,
): UseFieldsReturn => {
  // Falls back to auto-detection whenever the override is unset, or no longer among this
  // document's fields (attribute removed from the index, or simply absent on this document).
  const nameAttribute = indexUid ? useIndexLocalSettings(indexUid).nameAttribute : computed(() => null)
  const self: any = reactive({
    primaryKey,
    fields,
    nameField: computed(() =>
      nameAttribute.value && self.fields.includes(nameAttribute.value)
        ? nameAttribute.value
        : match(true, [
            [self.fields.includes('name'), 'name'],
            [self.fields.includes('title'), 'title'],
            [self.fields.includes('label'), 'label'],
            [self.fields.includes('id'), 'id'],
            [match.default, self.primaryKey],
          ]),
    ),
    sortedFields: computed(() => [
      self.primaryKey,
      self.nameField,
      ...self.fields.filter((field: string) => ![self.primaryKey, self.nameField].includes(field)),
    ]),
    fieldsWithoutPrimaryKey: computed(() => [...self.fields.filter((field: string) => field !== self.primaryKey)]),
  })

  return {
    fields: toRef(self, 'sortedFields') as ComputedRef<Array<string>>,
    nameField: toRef(self, 'nameField') as ComputedRef<string>,
    fieldsWithoutPrimaryKey: toRef(self, 'fieldsWithoutPrimaryKey') as ComputedRef<Array<string>>,
  }
}
