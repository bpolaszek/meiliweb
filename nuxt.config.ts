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
  compatibilityDate: '2024-08-15',
  vite: {
    build: {
      rollupOptions: {
        external: ['crypto'],
      },
    },
  },
})
