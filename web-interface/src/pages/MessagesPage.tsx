import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import './MessagesPage.css'

interface MessagesConfig {
    welcome: string
    goodbye: string
    invalidOption: string
    outsideHours: string
    transferToHuman: string
    noHumanAvailable: string
    appointmentConfirmation: string
    enrollmentComplete: string
}

const MESSAGE_LABELS: Record<keyof MessagesConfig, string> = {
    welcome: 'Boas-vindas',
    goodbye: 'Despedida',
    invalidOption: 'Opção Inválida',
    outsideHours: 'Fora do Horário',
    transferToHuman: 'Transferência Humana',
    noHumanAvailable: 'Atendente Indisponível',
    appointmentConfirmation: 'Confirmação de Agendamento',
    enrollmentComplete: 'Matrícula Concluída'
}

export default function MessagesPage() {
    const [messages, setMessages] = useState<MessagesConfig>({
        welcome: '',
        goodbye: '',
        invalidOption: '',
        outsideHours: '',
        transferToHuman: '',
        noHumanAvailable: '',
        appointmentConfirmation: '',
        enrollmentComplete: ''
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await api.get<any>('/api/config')
            if (response.success && response.data) {
                setMessages(response.data.messages || {})
            }
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await api.put('/api/config', { messages })
            if (response.success) {
                alert('Mensagens salvas com sucesso!')
            }
        } catch (error) {
            alert('Erro ao salvar mensagens')
        } finally {
            setIsSaving(false)
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

    return (
        <MainLayout>
            <div className="messages-page">
                <header className="page-header">
                    <div>
                        <h1>Mensagens Automáticas</h1>
                        <p className="subtitle">Personalize os textos que o bot envia em cada situação</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </header>

                <div className="messages-grid">
                    {Object.entries(MESSAGE_LABELS).map(([key, label]) => (
                        <div key={key} className="message-card">
                            <label>{label}</label>
                            <textarea
                                value={messages[key as keyof MessagesConfig] || ''}
                                onChange={e => setMessages({ ...messages, [key]: e.target.value })}
                                rows={4}
                            />
                            <div className="variable-hints">
                                {key === 'welcome' && <span>Variáveis: {'{empresa}'}</span>}
                                {key === 'outsideHours' && <span>Variáveis: {'{horario}'}</span>}
                                {key === 'appointmentConfirmation' && <span>Variáveis: {'{data}, {horario}, {protocolo}'}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    )
}
