import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import { useLabels } from '../hooks/useLabels'
import './DataPage.css'

interface CatalogItem {
    id: string
    name: string
    price: number
    duration: string
    category: string
    description: string
    active: boolean
}

export default function CatalogPage() {
    const [items, setItems] = useState<CatalogItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const labels = useLabels()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            // Mantemos o endpoint /api/courses por enquanto para não quebrar o backend
            const response = await api.get<CatalogItem[]>('/api/courses')
            if (response.success) {
                setItems(response.data || [])
            }
        } catch (error) {
            console.error('Erro ao buscar catálogo:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await api.put('/api/config', { courses: items })
            if (response.success) alert('Catálogo salvo com sucesso!')
        } catch (error) {
            alert('Erro ao salvar catálogo')
        } finally {
            setIsSaving(false)
        }
    }

    const addItem = () => {
        const newItem: CatalogItem = {
            id: 'item-' + Date.now(),
            name: 'Novo Item/Serviço',
            price: 0,
            duration: '-',
            category: 'Geral',
            description: '',
            active: true
        }
        setItems([...items, newItem])
    }

    const updateItem = (id: string, field: keyof CatalogItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item))
    }

    return (
        <MainLayout>
            <div className="data-page">
                <header className="page-header">
                    <div>
                        <h1>{labels.catalog_title}</h1>
                        <p className="subtitle">{labels.catalog_subtitle}</p>
                    </div>
                    <div className="header-actions">
                        <button className="secondary-button" onClick={addItem}>+ Novo {labels.item_singular}</button>
                        <button className="primary-button" onClick={handleSave} disabled={isSaving}>Salvar Alterações</button>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex items-center justify-center p-12">
                        <p className="text-slate-500 font-medium">Carregando catálogo...</p>
                    </div>
                ) : (
                    <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '24px' }}>
                        {items.map(item => (
                            <div key={item.id} className="menu-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div className="form-group">
                                    <label>Nome do {labels.item_singular}</label>
                                    <input type="text" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div className="form-group">
                                        <label>Preço / Valor (R$)</label>
                                        <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value))} />
                                    </div>
                                    <div className="form-group">
                                        <label>Prazo / Duração</label>
                                        <input type="text" value={item.duration} onChange={e => updateItem(item.id, 'duration', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Breve Descrição</label>
                                    <textarea value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} rows={3} />
                                </div>
                                <button className="delete-button" onClick={() => setItems(items.filter(i => i.id !== item.id))}>🗑️ Remover do Catálogo</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    )
}
