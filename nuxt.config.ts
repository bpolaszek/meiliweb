import TailwindConfig from './tailwind.config'

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  ssr: false,
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      debugMemoryUsage: false,
    },
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    [
      '@nuxtjs/tailwindcss',
      {
        editorSupport: true,
        config: TailwindConfig,
      },
    ],
    [
      '@nuxtjs/google-fonts',
      {
        families: {
          'DM Sans': '200..700',
        },
      },
    ],
  ],
  i18n: {
    // Single-locale SPA with inline <i18n> SFC blocks: keep routes unprefixed.
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: ['en'],
  },
  compatibilityDate: '2024-08-15',
  vite: {
    build: {
      rollupOptions: {
        external: ['crypto'],
      },
    },
    optimizeDeps: {
      include: [
        '@headlessui/vue',
        '@heroicons/vue/20/solid',
        '@heroicons/vue/24/outline',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vueform/slider',
        '@vueuse/core',
        'file-size', // CJS
        'humanize-string',
        'json-oneline-stringify',
        'jwt-encode', // CJS
        'match-operator',
        'meilisearch',
        'meilisearch-filters',
        'semver/preload', // CJS
        'ulid',
        'vue-tippy',
        'vue3-leaflet',
        'vue3-sortablejs',
        'xxh32',
        'yaml',
      ],
    },
  },
})
