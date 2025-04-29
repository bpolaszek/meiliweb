import match from 'match-operator'
import type { ComputedRef, MaybeRef } from 'vue'

type UseFieldsReturn = {
  fields: ComputedRef<Array<string>>
  fieldsWithoutPrimaryKey: ComputedRef<Array<string>>
  nameField: ComputedRef<string>
}

export const useFields = (primaryKey: MaybeRef<string>, fields: MaybeRef<Array<string>>): UseFieldsReturn => {
  const self: any = reactive({
    primaryKey,
    fields,
    nameField: computed(() =>
      match(true, [
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
