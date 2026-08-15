<template>
  <USlideover
    v-model:open="open"
    :title="rule ? t('title.edit') : t('title.create')"
    side="right"
    :overlay="false"
    :ui="{ content: 'max-w-2xl', title: 'text-2xl font-semibold' }">
    <template #body>
      <form class="space-y-6" @reset.prevent="reset()" @submit.prevent="submit()">
        <p class="inline-flex w-full items-center justify-end">
          <DocumentationLink href="https://www.meilisearch.com/docs/capabilities/search_rules/getting_started" />
        </p>

        <Alert v-if="error" dismissable theme="danger" @close="error = null">
          {{ error }}
        </Alert>

        <section class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UniqueId as="div" v-slot="{ id }" class="space-y-1">
            <Label :for="id">{{ t('labels.uid') }}</Label>
            <input
              :id
              v-model="form.uid"
              required
              :disabled="!!rule"
              :pattern="SEARCH_RULE_UID_PATTERN"
              :placeholder="t('placeholders.uid')"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              class="form-input w-full disabled:bg-gray-100 disabled:text-gray-500" />
            <p class="text-xs font-light text-gray-500">{{ t('hints.uid') }}</p>
          </UniqueId>

          <UniqueId as="div" v-slot="{ id }" class="space-y-1">
            <Label :for="id">{{ t('labels.precedence') }}</Label>
            <input :id v-model="form.precedence" type="number" min="0" step="1" class="form-input w-full" />
            <p class="text-xs font-light text-gray-500">{{ t('hints.precedence') }}</p>
          </UniqueId>
        </section>

        <UniqueId as="section" v-slot="{ id }" class="space-y-1">
          <Label :for="id">{{ t('labels.description') }}</Label>
          <input
            :id
            v-model="form.description"
            :placeholder="t('placeholders.description')"
            class="form-input w-full" />
        </UniqueId>

        <section class="flex items-center gap-3">
          <USwitch v-model="form.active" size="lg" />
          <span class="text-sm text-gray-700">{{ t('labels.active') }}</span>
        </section>

        <section class="space-y-4 rounded-lg border border-gray-200 p-4">
          <h4 class="font-semibold text-gray-900">{{ t('sections.conditions') }}</h4>
          <p class="text-sm font-light text-gray-600">{{ t('hints.conditions') }}</p>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UniqueId as="div" v-slot="{ id }" class="space-y-1">
              <Label :for="id">{{ t('labels.queryKind') }}</Label>
              <select :id v-model="form.queryKind" class="w-full form-select">
                <option value="any">{{ t('queryKinds.any') }}</option>
                <option value="empty">{{ t('queryKinds.empty') }}</option>
                <option value="notEmpty">{{ t('queryKinds.notEmpty') }}</option>
              </select>
            </UniqueId>

            <UniqueId as="div" v-slot="{ id }" class="space-y-1">
              <Label :for="id">{{ t('labels.words') }}</Label>
              <input
                :id
                v-model="form.words"
                :disabled="'empty' === form.queryKind"
                :placeholder="t('placeholders.words')"
                autocapitalize="off"
                autocomplete="off"
                spellcheck="false"
                class="form-input w-full disabled:bg-gray-100 disabled:text-gray-500" />
              <p class="text-xs font-light text-gray-500">{{ t('hints.words') }}</p>
            </UniqueId>

            <UniqueId as="div" v-slot="{ id }" class="space-y-1">
              <Label :for="id">{{ t('labels.startsAt') }}</Label>
              <input :id v-model="form.start" type="datetime-local" class="form-input w-full" />
            </UniqueId>

            <UniqueId as="div" v-slot="{ id }" class="space-y-1">
              <Label :for="id">{{ t('labels.endsAt') }}</Label>
              <input :id v-model="form.end" type="datetime-local" class="form-input w-full" />
            </UniqueId>
          </div>
          <p class="text-xs font-light text-gray-500">{{ t('hints.timeWindow') }}</p>

          <p v-if="hasFilterConditions" class="text-xs font-light text-gray-500 italic">
            {{ t('hints.filterConditions') }}
          </p>
        </section>

        <section class="space-y-3 rounded-lg border border-gray-200 p-4">
          <h4 class="font-semibold text-gray-900">{{ t('sections.pins') }}</h4>
          <p class="text-sm font-light text-gray-600">{{ t('hints.pins') }}</p>

          <div v-for="(pin, i) of form.pins" :key="pin.id" class="flex items-start gap-2">
            <select v-model="pin.indexUid" class="w-1/3 form-select text-sm">
              <option value="">{{ t('placeholders.anyIndex') }}</option>
              <option v-for="uid of indexUids" :key="uid" :value="uid">{{ uid }}</option>
            </select>
            <input
              v-model="pin.documentId"
              required
              :placeholder="t('placeholders.documentId')"
              autocapitalize="off"
              autocomplete="off"
              spellcheck="false"
              class="form-input flex-1 text-sm" />
            <input
              v-model="pin.position"
              type="number"
              min="0"
              step="1"
              required
              v-tippy="t('labels.position')"
              class="form-input w-24 text-sm" />
            <button
              type="button"
              v-tippy="t('actions.removePin')"
              class="mt-2 shrink-0 text-gray-400 hover:text-red-600"
              @click="form.pins.splice(i, 1)">
              <Icon name="heroicons:trash" />
            </button>
          </div>

          <p v-if="!form.pins.length" class="text-sm font-light text-gray-400 italic">{{ t('emptyPins') }}</p>

          <Button type="button" size="small" icon="heroicons:plus" @click="addPin()">
            {{ t('actions.addPin') }}
          </Button>
        </section>

        <footer class="flex flex-col items-center justify-end sm:flex-row">
          <Buttons>
            <Button type="reset" :disabled="loading" />
            <Button type="submit" :disabled="loading" :loading />
          </Buttons>
        </footer>
      </form>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
