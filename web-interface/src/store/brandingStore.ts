import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../services/api'

interface BrandingConfig {
    name: string
    logo_url: string
    primary_color: string
    secondary_color: string
}

interface BrandingState {
    config: BrandingConfig
    isLoading: boolean
    fetchBranding: () => Promise<void>
    setBranding: (config: Partial<BrandingConfig>) => void
}

const defaultBranding: BrandingConfig = {
    name: 'Nyvlo Omnichannel',
    logo_url: '',
    primary_color: '#1D3D6B',
    secondary_color: '#59C348',
}

export const useBrandingStore = create<BrandingState>()(
    persist(
        (set) => ({
            config: defaultBranding,
            isLoading: false,

            fetchBranding: async () => {
                set({ isLoading: true })
                try {
                    // Note: using direct api service which has interceptors for auth
                    const response = await api.get<any>('/api/tenants/me/config')
                    if (response.success && response.data?.tenant) {
                        const { name, logo_url, primary_color, secondary_color } = response.data.tenant
                        const newConfig = {
                            name: name || defaultBranding.name,
                            logo_url: logo_url || defaultBranding.logo_url,
                            primary_color: primary_color || defaultBranding.primary_color,
                            secondary_color: secondary_color || defaultBranding.secondary_color,
                        }
                        set({ config: newConfig })
                        applyBranding(newConfig)
                    }
                } catch (error) {
                    console.error('Erro ao buscar branding:', error)
                } finally {
                    set({ isLoading: false })
                }
            },

            setBranding: (newConfig) => {
                set((state) => {
                    const updated = { ...state.config, ...newConfig }
                    applyBranding(updated)
                    return { config: updated }
                })
            },
        }),
        {
            name: 'nyvlo-branding',
            onRehydrateStorage: () => (state) => {
                if (state?.config) {
                    applyBranding(state.config)
                }
            },
        }
    )
)

function applyBranding(config: BrandingConfig) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.style.setProperty('--primary-color', config.primary_color)
    root.style.setProperty('--secondary-color', config.secondary_color)

    // Set derived colors (like primary with opacity)
    root.style.setProperty('--primary-color-rgb', hexToRgb(config.primary_color))

    // Update document title if needed
    if (config.name) {
        document.title = config.name
    }
}

function hexToRgb(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '29, 61, 107' // Default Nyvlo Navy
    return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
