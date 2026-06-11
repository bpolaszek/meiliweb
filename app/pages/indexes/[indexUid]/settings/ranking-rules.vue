<template>
  <form class="space-y-4" @reset.prevent="reset()" @submit.prevent="submit()">
    <h3 class="inline-flex w-full items-start justify-between">
      <span class="inline-flex flex-col gap-1">
        <span class="text-xl font-semibold">{{ t('title') }}</span>
        <span class="text-sm italic text-gray-600">
          {{ t('description') }}
        </span>
      </span>
      <DocumentationLink href="https://www.meilisearch.com/docs/reference/api/settings#ranking-rules" />
    </h3>

    <section v-sortable class="space-y-2" @end="onOrderChange">
      <div
        v-for="(rankingRule, i) of self.rankingRules"
        :key="i"
        role="treeitem"
        class="flex cursor-move items-center justify-between gap-2 rounded-md border border-gray-100 px-2 py-1.5 text-sm text-gray-800 shadow-sm">
        <dl class="flex-1 overflow-hidden">
          <template v-if="isBuiltIn(rankingRule)">
            <dt class="font-medium capitalize">{{ rankingRule }}</dt>
            <dd class="text-xs italic text-gray-600">{{ t(`descriptions.${rankingRule}`) }}</dd>
          </template>
          <template v-else>
            <dt class="flex items-center gap-1.5 font-medium">
              <span
                class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-semibold"
                :class="
                  parseCustomRule(rankingRule)?.direction === 'asc'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-orange-100 text-orange-700'
                ">
                {{ parseCustomRule(rankingRule)?.direction === 'asc' ? '↑ asc' : '↓ desc' }}
              </span>
              <span class="truncate">{{ parseCustomRule(rankingRule)?.field }}</span>
            </dt>
            <dd class="text-xs italic text-gray-600">{{ t('descriptions.custom') }}</dd>
          </template>
        </dl>
        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="!isBuiltIn(rankingRule)"
            type="button"
            class="text-gray-400 transition-colors hover:text-red-500"
            :title="t('actions.removeRule')"
            @click="removeRule(i)">
            <Icon name="mdi:close" />
          </button>
          <Icon name="uil:draggabledots" />
        </div>
      </div>
    </section>

    <div class="flex items-center gap-2">
      <select v-model="newRuleDirection" class="form-input shrink-0 text-sm">
        <option value="asc">↑ asc</option>
        <option value="desc">↓ desc</option>
      </select>
      <input
        v-model="newRuleField"
        type="text"
        class="form-input flex-1 text-sm"
        :placeholder="t('placeholders.fieldName')"
        @keydown.enter.prevent="addCustomRule()" />
      <Button
        type="button"
        theme="secondary"
        icon="mdi:plus"
        size="small"
        :disabled="!newRuleField.trim()"
        @click="addCustomRule()">
        {{ t('actions.addRule') }}
      </Button>
    </div>

    <footer class="flex flex-col items-center justify-between sm:flex-row">
      <Button
        type="button"
        theme="primary"
        icon="mdi:bin"
        :disabled="loading || 0 === rankingRules.length"
        @click="resetToInitialValue()">
        {{ t('buttons.reset') }}
      </Button>
      <Buttons>
        <Button type="submit" :disabled="!modified || loading" :loading="loading" />
      </Buttons>
    </footer>
  </form>
</template>

<script setup lang="ts">
import { TaskError, useFormSubmit, useTask } from '~/composables'
import { TOAST_FAILURE, TOAST_SUCCESS, useToasts } from '~/stores'
import { resettableRef } from '~/utils'
import Button from '~/components/layout/forms/Button.vue'
import Buttons from '~/components/layout/forms/Buttons.vue'
import type { Task } from 'meilisearch'
import { useConfirmationDialog } from '#imports'
import DocumentationLink from '~/components/layout/DocumentationLink.vue'

const emit = defineEmits<{
  (e: 'error', error: TaskError): void
}>()
type Props = {
  indexUid: string
}
const props = defineProps<Props>()

