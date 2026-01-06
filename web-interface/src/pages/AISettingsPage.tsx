import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import './AISettingsPage.css'

interface AIConfig {
    enabled: boolean
    provider: 'groq' | 'openai' | 'anthropic' | 'ollama' | 'gemini'
    model: string
    apiKey: string
    baseUrl?: string
    temperature: number
    maxTokens: number
    systemPrompt: string
}

const PROVIDERS = [
    { id: 'groq', name: 'Groq (Recomendado)', models: ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'] },
    { id: 'openai', name: 'OpenAI', models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'] },
    { id: 'ollama', name: 'Ollama (Local)', models: ['llama2', 'mistral', 'codellama'] },
    { id: 'gemini', name: 'Google Gemini', models: ['gemini-pro', 'gemini-1.5-flash'] }
]

export default function AISettingsPage() {
    const [config, setConfig] = useState<AIConfig>({
        enabled: false,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        apiKey: '',
        baseUrl: '',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: ''
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await api.get<any>('/api/config')
            if (response.success && response.data) {
                setConfig(prev => ({ ...prev, ...response.data.ai }))
            }
        } catch (error) {
            console.error('Erro ao carregar config:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)
        try {
            const response = await api.put('/api/config', { ai: config })
            if (response.success) {
                setMessage({ type: 'success', text: 'Configuração da IA salva com sucesso!' })
            } else {
                setMessage({ type: 'error', text: response.error || 'Erro ao salvar configuração' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTest = async () => {
        const promptMessage = prompt('Digite uma mensagem para testar a IA:')
        if (!promptMessage) return

        try {
            setMessage({ type: 'success', text: 'Testando IA... Aguarde a resposta.' })
            const response = await api.post<any>('/api/test-ai', { message: promptMessage })
            if (response.success && response.data) {
                alert(`Resposta da IA:\n\n${response.data.response}\n\nAção detectada: ${response.data.action || 'Nenhuma'}`)
            } else {
                alert('Erro no teste: ' + (response.error || 'Erro desconhecido'))
            }
        } catch (error) {
            alert('Erro ao testar IA')
        }
    }

    if (isLoading) {
        return (
            <MainLayout>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                </div>
            </MainLayout>
        )
    }

    const currentProvider = PROVIDERS.find(p => p.id === config.provider)

    return (
        <MainLayout>
            <div className="ai-settings-page">
                <header className="page-header">
                    <div>
                        <h1>Assistente de IA</h1>
                        <p className="subtitle">Configure o comportamento e o cérebro das automações</p>
                    </div>
                    <div className="header-actions">
                        <button className="test-button" onClick={handleTest} disabled={!config.enabled}>
                            🧪 Testar IA
                        </button>
                        <button className="save-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                    </div>
                </header>

                {message && (
                    <div className={`status-message ${message.type}`}>
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </div>
                )}

                <div className="settings-grid">
                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-title">
                                <span className="icon">⚙️</span>
                                <h2>Configurações Gerais</h2>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={config.enabled}
                                    onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        <div className="form-group">
                            <label>Provedor</label>
                            <select
                                value={config.provider}
                                onChange={e => {
                                    const newProvider = e.target.value as any
                                    const providerData = PROVIDERS.find(p => p.id === newProvider)
                                    setConfig({
                                        ...config,
                                        provider: newProvider,
                                        model: providerData ? providerData.models[0] : config.model
                                    })
                                }}
                            >
                                {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Modelo</label>
                            <select
                                value={config.model}
                                onChange={e => setConfig({ ...config, model: e.target.value })}
                            >
                                {currentProvider?.models.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Chave de API (API Key)</label>
                            <input
                                type="password"
                                value={config.apiKey}
                                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                                placeholder="Insira sua chave aqui"
                            />
                            <span className="form-hint">Dica: Suas chaves são armazenadas com segurança no servidor.</span>
                        </div>

                        {config.provider === 'ollama' && (
                            <div className="form-group">
                                <label>URL Base (Ollama)</label>
                                <input
                                    type="text"
                                    value={config.baseUrl}
                                    onChange={e => setConfig({ ...config, baseUrl: e.target.value })}
                                    placeholder="http://localhost:11434"
                                />
                            </div>
                        )}
                    </section>

                    <section className="settings-section">
                        <div className="section-header">
                            <div className="section-title">
                                <span className="icon">🧠</span>
                                <h2>Personalidade e Parâmetros</h2>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Prompt do Sistema (System Prompt)</label>
                            <textarea
                                value={config.systemPrompt}
                                onChange={e => setConfig({ ...config, systemPrompt: e.target.value })}
                                placeholder="Ex: Você é um atendente prestativo da empresa Nyvlo Omnichannel..."
                                rows={6}
                            />
                            <span className="form-hint">Isso define como a IA deve se comportar e o que ela sabe.</span>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Temperatura ({config.temperature})</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1.5"
                                    step="0.1"
                                    value={config.temperature}
                                    onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                />
                                <div className="range-labels">
                                    <span>Preciso</span>
                                    <span>Criativo</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Máximo de Tokens</label>
                                <input
                                    type="number"
                                    value={config.maxTokens}
                                    onChange={e => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </MainLayout>
    )
}
