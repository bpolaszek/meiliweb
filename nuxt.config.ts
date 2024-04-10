import TailwindConfig from './tailwind.config'

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    'nuxt-icon',
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
})