const BUILT_IN_RULES = ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness']

function isBuiltIn(rule: string): boolean {
  return BUILT_IN_RULES.includes(rule)
}

function parseCustomRule(rule: string): { direction: 'asc' | 'desc'; field: string } | null {
  const m = rule.match(/^(.+):(asc|desc)$/)
  if (!m) return null
  return { field: m[1]!, direction: m[2] as 'asc' | 'desc' }
}

const { t } = useI18n()
const meili = useMeiliClient()
const index = meili.index(props.indexUid)
const { loading, error, handle } = useFormSubmit({
  confirm: { text: t('confirmations.submit') },
})
const processTask = useTask()
const { createToast } = useToasts()
const { confirm } = useConfirmationDialog()
const initialRankingRules = await index.getRankingRules()
const { value: rankingRules, reset, modified } = resettableRef([...initialRankingRules])
const self = reactive({ rankingRules })

const newRuleDirection = ref<'asc' | 'desc'>('asc')
const newRuleField = ref('')

function onOrderChange(event: Event & { oldIndex: number; newIndex: number }) {
  const item = self.rankingRules.splice(event.oldIndex, 1)[0]
  self.rankingRules.splice(event.newIndex, 0, item!)
}

function addCustomRule() {
  const field = newRuleField.value.trim()
  if (!field) return
  self.rankingRules.push(`${field}:${newRuleDirection.value}`)
  newRuleField.value = ''
}

function removeRule(i: number) {
  self.rankingRules.splice(i, 1)
}

const submit = async () => {
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.updateRankingRules.title'),
  })
  await handle(async () => {
    toast.spawn()
    await processTask(() => index.updateRankingRules(self.rankingRules), {
      onSuccess: async () => {
        toast.update({ ...TOAST_SUCCESS(t) })
        reset(self.rankingRules)
      },
      onCanceled: () =>
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.canceledTask'),
        }),
      onFailure: (task: Task) => {
        toast.update({
          ...TOAST_FAILURE(t),
          text: t('toasts.texts.failedTask'),
        })
        emit('error', task.error as TaskError)
      },
    })
    reset(self.rankingRules)
  })
}

const resetToInitialValue = async () => {
  if (!(await confirm({ text: t('confirmations.reset') }))) {
    return
  }
  const toast = createToast({
    ...TOAST_PLEASEWAIT(t),
    immediate: false,
    title: t('toasts.clearRankingRules.title'),
  })
  toast.spawn()
  await processTask(() => index.resetRankingRules(), {
    onSuccess: async () => {
      toast.update({ ...TOAST_SUCCESS(t) })
      reset(await index.getRankingRules())
    },
    onCanceled: () =>
      toast.update({
        ...TOAST_FAILURE(t),
        text: t('toasts.texts.canceledTask'),
      }),
    onFailure: (task: Task) => {
      toast.update({
        ...TOAST_FAILURE(t),
        text: t('toasts.texts.failedTask'),
      })
      emit('error', task.error as TaskError)
    },
  })
}
</script>

<i18n>
en:
  title: Ranking Rules
  description: Rules applied in order to rank search results. Built-in rules cannot be removed. Drag-and-drop to reorder, and add custom rules based on document attributes.
  toasts:
    updateRankingRules:
      title: Updating Ranking Rules...
    clearRankingRules:
      title: Resetting Ranking Rules...
  confirmations:
    submit: Submit changes?
    reset: Reset Ranking Rules to default order?
  descriptions:
    words: Sorts results by decreasing number of matched query terms.
    typo: Sorts results by increasing number of typos.
    proximity: Sorts results by increasing distance between matched query terms.
    attribute: Sorts results based on the attribute ranking order.
    sort: Sorts results based on parameters decided at query time.
    exactness: Sorts results based on the similarity of the matched words with the query words.
    custom: Custom ranking rule — sorts results by the value of this attribute.
  placeholders:
    fieldName: "e.g. price or publication_year"
  actions:
    addRule: Add rule
    removeRule: Remove rule
  buttons:
    reset: Reset to defaults
</i18n>
