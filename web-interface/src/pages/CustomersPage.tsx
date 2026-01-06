import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search,
    Mail,
    Phone,
    Star,
    Edit2,
    RefreshCw,
    Plus,
    Upload,
    CheckCircle,
    AlertCircle,
    Users,
    TrendingUp,
    MessageCircle,
    Clock,
    ChevronRight,
    Calendar,
    ArrowLeft,
    X
} from 'lucide-react'
import { customersApi } from '../services/api'
import MainLayout from '../components/layout/MainLayout'
import './CustomersPage.css'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

interface Customer {
    id: string
    name: string
    phone_number: string
    whatsapp_id: string
    email?: string
    document?: string
    customer_type: 'personal' | 'company'
    last_interaction: string
    total_messages: number
    ai_messages_count: number
    agent_messages_count: number
    avg_rating: number
    ratings_count: number
    status: string
    notes?: string
    created_at: string
}

export default function CustomersPage() {
    const navigate = useNavigate()
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    // Modals
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

    const [editData, setEditData] = useState<any>({})
    const [newData, setNewData] = useState<any>({ customer_type: 'personal' })

    const [importFile, setImportFile] = useState<File | null>(null)
    const [importing, setImporting] = useState(false)
    const [importSummary, setImportSummary] = useState<any>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        fetchCustomers()
    }, [search])

    const fetchCustomers = async () => {
        setLoading(true)
        try {
            const response = await customersApi.list(search)
            if (response.success && response.data) {
                setCustomers(response.data.customers)
            }
        } catch (error) {
            console.error('Erro ao carregar clientes', error)
        } finally {
            setLoading(false)
        }
    }

    const handleViewDetails = async (customer: Customer) => {
        setSelectedCustomer(customer)
        setIsDetailsOpen(true)
        setLoadingHistory(true)
        try {
            const response = await customersApi.get(customer.id)
            if (response.success && response.data) {
                setHistory(response.data.customer.history)
            }
        } catch (error) {
            console.error('Erro ao carregar histórico', error)
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleEditCustomer = (customer: Customer) => {
        setEditData(customer)
        setIsEditModalOpen(true)
    }

    const handleSaveEdit = async () => {
        try {
            const response = await customersApi.update(editData.id, editData)
            if (response.success) {
                setIsEditModalOpen(false)
                fetchCustomers()
                if (selectedCustomer?.id === editData.id) {
                    setSelectedCustomer({ ...selectedCustomer, ...editData })
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar cliente', error)
        }
    }

    const handleCreateCustomer = async () => {
        try {
            const response = await customersApi.create(newData)
            if (response.success) {
                setIsCreateModalOpen(false)
                setNewData({ customer_type: 'personal' })
                fetchCustomers()
            }
        } catch (error) {
            alert('Erro ao criar cliente: ' + (error as any).response?.data?.error || 'Erro interno')
        }
    }

    const handleImport = async () => {
        if (!importFile) return
        setImporting(true)
        try {
            const response = await customersApi.import(importFile)
            if (response.success) {
                setImportSummary(response.data.summary)
                fetchCustomers()
            }
        } catch (error) {
            console.error('Erro na importação', error)
        } finally {
            setImporting(false)
        }
    }

    const formatDocument = (doc: string, type: string) => {
        if (!doc) return ''
        const clean = doc.replace(/\D/g, '')
        if (type === 'company' || clean.length > 11) {
            return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
        }
        return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4')
    }

    const formatPhone = (phone: string) => {
        if (!phone) return ''
        const clean = phone.replace(/\D/g, '')
        return clean.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'Nunca'
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    }

    const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
        <div className="stat-card-premium">
            <div className={cn("icon-container", colorClass)}>
                <Icon size={24} />
            </div>
            <div className="stat-info">
                <p>{title}</p>
                <h3>{value}</h3>
            </div>
        </div>
    )

    return (
        <MainLayout>
            <div className="customers-page-modern">
                {/* Dashboard Metrics Header */}
                <div className="metrics-header-grid">
                    <StatCard
                        title="Total de Clientes"
                        value={customers.length}
                        icon={Users}
                        colorClass="bg-blue-500"
                    />
                    <StatCard
                        title="Novos (Mês)"
                        value={customers.filter(c => {
                            const date = new Date(c.created_at);
                            const now = new Date();
                            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                        }).length}
                        icon={TrendingUp}
                        colorClass="bg-emerald-500"
                    />
                    <StatCard
                        title="Atendidos Hoje"
                        value={customers.filter(c => {
                            if (!c.last_interaction) return false;
                            const date = new Date(c.last_interaction);
                            const today = new Date();
                            return date.toDateString() === today.toDateString();
                        }).length}
                        icon={MessageCircle}
                        colorClass="bg-indigo-500"
                    />
                    <StatCard
                        title="Aguardando"
                        value={customers.filter(c => c.status === 'waiting').length}
                        icon={Clock}
                        colorClass="bg-amber-500"
                    />
                </div>

                <div className="main-content-card">
                    {/* Toolbar */}
                    <header className="content-toolbar">
                        <div className="toolbar-left">
                            <h2>Gestão de Clientes</h2>
                            <div className="premium-search">
                                <Search size={20} />
                                <input
                                    type="text"
                                    placeholder="Nome, documento ou telefone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="toolbar-right">
                            <button className="import-btn-modern" onClick={() => setIsImportModalOpen(true)}>
                                <Upload size={18} /> Importar
                            </button>
                            <button className="create-btn-modern shadow-emerald-500/20 shadow-lg" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus size={20} /> Novo Cliente
                            </button>
                        </div>
                    </header>

                    {/* Table View */}
                    <div className="table-responsive">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Identificação</th>
                                    <th>Documento</th>
                                    <th>Informações de Contato</th>
                                    <th>Último Atendimento</th>
                                    <th className="text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={5} className="py-20 text-center text-slate-400">Carregando...</td></tr>
                                ) : customers.length === 0 ? (
                                    <tr><td colSpan={5} className="py-32 text-center text-slate-400">Nenhum cliente encontrado.</td></tr>
                                ) : (
                                    customers.map(customer => (
                                        <tr key={customer.id} onClick={() => handleViewDetails(customer)}>
                                            <td>
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("modern-avatar", customer.customer_type === 'company' ? 'company' : 'personal')}>
                                                        {customer.customer_type === 'company' ? <Users size={20} /> : getInitials(customer.name)}
                                                    </div>
                                                    <div>
                                                        <span className="name-main">{customer.name}</span>
                                                        <span className="customer-id">{customer.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="document-badge-modern">
                                                    {customer.document ? formatDocument(customer.document, customer.customer_type) : '--'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex flex-col gap-1">
                                                    <span className="contact-text-bold"><Phone size={14} className="inline mr-2 opacity-40" /> {formatPhone(customer.phone_number)}</span>
                                                    {customer.email && <span className="contact-text-sub"><Mail size={14} className="inline mr-2 opacity-40" /> {customer.email}</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="last-seen-cell">
                                                    <Calendar size={14} className="opacity-40" />
                                                    <span>{formatDate(customer.last_interaction)}</span>
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="action-btn-circle contact text-emerald-500 hover:bg-emerald-50"
                                                        title="Falar com Cliente"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigate(`/chat?search=${customer.phone_number}`)
                                                        }}
                                                    >
                                                        <MessageCircle size={16} />
                                                    </button>
                                                    <button
                                                        className="action-btn-circle"
                                                        onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer); }}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="action-btn-circle explore">
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Slide-over Profile Details */}
            {isDetailsOpen && selectedCustomer && (
                <div className="slide-over-overlay" onClick={() => setIsDetailsOpen(false)}>
                    <div className="slide-over-panel" onClick={e => e.stopPropagation()}>
                        <header className="slide-header">
                            <button className="back-btn-circle" onClick={() => setIsDetailsOpen(false)}>
                                <ArrowLeft size={20} />
                            </button>
                            <h3>Perfil do Cliente</h3>
                            <button className="edit-btn-text" onClick={() => handleEditCustomer(selectedCustomer)}>
                                <Edit2 size={16} /> Editar
                            </button>
                        </header>

                        <div className="slide-content overflow-y-auto scrollbar-hide">
                            <div className="profile-hero">
                                <div className={cn("hero-avatar", selectedCustomer.customer_type)}>
                                    {selectedCustomer.customer_type === 'company' ? <Users size={48} /> : getInitials(selectedCustomer.name)}
                                </div>
                                <h2>{selectedCustomer.name}</h2>
                                <p>{selectedCustomer.email || 'Sem e-mail cadastrado'}</p>

                                <button
                                    className="start-chat-btn"
                                    onClick={() => navigate(`/chat?search=${selectedCustomer.phone_number}`)}
                                >
                                    <MessageCircle size={20} />
                                    Falar com Cliente
                                </button>

                                <div className="hero-pills">
                                    <span className="pill">{selectedCustomer.customer_type === 'company' ? 'CNPJ' : 'CPF'}: {formatDocument(selectedCustomer.document || '', selectedCustomer.customer_type)}</span>
                                    <span className="pill">{formatPhone(selectedCustomer.phone_number)}</span>
                                </div>
                            </div>

                            <section className="profile-section">
                                <h4>Resumo de Interações</h4>
                                <div className="interaction-stats-grid">
                                    <div className="mini-stat">
                                        <label>Mensagens</label>
                                        <span className="value">{selectedCustomer.total_messages}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <label>Via IA</label>
                                        <span className="value text-emerald-500">{selectedCustomer.ai_messages_count || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <label>Via Agente</label>
                                        <span className="value text-blue-500">{selectedCustomer.agent_messages_count || 0}</span>
                                    </div>
                                    <div className="mini-stat">
                                        <label>Rating</label>
                                        <span className="value text-amber-500 flex items-center gap-1">
                                            {selectedCustomer.avg_rating > 0 ? selectedCustomer.avg_rating.toFixed(1) : '--'} <Star size={14} fill="currentColor" />
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="profile-section">
                                <h4>Observações</h4>
                                <div className="premium-notes">
                                    {selectedCustomer.notes || 'Nenhuma nota registrada.'}
                                </div>
                            </section>

                            <section className="profile-section">
                                <h4>Linha do Tempo de Conversas</h4>
                                <div className="timeline">
                                    {loadingHistory ? (
                                        <p className="text-center py-10 opacity-50">Carregando histórico...</p>
                                    ) : history.length === 0 ? (
                                        <p className="text-center py-10 opacity-50 text-sm">Nenhum atendimento registrado.</p>
                                    ) : (
                                        history.map((conv) => (
                                            <div key={conv.id} className="timeline-item">
                                                <div className="timeline-marker"></div>
                                                <div className="timeline-content">
                                                    <div className="flex justify-between">
                                                        <span className="time">{formatDate(conv.updated_at)}</span>
                                                        <span className="status-dot-text"><div className="dot"></div> {conv.status}</span>
                                                    </div>
                                                    <p className="msg-count">{conv.message_count} mensagens trocadas</p>
                                                    {conv.rating && (
                                                        <div className="rating-tag"><Star size={10} fill="currentColor" /> {conv.rating}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {!loadingHistory && history.length > 0 && (
                                    <button className="view-all-btn" onClick={() => setIsHistoryModalOpen(true)}>
                                        Ver Histórico Detalhado
                                    </button>
                                )}
                            </section>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Criar Cliente */}
            {isCreateModalOpen && (
                <div className="modal-overlay">
                    <div className="premium-modal modal-content">
                        <div className="modal-header">
                            <h3>Cadastrar Novo Cliente</h3>
                            <button className="close-btn" onClick={() => setIsCreateModalOpen(false)}>×</button>
                        </div>

                        <div className="modal-body overflow-y-auto pr-2 scrollbar-hide">
                            <div className="form-group mb-6">
                                <label className="premium-label">Tipo de Pessoa</label>
                                <div className="premium-toggle">
                                    <button
                                        className={newData.customer_type === 'personal' ? 'active' : ''}
                                        onClick={() => setNewData({ ...newData, customer_type: 'personal' })}
                                    >
                                        Física (CPF)
                                    </button>
                                    <button
                                        className={newData.customer_type === 'company' ? 'active' : ''}
                                        onClick={() => setNewData({ ...newData, customer_type: 'company' })}
                                    >
                                        Jurídica (CNPJ)
                                    </button>
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="premium-label">Nome Completo ou Razão Social</label>
                                <input
                                    className="premium-input"
                                    type="text"
                                    placeholder="Ex: João Silva ou Empresa Ltda"
                                    value={newData.name || ''}
                                    onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="form-group">
                                    <label className="premium-label">{newData.customer_type === 'company' ? 'CNPJ' : 'CPF'}</label>
                                    <input
                                        className="premium-input"
                                        type="text"
                                        placeholder={newData.customer_type === 'company' ? '00.000.000/0000-00' : '000.000.000-00'}
                                        value={newData.document || ''}
                                        onChange={(e) => setNewData({ ...newData, document: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="premium-label">WhatsApp/Celular</label>
                                    <input
                                        className="premium-input"
                                        type="text"
                                        placeholder="(00) 00000-0000"
                                        value={newData.phone || ''}
                                        onChange={(e) => setNewData({ ...newData, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group mb-6">
                                <label className="premium-label">E-mail</label>
                                <input
                                    className="premium-input"
                                    type="email"
                                    placeholder="cliente@dominio.com"
                                    value={newData.email || ''}
                                    onChange={(e) => setNewData({ ...newData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="premium-label">Notas e Observações</label>
                                <textarea
                                    className="premium-textarea"
                                    rows={4}
                                    placeholder="Detalhes relevantes..."
                                    value={newData.notes || ''}
                                    onChange={(e) => setNewData({ ...newData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer flex justify-end gap-3 pt-6 border-t mt-6">
                            <button className="cancel-btn-modern" onClick={() => setIsCreateModalOpen(false)}>Descartar</button>
                            <button className="save-btn-modern" onClick={handleCreateCustomer}>Salvar Cliente</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Editar Cliente */}
            {isEditModalOpen && (
                <div className="modal-overlay">
                    <div className="premium-modal modal-content">
                        <div className="modal-header">
                            <h3>Editar Cadastro</h3>
                            <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group mb-6">
                                <label className="premium-label">Nome / Razão Social</label>
                                <input
                                    className="premium-input"
                                    type="text"
                                    value={editData.name || ''}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="form-group">
                                    <label className="premium-label">Documento</label>
                                    <input
                                        className="premium-input"
                                        type="text"
                                        value={editData.document || ''}
                                        onChange={(e) => setEditData({ ...editData, document: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="premium-label">Status</label>
                                    <select
                                        value={editData.status}
                                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                        className="premium-select"
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="blocked">Bloqueado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group mb-6">
                                <label className="premium-label">E-mail</label>
                                <input
                                    className="premium-input"
                                    type="email"
                                    value={editData.email || ''}
                                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="premium-label">Notas</label>
                                <textarea
                                    className="premium-textarea"
                                    rows={4}
                                    value={editData.notes || ''}
                                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="modal-footer flex justify-end gap-3 pt-6 border-t mt-6">
                            <button className="cancel-btn-modern" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            <button className="save-btn-modern" onClick={handleSaveEdit}>Atualizar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Importação */}
            {isImportModalOpen && (
                <div className="modal-overlay" onClick={() => !importing && setIsImportModalOpen(false)}>
                    <div className="premium-modal modal-content import" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Importar via Planilha</h3>
                            <button className="close-btn" onClick={() => setIsImportModalOpen(false)}>×</button>
                        </div>

                        {!importSummary ? (
                            <div className="import-content-modern">
                                <div className="notice-box">
                                    <AlertCircle size={20} className="text-blue-500" />
                                    <p>Certifique-se que o arquivo XLSX contenha as colunas: <strong>Nome, Telefone, Email</strong> e <strong>Documento</strong>.</p>
                                </div>

                                <div
                                    className={cn("drop-zone-premium", importFile && 'has-file')}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        hidden
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                    />
                                    <div className="zone-icon">
                                        <Upload size={32} />
                                    </div>
                                    {importFile ? (
                                        <div className="selected-file">
                                            <span className="name">{importFile.name}</span>
                                            <span className="size">{(importFile.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                    ) : (
                                        <div className="prompt">
                                            <p>Selecione ou arraste sua planilha</p>
                                            <span>Formatos aceitos: .xlsx, .xls, .csv</span>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer flex justify-end gap-3 pt-6">
                                    <button className="cancel-btn-modern" onClick={() => setIsImportModalOpen(false)}>Cancelar</button>
                                    <button
                                        className="save-btn-modern"
                                        disabled={!importFile || importing}
                                        onClick={handleImport}
                                    >
                                        {importing ? <RefreshCw className="animate-spin" /> : <Upload size={18} />}
                                        {importing ? 'Processando...' : 'Iniciar Importação'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="import-results-modern text-center py-8">
                                <div className="success-icon-container">
                                    <CheckCircle size={48} />
                                </div>
                                <h4 className="text-xl font-bold mt-4">Importação Concluída</h4>
                                <div className="results-pills flex justify-center gap-4 mt-6">
                                    <div className="pill success"><strong>{importSummary.success}</strong> Sucessos</div>
                                    <div className="pill error"><strong>{importSummary.errors.length}</strong> Falhas</div>
                                </div>

                                {importSummary.errors.length > 0 && (
                                    <div className="error-log-box mt-8">
                                        <h5>Registros ignorados:</h5>
                                        <ul>
                                            {importSummary.errors.map((err: string, i: number) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    className="save-btn-modern w-full mt-10"
                                    onClick={() => {
                                        setIsImportModalOpen(false)
                                        setImportSummary(null)
                                        setImportFile(null)
                                    }}
                                >
                                    Finalizar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* Detailed History Modal */}
            {isHistoryModalOpen && selectedCustomer && (
                <div className="modal-overlay" onClick={() => setIsHistoryModalOpen(false)}>
                    <div className="premium-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Histórico de Atendimentos</h3>
                                <p className="text-sm text-slate-400 font-semibold">{selectedCustomer.name}</p>
                            </div>
                            <button className="action-btn-circle" onClick={() => setIsHistoryModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="history-modal-content scrollbar-hide">
                            {history.length === 0 ? (
                                <div className="history-empty-state">
                                    <Clock size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhum atendimento registrado para este cliente.</p>
                                </div>
                            ) : (
                                history.map((session: any) => (
                                    <div key={session.id} className="history-session-card mb-4">
                                        <div className="session-header">
                                            <div className="session-date">
                                                <span className="day">{new Date(session.updated_at).toLocaleDateString()}</span>
                                                <span className="hour">{new Date(session.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <span className={cn("session-badge", session.status === 'finished' ? 'finished' : 'active')}>
                                                {session.status === 'finished' ? 'Concluído' : 'Em Aberto'}
                                            </span>
                                        </div>

                                        <div className="session-stats">
                                            <div className="stat-item">
                                                <label>ID Sessão</label>
                                                <span>#{session.id.substring(0, 8)}</span>
                                            </div>
                                            <div className="stat-item">
                                                <label>Mensagens</label>
                                                <span>{session.message_count} msgs</span>
                                            </div>
                                            <div className="stat-item">
                                                <label>Instância</label>
                                                <span>{session.instance_id.split('_')[0]}</span>
                                            </div>
                                        </div>

                                        {(session.rating || session.rating_comment) && (
                                            <div className="session-rating-details">
                                                <label className="premium-label">Avaliação do Cliente</label>
                                                <div className="rating-stars-row">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={16}
                                                            fill={i < (session.rating || 0) ? "#fbbf24" : "none"}
                                                            stroke={i < (session.rating || 0) ? "#fbbf24" : "#e2e8f0"}
                                                        />
                                                    ))}
                                                </div>
                                                {session.rating_comment && (
                                                    <div className="rating-comment-text mt-3">
                                                        "{session.rating_comment}"
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    )
}
