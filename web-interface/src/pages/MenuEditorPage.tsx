import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { api } from '../services/api'
import './MenuEditorPage.css'

interface MenuItem {
    id: string
    title: string
    action: 'courses' | 'appointment' | 'enrollment' | 'faq' | 'contact' | 'human' | 'custom' | 'submenu'
    customResponse?: string
    subItems?: MenuItem[]
}

interface MenuCardProps {
    item: MenuItem
    index: number
    depth?: number
    onUpdate: (id: string, field: keyof MenuItem, value: any) => void
    onRemove: (id: string) => void
    onAddSubItem: (parentId: string) => void
}

const MenuCard = ({ item, index, depth = 0, onUpdate, onRemove, onAddSubItem }: MenuCardProps) => (
    <div key={item.id} className="menu-card-wrapper">
        <div className={`menu-card ${depth > 0 ? 'nested-card' : ''}`}>
            <div className="card-number">{index + 1}</div>
            <div className="card-content">
                <div className="form-row">
                    <div className="form-group">
                        <label>Título do Item</label>
                        <input
                            type="text"
                            value={item.title}
                            onChange={e => onUpdate(item.id, 'title', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Ação ao Escolher</label>
                        <select
                            value={item.action}
                            onChange={e => onUpdate(item.id, 'action', e.target.value as any)}
                        >
                            <option value="human">👤 Falar com Atendente</option>
                            <option value="submenu">📂 Abrir Sub-menu</option>
                            <option value="courses">📚 Listar Cursos</option>
                            <option value="appointment">📅 Agendamento</option>
                            <option value="enrollment">📝 Matrícula</option>
                            <option value="faq">❓ FAQ</option>
                            <option value="documents">📄 Enviar Documentos</option>
                            <option value="contact">📍 Contato / Endereço</option>
                            <option value="custom">💬 Resposta Customizada</option>
                        </select>
                    </div>
                </div>

                {item.action === 'custom' && (
                    <div className="form-group">
                        <label>Resposta Customizada</label>
                        <textarea
                            value={item.customResponse}
                            onChange={e => onUpdate(item.id, 'customResponse', e.target.value)}
                            placeholder="Digite o texto que o bot enviará..."
                        />
                    </div>
                )}

                {item.action === 'submenu' && (
                    <div className="submenu-section">
                        <div className="submenu-header">
                            <h4>Sub-opções de "{item.title}"</h4>
                            <button
                                type="button"
                                className="add-sub-button"
                                onClick={() => onAddSubItem(item.id)}
                            >
                                + Sub-opção
                            </button>
                        </div>
                        <div className="submenu-items">
                            {(item.subItems || []).map((sub, idx) => (
                                <MenuCard
                                    key={sub.id}
                                    item={sub}
                                    index={idx}
                                    depth={depth + 1}
                                    onUpdate={onUpdate}
                                    onRemove={onRemove}
                                    onAddSubItem={onAddSubItem}
                                />
                            ))}
                            {(item.subItems || []).length === 0 && (
                                <p className="empty-submenu">Nenhuma sub-opção criada.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <button
                type="button"
                className="delete-button"
                onClick={() => onRemove(item.id)}
                title="Remover item"
            >
                🗑️
            </button>
        </div>
    </div>
)

export default function MenuEditorPage() {
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [welcomeMessage, setWelcomeMessage] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const response = await api.get<any>('/api/config')
            if (response.success && response.data) {
                setMenus(response.data.menus || [])
                setWelcomeMessage(response.data.messages?.welcome || '')
                setCompanyName(response.data.company?.name || 'Empresa')
            }
        } catch (error) {
            console.error('Erro ao buscar menus:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const response = await api.put('/api/config', { menus })
            if (response.success) {
                alert('Menus salvos com sucesso!')
            }
        } catch (error) {
            alert('Erro ao salvar menus')
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddSubItem = (parentId: string) => {
        const findAndAddSubItem = (items: MenuItem[]): MenuItem[] => {
            return items.map(item => {
                if (item.id === parentId) {
                    const newSubItem: MenuItem = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                        title: 'Sub-opção',
                        action: 'custom',
                        customResponse: 'Resposta da sub-opção'
                    }
                    return {
                        ...item,
                        subItems: [...(item.subItems || []), newSubItem]
                    }
                }
                if (item.subItems) {
                    return { ...item, subItems: findAndAddSubItem(item.subItems) }
                }
                return item
            })
        }
        setMenus(prev => findAndAddSubItem(prev))
    }

    const addMenuItem = () => {
        const newItem: MenuItem = {
            id: Date.now().toString(),
            title: 'Novo Item',
            action: 'human'
        }
        setMenus([...menus, newItem])
    }

    const removeMenuItem = (id: string) => {
        setMenus(prev => {
            const removeRecursive = (items: MenuItem[]): MenuItem[] => {
                return items.filter(m => m.id !== id).map(m => ({
                    ...m,
                    subItems: m.subItems ? removeRecursive(m.subItems) : undefined
                }))
            }
            return removeRecursive(prev)
        })
    }

    const updateMenuItem = (id: string, field: keyof MenuItem, value: any) => {
        setMenus(prev => {
            const updateRecursive = (items: MenuItem[]): MenuItem[] => {
                return items.map(m => {
                    if (m.id === id) {
                        return { ...m, [field]: value }
                    }
                    if (m.subItems) {
                        return { ...m, subItems: updateRecursive(m.subItems) }
                    }
                    return m
                })
            }
            return updateRecursive(prev)
        })
    }

    const getPreviewText = () => {
        const welcome = welcomeMessage.replace('{empresa}', companyName) || 'Olá! Bem-vindo!'
        let text = `${welcome}\n\n`

        if (menus.length === 0) {
            text += "1. Cursos\n2. Agendamento\n3. Matrícula\n4. Dúvidas\n5. Atendente"
        } else {
            menus.forEach((m, i) => {
                text += `${i + 1}. ${m.title}${m.action === 'submenu' ? ' ❯' : ''}\n`
            })
        }
        text += '\nDigite o número da opção.'
        return text
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
            <div className="menu-editor-page">
                <header className="page-header">
                    <div>
                        <h1>Editor de Menus</h1>
                        <p className="subtitle">Configure o fluxo de atendimento do seu bot</p>
                    </div>
                    <div className="header-actions">
                        <button className="primary-button" onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Salvando...' : 'Salvar Menu'}
                        </button>
                    </div>
                </header>

                <div className="editor-grid">
                    <div className="menu-items-list">
                        <div className="list-header">
                            <h2>Estrutura do Menu</h2>
                            <button className="add-button" onClick={addMenuItem}>+ Novo Item Principal</button>
                        </div>

                        <div className="items-container">
                            {menus.map((item, index) => (
                                <MenuCard
                                    key={item.id}
                                    item={item}
                                    index={index}
                                    onUpdate={updateMenuItem}
                                    onRemove={removeMenuItem}
                                    onAddSubItem={handleAddSubItem}
                                />
                            ))}
                            {menus.length === 0 && (
                                <div className="empty-state">
                                    <p>Seu bot está usando o menu padrão do sistema.</p>
                                    <button className="add-button" onClick={addMenuItem}>Começar a Customizar</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="preview-section">
                        <h2>Prévia no WhatsApp</h2>
                        <div className="phone-preview">
                            <div className="phone-header">
                                <div className="phone-status-bar">
                                    <span>{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
                                    <div className="phone-icons">📶 🔋</div>
                                </div>
                                <div className="chat-header">
                                    <div className="back-arrow">←</div>
                                    <div className="avatar">{companyName.substring(0, 2).toUpperCase()}</div>
                                    <div className="contact-info">
                                        <span className="contact-name">{companyName}</span>
                                        <span className="contact-status">online</span>
                                    </div>
                                    <div className="chat-icons">⋮</div>
                                </div>
                            </div>
                            <div className="chat-body">
                                <div className="message-bubble received">
                                    <pre>{getPreviewText()}</pre>
                                    <span className="message-time">12:30</span>
                                </div>
                            </div>
                            <div className="chat-footer">
                                <div className="input-placeholder">Mensagem</div>
                                <div className="mic-icon">🎤</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
