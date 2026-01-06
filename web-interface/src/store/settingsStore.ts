import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  soundVolume: number
  showPreview: boolean
  desktopNotifications: boolean
}

export interface PrivacySettings {
  showOnlineStatus: boolean
  showReadReceipts: boolean
  showTypingIndicator: boolean
}

export interface Settings {
  theme: Theme
  language: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  fontSize: 'small' | 'medium' | 'large'
  enterToSend: boolean
  mediaAutoDownload: boolean
}

interface SettingsState extends Settings {
  setTheme: (theme: Theme) => void
  setLanguage: (language: string) => void
  setNotifications: (settings: Partial<NotificationSettings>) => void
  setPrivacy: (settings: Partial<PrivacySettings>) => void
  setFontSize: (size: 'small' | 'medium' | 'large') => void
  setEnterToSend: (enabled: boolean) => void
  setMediaAutoDownload: (enabled: boolean) => void
  resetSettings: () => void
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'pt-BR',
  notifications: {
    enabled: true,
    sound: true,
    soundVolume: 0.5,
    showPreview: true,
    desktopNotifications: true,
  },
  privacy: {
    showOnlineStatus: true,
    showReadReceipts: true,
    showTypingIndicator: true,
  },
  fontSize: 'medium',
  enterToSend: true,
  mediaAutoDownload: true,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      setLanguage: (language) => set({ language }),

      setNotifications: (settings) =>
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
        })),

      setPrivacy: (settings) =>
        set((state) => ({
          privacy: { ...state.privacy, ...settings },
        })),

      setFontSize: (fontSize) => {
        set({ fontSize })
        applyFontSize(fontSize)
      },

      setEnterToSend: (enterToSend) => set({ enterToSend }),

      setMediaAutoDownload: (mediaAutoDownload) => set({ mediaAutoDownload }),

      resetSettings: () => {
        set(defaultSettings)
        applyTheme(defaultSettings.theme)
        applyFontSize(defaultSettings.fontSize)
      },
    }),
    {
      name: 'nyvlo-settings',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme)
          applyFontSize(state.fontSize)
        }
      },
    }
  )
)

function applyTheme(theme: Theme) {
  const root = document.documentElement

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    root.setAttribute('data-theme', theme)
  }
}

function applyFontSize(size: 'small' | 'medium' | 'large') {
  const root = document.documentElement
  const sizes = {
    small: '13px',
    medium: '14px',
    large: '16px',
  }
  root.style.setProperty('--base-font-size', sizes[size])
}

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    const { theme } = useSettingsStore.getState()
    if (theme === 'system') {
      applyTheme('system')
    }
  })
}