import { ulid } from 'ulid'
import UniqueId from '~/components/UniqueId.vue'
import Label from '~/components/layout/forms/Label.vue'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import Alert from '~/components/layout/Alert.vue'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'
import {
  SEARCH_RULE_UID_PATTERN,
  useFormSubmit,
  useSearchRules,
  useTask,
  type SearchRuleConditions,
  type SearchRulePayload,
  type SearchRule,
} from '~/composables'
import { TOAST_FAILURE, TOAST_PLEASEWAIT, TOAST_SUCCESS, useToasts } from '~/stores'

type Props = {
  /** Existing rule to edit, or `null`/`undefined` to create a new one. */
  rule?: SearchRule | null
  /** Index uids offered in the pin selector. */
  indexUids?: string[]
}
const props = withDefaults(defineProps<Props>(), { indexUids: () => [] })
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const { save } = useSearchRules()
const processTask = useTask()
const { createToast } = useToasts()
const { loading, error, handle } = useFormSubmit()

/** Each pin row keeps a stable `id` for the `v-for` key; the rest maps 1:1 to a `pin` action. */
type PinRow = { id: string; indexUid: string; documentId: string; position: number }

/**
 * `datetime-local` speaks local time in `YYYY-MM-DDTHH:mm`, the API speaks RFC 3339 in UTC.
 * Both helpers return an empty value rather than throwing on unparseable input.
 */
