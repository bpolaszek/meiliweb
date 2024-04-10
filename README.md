# Meiliweb

[Meiliweb](https://meiliweb.pages.dev) is a web-based administration panel
that helps you store, organize and visualize data in your [Meilisearch](https://meilisearch.com) instances.

# Features

- 🛢️ Indexes management: create indexes, update settings
- 🔍 Documents management: import documents, search, sort, filter
- 🗝️ Access keys management: Create keys, generate tenant tokens
- 📋 Tasks management
- 🅿️ Dumps / snapshots management

# Local usage

Meiliweb is a [Nuxt 3](https://nuxt.com/) single-page application that entirely runs on the client side.

If you have some basics with [Vue](https://vuejs.org/) and [TailwindCSS](https://tailwindcss.com/), you will easily 
figure out how this application has been structured.

[Yarn](https://yarnpkg.com/) is required to install packages.

## Installation

```bash
git clone https://github.com/bpolaszek/meiliweb.git
cd meiliweb
yarn install
```

## Launch dev server

```bash
yarn dev
```

## Build & preview

```bash
yarn build && yarn preview
```

## Code style

### Check

```bash
yarn lint
```

### Fix

```bash
yarn format
```
