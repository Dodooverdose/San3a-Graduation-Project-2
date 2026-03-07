import { boot } from 'quasar/wrappers'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default boot(({ app }) => {
  // Make it available globally via this.$supabase in Options API
  app.config.globalProperties.$supabase = supabase
})

// Export for use in Composition API (recommended)
export { supabase }