const toDateTimeLocal = (value?: string | null) => {
  const date = new Date(value ?? '')
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toRfc3339 = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const factory = () => {
  const conditions = props.rule?.conditions
  const isEmpty = conditions?.query?.isEmpty
  return {
    uid: props.rule?.uid ?? '',
    description: props.rule?.description ?? '',
    // Kept as a string: number inputs hand back strings, and '' means "unset".
    precedence:
      null === props.rule?.precedence || undefined === props.rule?.precedence ? '' : `${props.rule.precedence}`,
    active: props.rule?.active ?? true,
    queryKind: (true === isEmpty ? 'empty' : false === isEmpty ? 'notEmpty' : 'any') as 'any' | 'empty' | 'notEmpty',
    words: conditions?.query?.words ?? '',
    start: toDateTimeLocal(conditions?.time?.start),
    end: toDateTimeLocal(conditions?.time?.end),
    pins: (props.rule?.actions ?? []).map(({ selector, action }) => ({
      id: ulid(),
      indexUid: selector.indexUid ?? '',
      documentId: selector.id,
      position: action.position,
    })) as PinRow[],
  }
}

const form = reactive(factory())
const reset = () => Object.assign(form, factory())
// Re-seed the form whenever the editor is (re)opened for a different rule.
watch(open, (isOpen) => isOpen && reset())

/** Filter conditions are not editable here; we only warn that they exist and are preserved. */
const hasFilterConditions = computed(() => !!props.rule?.conditions?.filter)

const addPin = () => form.pins.push({ id: ulid(), indexUid: '', documentId: '', position: form.pins.length })

/**
 * Unlike top-level keys, `conditions` is replaced wholesale by the API, so we rebuild it
 * in full — including the `filter` part the form doesn't expose.
 */
const buildConditions = (): SearchRuleConditions => {
  const conditions: SearchRuleConditions = {}

  const query: NonNullable<SearchRuleConditions['query']> = {}
  if ('any' !== form.queryKind) {
    query.isEmpty = 'empty' === form.queryKind
  }
  // An empty query cannot contain words, so the two are mutually exclusive.
  if ('empty' !== form.queryKind && form.words.trim()) {
    query.words = form.words.trim()
  }
  if (Object.keys(query).length) {
    conditions.query = query
  }

  const time: NonNullable<SearchRuleConditions['time']> = {}
  if (form.start) {
    time.start = toRfc3339(form.start)
  }
  if (form.end) {
    time.end = toRfc3339(form.end)
  }
  if (Object.keys(time).length) {
    conditions.time = time
  }

  if (props.rule?.conditions?.filter) {
    conditions.filter = props.rule.conditions.filter
  }

  return conditions
}

const buildPayload = (): SearchRulePayload => ({
  description: form.description.trim() || null,
  precedence: '' === form.precedence ? null : Number(form.precedence),
  active: form.active,
  conditions: buildConditions(),
  actions: form.pins
    .filter(({ documentId }) => documentId.trim())
    .map(({ indexUid, documentId, position }) => ({
      selector: { indexUid: indexUid || null, id: documentId.trim() },
      action: { type: 'pin' as const, position: Number(position) },
    })),
})

const submit = () =>
  handle(async () => {
    const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: t('toasts.saving') })
    try {
      const task = await processTask(() => save(form.uid.trim(), buildPayload()))
      if ('succeeded' !== task.status) {
        // `error` only exists on a resolved Task, not on the enqueued one returned on timeout.
        throw new Error(('error' in task && task.error?.message) || t('toasts.failed'))
      }
      toast.update({ ...TOAST_SUCCESS(t) })
      open.value = false
      emit('saved')
    } catch (e) {
      toast.update({ ...TOAST_FAILURE(t) })
      throw e
    }
  })
</script>

<i18n>
en:
  title:
    create: Create search rule
    edit: Edit search rule
  sections:
    conditions: Conditions
    pins: Pinned documents
  labels:
    uid: Rule ID
    description: Description
    precedence: Precedence
    active: Rule is active
    queryKind: Applies to
    words: Query contains
    startsAt: Starts at
    endsAt: Ends at
    position: Position
  queryKinds:
    any: Any query
    empty: Empty queries only
    notEmpty: Non-empty queries only
  placeholders:
    uid: black-friday
    description: What this rule is for
    words: running shoes
    documentId: Document ID
    anyIndex: Any index
  hints:
    uid: Letters, digits, hyphens and underscores. It cannot be changed later.
    precedence: Lower values win when several rules match. Leave empty for none.
    conditions: All conditions below must match for the rule to apply. Leave them all empty to always apply it.
    words: The rule applies when the search query contains these words.
    timeWindow: Both bounds are optional, and must be in the future.
    filterConditions: This rule also carries filter conditions, which are not editable here. They will be preserved.
    pins: Each document is pinned at the given position (0 is the first result) when the rule applies.
  emptyPins: No pinned document yet.
  actions:
    addPin: Add a pinned document
    removePin: Remove
  toasts:
    saving: Saving search rule...
    failed: Meilisearch could not apply this rule.
</i18n>
