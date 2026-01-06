import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import { useLabels } from '../hooks/useLabels'
import './DataPage.css'

interface Lead {
    id: string
    protocol: string
    full_name: string
    identifier: string // Antigo CPF, agora genérico
    reference_id: string // Antigo course_id
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
}

export default function LeadsPage() {
    const [data, setData] = useState<Lead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const labels = useLabels()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Mantemos o endpoint /api/enrollments por enquanto
            const response = await api.get<Lead[]>('/api/enrollments')
            if (response.success) {
                setData(response.data || [])
            }
        } catch (error) {
            console.error('Erro ao buscar leads:', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <MainLayout>
            <div className="data-page">
                <header className="page-header">
                    <div>
                        <h1>{labels.sidebar_leads}</h1>
                        <p className="subtitle">Interessados e pré-cadastros capturados pelo assistente</p>
                    </div>
                    <button className="secondary-button" onClick={fetchData}>🔄 Atualizar Lista</button>
                </header>

                <div className="table-container">
                    {isLoading ? (
                        <div className="loading-spinner-container"><div className="loading-spinner"></div></div>
                    ) : data.length === 0 ? (
                        <div className="empty-state-container">Nenhuma solicitação encontrada no momento.</div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Protocolo</th>
                                    <th>{labels.lead_singular} / Contato</th>
                                    <th>Identificador</th>
                                    <th>Referência / Interessado em</th>
                                    <th>Status</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map(item => (
                                    <tr key={item.id}>
                                        <td className="code">{item.protocol}</td>
                                        <td>{item.full_name}</td>
                                        <td>{(item as any).cpf || item.identifier}</td>
                                        <td>{(item as any).course_id || item.reference_id}</td>
                                        <td>
                                            <span className={`status-badge ${item.status}`}>
                                                {item.status === 'pending' ? 'Pendente' :
                                                    item.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                                            </span>
                                        </td>
                                        <td>{new Date(item.created_at).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </MainLayout>
    )
}
