export const STORAGE_KEY = 'bani-entregas-state'
const CLOUD_TABLE = 'app_state'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isCloudStorageEnabled = () => Boolean(supabaseUrl && supabaseAnonKey)

const cloudHeaders = {
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  'Content-Type': 'application/json',
}

const cloudEndpoint = (query = '') => `${supabaseUrl}/rest/v1/${CLOUD_TABLE}${query}`

export const loadLocalState = (fallback) => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? fallback
  } catch {
    return fallback
  }
}

export const saveLocalState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export const loadSharedState = async (fallback) => {
  if (!isCloudStorageEnabled()) return fallback
  const response = await fetch(cloudEndpoint(`?key=eq.${encodeURIComponent(STORAGE_KEY)}&select=data&limit=1`), {
    headers: cloudHeaders,
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Supabase load failed: ${response.status}`)
  const rows = await response.json()
  return rows[0]?.data ?? fallback
}

export const saveSharedState = async (state) => {
  if (!isCloudStorageEnabled()) return
  const response = await fetch(cloudEndpoint('?on_conflict=key'), {
    method: 'POST',
    headers: {
      ...cloudHeaders,
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      key: STORAGE_KEY,
      data: state,
      updated_at: new Date().toISOString(),
    }),
  })
  if (!response.ok) throw new Error(`Supabase save failed: ${response.status}`)
}
