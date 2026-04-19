import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

export let i18n

export default defineBoot(({ app }) => {
  const savedLocale = localStorage.getItem('san3a-locale') || 'en-US'

  i18n = createI18n({
    locale: savedLocale,
    fallbackLocale: 'en-US',
    globalInjection: true,
    messages,
  })

  // Set RTL direction for Arabic
  document.documentElement.dir = savedLocale === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = savedLocale === 'en-US' ? 'en' : savedLocale

  // Set i18n instance on app
  app.use(i18n)
})
