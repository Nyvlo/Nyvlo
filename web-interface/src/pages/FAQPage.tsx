import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import './DataPage.css'

interface FAQQuestion {
    id: string
    categoryId: string
    question: string
    answer: string
    keywords: string[]
}

export default function FAQPage() {
    const [questions, setQuestions] = useState<FAQQuestion[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await api.get<any>('/api/faq')
            if (response.success && response.data) {
                setQuestions(response.data.questions || [])
            }
        } catch (error) {
            console.error('Erro ao buscar FAQ:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await api.put('/api/config', { faq: { questions } })
            if (response.success) alert('FAQ salvo!')
        } catch (error) {
            alert('Erro ao salvar')
        } finally {
            setIsSaving(false)
        }
    }

    const addQuestion = () => {
        setQuestions([...questions, {
            id: 'q-' + Date.now(),
            categoryId: 'geral',
            question: 'Nova pergunta?',
            answer: 'Resposta aqui...',
            keywords: []
        }])
    }

    return (
        <MainLayout>
            <div className="data-page">
                <header className="page-header">
                    <div>
                        <h1>FAQ (Perguntas Frequentes)</h1>
                        <p className="subtitle">Base de conhecimento para o assistente de IA e bot</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={addQuestion}>+ Nova Pergunta</button>
                        <button className="primary-button" onClick={handleSave} disabled={isSaving}>Salvar FAQ</button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <p className="text-slate-500 font-medium">Carregando perguntas...</p>
                    </div>
                ) : (
                    <div className="faq-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {questions.map(q => (
                            <div key={q.id} className="menu-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div className="form-group">
                                    <label>Pergunta</label>
                                    <input type="text" value={q.question} onChange={e => setQuestions(questions.map(x => x.id === q.id ? { ...x, question: e.target.value } : x))} />
                                </div>
                                <div className="form-group">
                                    <label>Resposta</label>
                                    <textarea
                                        value={q.answer}
                                        onChange={e => setQuestions(questions.map(x => x.id === q.id ? { ...x, answer: e.target.value } : x))}
                                        rows={3}
                                    />
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => setQuestions(questions.filter(x => x.id !== q.id))}
                                >
                                    🗑️ Remover
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
