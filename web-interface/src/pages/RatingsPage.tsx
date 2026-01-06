import { useState, useEffect } from 'react'
import { api } from '../services/api'
import './RatingsPage.css'

interface RatingStats {
    total: number
    average: number
    nps: number
    promoters: number
    passives: number
    detractors: number
    distribution: {
        1: number
        2: number
        3: number
        4: number
        5: number
    }
    topAgents: Array<{
        agentId: string
        agentName: string
        totalRatings: number
        averageRating: number
    }>
}

export default function RatingsPage() {
    const [stats, setStats] = useState<RatingStats | null>(null)
    const [period, setPeriod] = useState('30')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadStats()
    }, [period])

    const loadStats = async () => {
        try {
            setIsLoading(true)
            // Assuming we have a default instance - in production, get from context
            const instanceId = 'default'

            const response = await api.get<{ stats: RatingStats }>(
                `/api/ratings/instance/${instanceId}/stats?period=${period}`
            )

            if (response.success && response.data) {
                setStats(response.data.stats)
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const exportToPDF = () => {
        // TODO: Implement PDF export
        alert('Exportação para PDF em desenvolvimento')
    }

    const exportToExcel = () => {
        if (!stats) return

        // Create CSV content
        const csvContent = [
            ['Métrica', 'Valor'],
            ['Total de Avaliações', stats.total],
            ['Média Geral', stats.average.toFixed(2)],
            ['NPS', stats.nps],
            ['Promotores (4-5★)', stats.promoters],
            ['Neutros (3★)', stats.passives],
            ['Detratores (1-2★)', stats.detractors],
            [''],
            ['Distribuição por Estrelas'],
            ['5 Estrelas', stats.distribution[5]],
            ['4 Estrelas', stats.distribution[4]],
            ['3 Estrelas', stats.distribution[3]],
            ['2 Estrelas', stats.distribution[2]],
            ['1 Estrela', stats.distribution[1]],
            [''],
            ['Top Agentes'],
            ['Nome', 'Avaliações', 'Média'],
            ...stats.topAgents.map(a => [a.agentName, a.totalRatings, a.averageRating.toFixed(2)])
        ].map(row => row.join(',')).join('\n')

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `avaliacoes_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    const getNPSColor = (nps: number) => {
        if (nps >= 75) return '#10b981' // Excelente
        if (nps >= 50) return '#3b82f6' // Bom
        if (nps >= 0) return '#f59e0b'  // Regular
        return '#ef4444' // Ruim
    }

    const getAverageColor = (avg: number) => {
        if (avg >= 4.5) return '#10b981'
        if (avg >= 4.0) return '#3b82f6'
        if (avg >= 3.0) return '#f59e0b'
        return '#ef4444'
    }

    if (isLoading) {
        return (
            <div className="ratings-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Carregando estatísticas...</p>
                </div>
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="ratings-page">
                <div className="empty-state">
                    <span className="empty-icon">📊</span>
                    <h2>Nenhuma avaliação ainda</h2>
                    <p>As avaliações dos clientes aparecerão aqui</p>
                </div>
            </div>
        )
    }

    return (
        <div className="ratings-page">
            <div className="ratings-header">
                <div className="header-content">
                    <h1>📊 Avaliações de Atendimento</h1>
                    <p>Acompanhe a satisfação dos seus clientes em tempo real</p>
                </div>

                <div className="header-actions">
                    <select
                        className="period-selector"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                    </select>

                    <button className="export-btn" onClick={exportToExcel}>
                        📥 Exportar Excel
                    </button>

                    <button className="export-btn" onClick={exportToPDF}>
                        📄 Exportar PDF
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-icon">⭐</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Média Geral</span>
                        <span className="kpi-value" style={{ color: getAverageColor(stats.average) }}>
                            {stats.average.toFixed(1)}
                        </span>
                        <span className="kpi-subtitle">de 5.0 estrelas</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">🎯</div>
                    <div className="kpi-content">
                        <span className="kpi-label">NPS Score</span>
                        <span className="kpi-value" style={{ color: getNPSColor(stats.nps) }}>
                            {stats.nps}
                        </span>
                        <span className="kpi-subtitle">
                            {stats.nps >= 75 ? 'Excelente' : stats.nps >= 50 ? 'Bom' : stats.nps >= 0 ? 'Regular' : 'Ruim'}
                        </span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">📈</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Total de Avaliações</span>
                        <span className="kpi-value">{stats.total}</span>
                        <span className="kpi-subtitle">nos últimos {period} dias</span>
                    </div>
                </div>

                <div className="kpi-card">
                    <div className="kpi-icon">😊</div>
                    <div className="kpi-content">
                        <span className="kpi-label">Promotores</span>
                        <span className="kpi-value" style={{ color: '#10b981' }}>
                            {stats.total > 0 ? Math.round((stats.promoters / stats.total) * 100) : 0}%
                        </span>
                        <span className="kpi-subtitle">{stats.promoters} clientes satisfeitos</span>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Distribution Chart */}
                <div className="chart-card">
                    <h3>Distribuição de Avaliações</h3>
                    <div className="distribution-chart">
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = stats.distribution[star as keyof typeof stats.distribution] || 0
                            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0

                            return (
                                <div key={star} className="distribution-row">
                                    <span className="star-label">
                                        {star} <span className="star-icon">★</span>
                                    </span>
                                    <div className="bar-container">
                                        <div
                                            className="bar"
                                            style={{
                                                width: `${percentage}%`,
                                                background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="count-label">{count}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* NPS Breakdown */}
                <div className="chart-card">
                    <h3>Análise NPS</h3>
                    <div className="nps-breakdown">
                        <div className="nps-segment promoters">
                            <div className="nps-icon">😍</div>
                            <div className="nps-info">
                                <span className="nps-count">{stats.promoters}</span>
                                <span className="nps-label">Promotores</span>
                                <span className="nps-desc">4-5 estrelas</span>
                            </div>
                        </div>

                        <div className="nps-segment passives">
                            <div className="nps-icon">😐</div>
                            <div className="nps-info">
                                <span className="nps-count">{stats.passives}</span>
                                <span className="nps-label">Neutros</span>
                                <span className="nps-desc">3 estrelas</span>
                            </div>
                        </div>

                        <div className="nps-segment detractors">
                            <div className="nps-icon">😞</div>
                            <div className="nps-info">
                                <span className="nps-count">{stats.detractors}</span>
                                <span className="nps-label">Detratores</span>
                                <span className="nps-desc">1-2 estrelas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Agents */}
            <div className="chart-card full-width">
                <h3>🏆 Top Agentes</h3>
                <div className="agents-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Posição</th>
                                <th>Agente</th>
                                <th>Avaliações</th>
                                <th>Média</th>
                                <th>Performance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topAgents.map((agent, index) => (
                                <tr key={agent.agentId}>
                                    <td>
                                        <span className={`position-badge ${index < 3 ? 'top-three' : ''}`}>
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </span>
                                    </td>
                                    <td className="agent-name">{agent.agentName}</td>
                                    <td>{agent.totalRatings}</td>
                                    <td>
                                        <span className="rating-badge" style={{ background: getAverageColor(agent.averageRating) }}>
                                            {agent.averageRating.toFixed(1)} ⭐
                                        </span>
                                    </td>
                                    <td>
                                        <div className="performance-bar">
                                            <div
                                                className="performance-fill"
                                                style={{
                                                    width: `${(agent.averageRating / 5) * 100}%`,
                                                    background: getAverageColor(agent.averageRating)
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {stats.topAgents.length === 0 && (
                        <div className="empty-table">
                            <p>Nenhum agente com avaliações no período selecionado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
