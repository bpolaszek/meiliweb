# Meiliweb

[Meiliweb](https://meiliweb.pages.dev) is a web-based administration panel
that helps you store, organize and visualize data in your [Meilisearch](https://meilisearch.com) instances.

https://github.com/bpolaszek/meiliweb/assets/5569077/b4100e75-1e70-45dd-8c38-926a3dafafe1

## Features

- 🛢️ **Indexes**: create indexes, browse and edit every setting (searchable / filterable / sortable
  attributes, ranking rules, typo tolerance, synonyms, stop words, dictionary, separator tokens,
  embedders, displayed fields, foreign keys...)
- 🔍 **Documents**: import, search, sort, filter, edit, delete documents
- 🗝️ **Access keys**: create keys, generate tenant tokens (JWTs)
- 📋 **Tasks**: browse and monitor the task queue
- 🅿️ **Backup**: one-click dumps, snapshots and index export to a remote instance
- 🕸️ **Network**: manage multi-instance / sharded network settings
- 🪝 **Webhooks**: manage webhooks
- 🧭 **Search rules**: manage search rules
- 💬 **Chat**: use Meilisearch's AI-powered chat, when enabled on the instance
- 🧪 **Experimental features**: toggle Meilisearch experimental features from the UI

## Demo

You can run Meilweb on your search instances, provided they expose appropriate CORS headers, on [https://meiliweb.pages.dev](https://meiliweb.pages.dev).

## Local usage

Meiliweb is a [Nuxt 4](https://nuxt.com/) single-page application that entirely runs on the client
side: there's no backend, it talks directly to your Meilisearch instance from the browser.

If you have some basics with [Vue 3](https://vuejs.org/) (Composition API), [Tailwind CSS](https://tailwindcss.com/)
and [Nuxt UI](https://ui.nuxt.com/), you will easily figure out how this application has been structured.

[Yarn](https://yarnpkg.com/) is required to install packages.

Feel free to contribute!

- [Discussions](https://github.com/bpolaszek/meiliweb/discussions): Ask questions, share ideas, suggest features
- [Issues](https://github.com/bpolaszek/meiliweb/issues): Report bugs
- [Pull requests](https://github.com/bpolaszek/meiliweb/pulls): Request changes

### Installation

You mostly don't need to install it on your computer. Just head up to [https://meiliweb.pages.dev](https://meiliweb.pages.dev) and fill your instance credentials.

If for some reason you want to run it locally, you can clone the repository and install dependencies:

```bash
git clone https://github.com/bpolaszek/meiliweb.git
cd meiliweb
yarn install
```

### Launch dev server

```bash
yarn dev
```

### Build & preview

```bash
yarn build && yarn preview
```

### Docker build

```bash
docker build -t meiliweb .
```

### Docker run

```bash
docker run -p 3000:3000 -d meiliweb
```

### Code style

#### Check formatting

```bash
yarn lint
```

#### Fix formatting

```bash
yarn format
```

#### Lint

```bash
yarn run check
```
