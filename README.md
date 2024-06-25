# Meiliweb

[Meiliweb](https://meiliweb.pages.dev) is a web-based administration panel
that helps you store, organize and visualize data in your [Meilisearch](https://meilisearch.com) instances.

https://github.com/bpolaszek/meiliweb/assets/5569077/b4100e75-1e70-45dd-8c38-926a3dafafe1

## Features

- 🛢️ Indexes management: create indexes, update settings
- 🔍 Documents management: import documents, search, sort, filter
- 🗝️ Access keys management: Create keys, generate tenant tokens (JWTs)
- 📋 Tasks management
- 🅿️ Dumps / snapshots management

## Demo

You can run Meilweb on your search instances, provided they expose appropriate CORS headers, on [https://meiliweb.pages.dev](https://meiliweb.pages.dev).

## Local usage

Meiliweb is a [Nuxt 3](https://nuxt.com/) single-page application that entirely runs on the client side.

If you have some basics with [Vue](https://vuejs.org/) and [TailwindCSS](https://tailwindcss.com/), you will easily
figure out how this application has been structured.

[Yarn](https://yarnpkg.com/) is required to install packages.

Feel free to contribute!

- [Discussions](https://github.com/bpolaszek/meiliweb/discussions): Ask questions, share ideas, suggest features
- [Issues](https://github.com/bpolaszek/meiliweb/issues): Report bugs
- [Pull requests](https://github.com/bpolaszek/meiliweb/pulls): Request changes

### Installation

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

### Code style

#### Check

```bash
yarn lint
```

#### Fix

```bash
yarn format
```
