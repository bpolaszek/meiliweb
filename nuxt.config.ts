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
  css: ['@vueform/slider/themes/default.css', '~/assets/css/main.css'],
  ui: {
    // The app is light-only and loads its font via @nuxtjs/google-fonts
    colorMode: false,
    fonts: false,
  },
  icon: {
    // Keep icon base styles in a cascade layer so Tailwind utilities
    // (e.g. size-14) can override them (Tailwind v4 uses real @layer rules).
    cssLayer: 'base',
  },
  modules: [
    '@pinia/nuxt',
    '@nuxt/ui',
    '@nuxtjs/i18n',
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
