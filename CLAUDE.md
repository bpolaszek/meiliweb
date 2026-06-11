# Meiliweb

Web-based admin panel for [Meilisearch](https://meilisearch.com): manage indexes, documents, keys, tasks, dumps and snapshots from the browser.

## Stack

- **Nuxt 3** (`compatibilityVersion: 4`) — **SSR disabled**, runs entirely client-side
- **Vue 3** (Composition API, `<script setup lang="ts">`)
- **TypeScript** — strict via Nuxt's generated `tsconfig`
- **Pinia** for state, with `@vueuse/core` `useLocalStorage` for persisted stores
- **TailwindCSS** (`@tailwindcss/forms` with `strategy: 'class'`, `@tailwindcss/container-queries`)
- **@nuxtjs/i18n** — translations live **inline** in each component via `<i18n>` SFC blocks (YAML), not in a central locale file
- **meilisearch** (official JS client) + **meilisearch-filters** for filter expressions
- **Yarn** for package management

No backend: the Nitro server is unused; the app talks directly to the user's Meilisearch instance from the browser.

## Common commands

```bash
yarn dev        # dev server (Nuxt) on :3000
yarn build      # production build
yarn preview    # serve the built app
yarn lint       # prettier --check
yarn format     # prettier --write
yarn check      # eslint
```

Docker:

```bash
docker build -t meiliweb .
docker run -p 3000:3000 -d meiliweb
```

## Project structure

Nuxt 4 layout — application code lives under `app/`.

```
app/
├── app.vue                 # root layout, mounts <NuxtPage>, toasts, global dialogs
├── error.vue               # error page
├── middleware/
│   └── credentials-check.global.ts   # redirects to /login when no credentials
├── pages/
│   ├── login.vue           # credentials form (URL + API key + friendly name)
│   ├── index.vue           # entry: pings Meili, then redirects to /indexes
│   ├── indexes/            # index list, create, [indexUid]/documents, [indexUid]/settings/*
│   ├── keys/               # key list, create, generate tenant tokens
│   ├── tasks/              # tasks browser
│   ├── dumps/, snapshots/  # one-click dumps / snapshots
│   └── ...
├── components/
│   ├── layout/             # shared UI: Layout, Modal, SlideOver, Button, Table, Toaster, ...
│   ├── documents/          # documents views (table, cards, map), filter panel, facets
│   ├── settings/           # per-feature editors (synonyms, embedders, stop-words, ...)
│   └── debug/
├── composables/            # see "Patterns" below
├── stores/                 # Pinia stores
├── utils/                  # framework-agnostic helpers
├── plugins/                # v-focus directive, vue-tippy, vue3-sortable
└── assets/
```

## Routing & auth

- Single global middleware `credentials-check.global.ts` gates **every** route except `login`. No credentials → `/login`.
- Credentials are stored in `localStorage` via the `credentials` Pinia store. Two keys:
  - `credentials-all` — `Map<id, CredentialsRecord>` of known instances
  - `credentials-current` — the active record
- Each record has an `id` derived from `xxh32(JSON.stringify({baseUri, accessKey}))`, so re-saving the same instance is idempotent.
- `app.vue`'s `pageKey` includes the current credentials id, which **forces a full page re-render when the active instance changes** — rely on that instead of manually invalidating per-page state.

## Talking to Meilisearch

Always go through the composable, never instantiate `Meilisearch` directly:

```ts
import { useMeiliClient } from '~/composables'
const meili = useMeiliClient()
// optional override with a different access key (e.g. for tenant tokens):
const meiliAsTenant = useMeiliClient(tenantToken)
```

The client reads `baseUri` / `accessKey` reactively from the credentials store.

For long-running operations, wrap them with `useTask`:

```ts
const processTask = useTask()
const task = await processTask(
  () => meili.createIndex(uid, { primaryKey }),
  { onCanceled: ..., onFailure: ... },
)
if (task.status === 'failed') throw new Error('…')
```

See `composables/useIndexOperations.ts` for the canonical pattern (duplicate / rename index = chained `processTask` calls + toast updates).

## Patterns & idioms

These are load-bearing conventions across the codebase — follow them when adding code.

### `self = reactive({...})` + `safeToRefs`

To keep multiple reactive sources coordinated inside a `setup` block, collect them into a single `reactive` object and expose what's needed via refs:

```ts
const route = useRoute()
const { credentials } = toRefs(useCredentials())

const self: any = reactive({
  credentials,
  pageKey: computed(() => [route.fullPath, self.credentials?.id].join(':')),
})

const { pageKey } = toRefs(self)
```

Use `safeToRefs` (from `~/utils`) instead of bare `toRefs` when destructuring **stores** — it tolerates non-ref properties (actions, plain values) without warnings:

```ts
import { safeToRefs } from '~/utils'
import { useConfirmationDialog } from '~/stores'

const { confirmationDialog } = safeToRefs(useConfirmationDialog())
```

### Promisified dialogs

Modals are launched imperatively and `await`ed:

```ts
import { usePromisifiedDialogs } from '~/stores'
import IndexNamePromptModal from '~/components/settings/IndexNamePromptModal.vue'

const { openDialog } = usePromisifiedDialogs()
const newIndexUid = await openDialog(IndexNamePromptModal, {
  indexUid: `${indexUid}-copy`,
})
```

The modal component resolves/rejects the promise on confirm/cancel. Don't reach for ad-hoc `v-model:open` patterns when this fits.

### Toasts

```ts
import {
  TOAST_PLEASEWAIT,
  TOAST_SUCCESS,
  TOAST_FAILURE,
  useToasts,
} from '~/stores'

const { createToast } = useToasts()
const toast = createToast({ ...TOAST_PLEASEWAIT(t), title: '…' })
// later:
toast.update({ ...TOAST_SUCCESS(t) })
```

### Forms

`useFormSubmit` wraps the submit handler with loading state + error capture. Use it instead of hand-rolling `loading` refs.

### `tryOrThrow`

Wrap potentially-throwing calls when you want the error surfaced through the standard error pipeline instead of a silent rejection. See `utils/try-or-throw.ts`.

### Index-scoped local settings

Per-instance, per-index UI preferences (column order, display mode, ...) live in `useIndexLocalSettings` — namespaced in `localStorage` so they don't bleed across instances.

### Re-exports

Both `~/composables` and `~/stores` and `~/utils` expose a barrel `index.ts`. **Import from the barrel**, not the individual file:

```ts
// ✅ good
import { useMeiliClient, useTask } from '~/composables'
import { useCredentials, useToasts } from '~/stores'

// ❌ avoid
import { useMeiliClient } from '~/composables/useMeiliClient'
```

When you add a new composable / store / util, add it to the matching `index.ts`.

## i18n

Translations are **per-component** via `<i18n>` SFC blocks in YAML:

```vue
<i18n>
en:
  title: My page
  labels:
    name: Name
</i18n>
```

Global app-wide strings live in `app.vue`'s `<i18n global>` block. There is no central `locales/` directory — don't introduce one without discussion.

## Styling

- Tailwind utility-first. Custom primary palette (pink) defined in `tailwind.config.js`.
- Forms use the `class` strategy: apply `form-input`, `form-checkbox`, etc. explicitly (see `app.vue`'s `@layer components` for the project-wide tweaks).
- `prettier-plugin-tailwindcss` auto-sorts class lists — don't fight the order.
- SCSS is allowed (`sass` is installed) but rare; prefer Tailwind.

## Code style

Enforced by ESLint (`standard-with-typescript` + `vue/flat/essential`) and Prettier:

- **No semicolons**, **single quotes**, **trailing commas: all**, `bracketSameLine: true`
- 2-space indent for `.ts` / `.vue` / `.js` / `.html`
- 120-char max line
- `prettier-plugin-organize-imports` cleans up imports — let it
- Always run `yarn format` before committing significant changes; CI runs `yarn lint` (Prettier check), which will fail on unformatted code

## Autonomous development workflow

This section enables developing and testing features end-to-end without human input: a controlled Meilisearch instance, real datasets, and Playwright browser automation.

### Fixed constants (used throughout)

```
MEILI_URL  = http://127.0.0.1:7700
MEILI_KEY  = meiliweb-dev-masterkey
MEILI_DATA = /tmp/meiliweb-test-meili
```

### 1. Start a test Meilisearch instance

```bash
mkdir -p /tmp/meiliweb-test-meili
meilisearch \
  --http-addr 127.0.0.1:7700 \
  --master-key meiliweb-dev-masterkey \
  --db-path /tmp/meiliweb-test-meili \
  --no-analytics \
  --env development &
MEILI_PID=$!

# Poll until ready
until curl -sf http://127.0.0.1:7700/health > /dev/null; do sleep 0.3; done
```

Stop and wipe: `kill $MEILI_PID && rm -rf /tmp/meiliweb-test-meili`

> If port 7700 is already in use, pick a free port:
> `MEILI_PORT=7700; while lsof -ti:$MEILI_PORT > /dev/null 2>&1; do MEILI_PORT=$((MEILI_PORT+1)); done`

### 2. Seed test data

Datasets from https://github.com/meilisearch/datasets — download via `gh api` to avoid rate limits.

**movies** (32 K docs, 19 MB) — canonical Meilisearch demo; rich for search/filter/sort/facet testing:
```bash
gh api repos/meilisearch/datasets/contents/datasets/movies/movies.json --jq '.download_url' \
  | xargs curl -s \
  | curl -sX POST http://127.0.0.1:7700/indexes/movies/documents \
    -H "Authorization: Bearer meiliweb-dev-masterkey" \
    -H "Content-Type: application/json" --data-binary @-

curl -sX PATCH http://127.0.0.1:7700/indexes/movies/settings \
  -H "Authorization: Bearer meiliweb-dev-masterkey" \
  -H "Content-Type: application/json" \
  -d '{"filterableAttributes":["genres","release_date"],"sortableAttributes":["release_date","title"]}'
```

**books** (244 docs, 94 KB) — fast to index; good for nested objects and quick iteration:
```bash
gh api repos/meilisearch/datasets/contents/datasets/books/books.json --jq '.download_url' \
  | xargs curl -s \
  | curl -sX POST http://127.0.0.1:7700/indexes/books/documents \
    -H "Authorization: Bearer meiliweb-dev-masterkey" \
    -H "Content-Type: application/json" --data-binary @-
```

**restaurants** (200 docs, 178 KB, with bundled `settings.json`) — ready-made for filter/facet/category testing:
```bash
gh api repos/meilisearch/datasets/contents/datasets/restaurants/restaurants.json --jq '.download_url' \
  | xargs curl -s \
  | curl -sX POST http://127.0.0.1:7700/indexes/restaurants/documents \
    -H "Authorization: Bearer meiliweb-dev-masterkey" \
    -H "Content-Type: application/json" --data-binary @-

gh api repos/meilisearch/datasets/contents/datasets/restaurants/settings.json --jq '.content' \
  | base64 -d \
  | curl -sX PATCH http://127.0.0.1:7700/indexes/restaurants/settings \
    -H "Authorization: Bearer meiliweb-dev-masterkey" \
    -H "Content-Type: application/json" --data-binary @-
```

Wait for all indexing tasks to finish before testing the UI:
```bash
until [ "$(curl -s 'http://127.0.0.1:7700/tasks?statuses=enqueued,processing' \
  -H 'Authorization: Bearer meiliweb-dev-masterkey' | python3 -c 'import json,sys; print(json.load(sys.stdin)["total"])')" = "0" ]; do sleep 1; done
```

### 3. Start Meiliweb dev server

Port 3000 may already be occupied. Find the next free port and start:

```bash
PORT=3000
while lsof -ti:$PORT > /dev/null 2>&1; do PORT=$((PORT+1)); done
PORT=$PORT yarn dev &
NUXT_PID=$!

# Poll until ready
until curl -sf http://localhost:$PORT > /dev/null 2>&1; do sleep 1; done
echo "Meiliweb ready at http://localhost:$PORT"
```

### 4. Authenticate via Playwright

Always take a snapshot first to get exact `target` references for form fields.

```
browser_navigate  → http://localhost:<PORT>/login
browser_snapshot  → identify input targets (e.g. [ref=e12], [ref=e13], ...)
browser_fill_form → fill Instance URL, Access Token, Instance Name
browser_click     → submit button
browser_wait_for  → wait for redirect / index list to appear
browser_take_screenshot → verify visually
```

Example fill_form call (after snapshot, adapt `target` refs):
```json
{
  "fields": [
    { "target": "input[placeholder='http://localhost:7700']", "name": "Instance URL",    "type": "textbox", "value": "http://127.0.0.1:7700" },
    { "target": "input[type='password']",                    "name": "Access Token",    "type": "textbox", "value": "meiliweb-dev-masterkey" },
    { "target": "input[placeholder='Local instance']",       "name": "Instance Name",   "type": "textbox", "value": "Dev instance" }
  ]
}
```

### 5. Cleanup

```bash
kill $MEILI_PID $NUXT_PID 2>/dev/null
rm -rf /tmp/meiliweb-test-meili
```

---

## Things not to do

- **Don't add SSR-dependent code.** `ssr: false` is intentional — the app must work as a static SPA (it's deployed on Cloudflare Pages).
- **Don't add a backend / Nitro routes.** All Meilisearch calls go directly from the browser to the user's instance.
- **Don't bypass `useMeiliClient`** by `new Meilisearch(...)` — you'll lose reactive credential switching.
- **Don't centralize i18n** unless asked.
- **Don't import from deep paths** when a barrel exists.
- **Don't introduce a new state-management lib.** Pinia + `useLocalStorage` covers everything here.
