import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { usersApi, instancesApi, tenantsApi } from '../services/api'
import MainLayout from '../components/layout/MainLayout'
import './UsersPage.css'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'supervisor' | 'superadmin'
  allowedInstances: string[]
  active: boolean
  created_at: string
  last_login?: string
  tenant_id?: string
  mustChangePassword?: boolean
}

interface Instance {
  id: string
  name: string
  phoneNumber?: string
  status: string
}

interface Tenant {
  id: string
  name: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importSummary, setImportSummary] = useState<{ success: number; errors: string[] } | null>(null)

  const { user: currentUser } = useAuthStore()
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const [selectedTenant, setSelectedTenant] = useState<string>('')

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'agent' as 'admin' | 'agent' | 'supervisor',
    allowedInstances: [] as string[],
    active: true,
    tenantId: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate()

  const fetchData = useCallback(async () => {
    try {
      const promises: Promise<any>[] = [
        usersApi.list(selectedTenant || undefined),
        instancesApi.list()
      ];

      if (isSuperAdmin) {
        promises.push(tenantsApi.list());
      }

      const results = await Promise.all(promises);
      const usersRes = results[0];
      const instancesRes = results[1];
      const tenantsRes = isSuperAdmin ? results[2] : null;

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users || [])
      }
      if (instancesRes.success && instancesRes.data) {
        setInstances(instancesRes.data.instances || [])
      }
      if (tenantsRes?.success && tenantsRes.data) {
        setTenants(tenantsRes.data.tenants || [])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedTenant, isSuperAdmin])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        email: user.email || '',
        password: '',
        name: user.name,
        role: user.role as any,
        allowedInstances: user.allowedInstances || [],
        active: user.active,
        tenantId: user.tenant_id || ''
      })
    } else {
      setEditingUser(null)
      setFormData({
        username: '',
        email: '',
        password: '',
        name: '',
        role: 'agent',
        allowedInstances: [],
        active: true,
        tenantId: selectedTenant
      })
    }
    setError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          allowedInstances: formData.allowedInstances,
          active: formData.active
        }
        if (formData.password) { updateData.password = formData.password }

        const res = await usersApi.update(editingUser.id, updateData)
        if (!res.success) { setError(res.error || 'Erro ao atualizar usuário'); return }
      } else {
        if (!formData.password) { setError('Senha é obrigatória para novos usuários'); return }
        const payload = { ...formData };
        if (isSuperAdmin && formData.tenantId) { (payload as any).tenantId = formData.tenantId; }

        const res = await usersApi.create(payload)
        if (!res.success) { setError(res.error || 'Erro ao criar usuário'); return }
      }
      handleCloseModal()
      fetchData()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    try {
      const res = await usersApi.delete(userId)
      if (res.success) fetchData()
      else alert(res.error || 'Erro ao excluir usuário')
    } catch (err) { alert((err as Error).message) }
  }

  const handleResetPassword = async (userId: string, username: string) => {
    const newPassword = prompt(`Digite a nova senha para o usuário ${username}:`)
    if (!newPassword) return
    if (newPassword.length < 4) { alert('A senha deve ter pelo menos 4 caracteres'); return }
    try {
      setSaving(true)
      const res = await usersApi.update(userId, { password: newPassword })
      if (res.success) { alert('Senha redefinida com sucesso!') }
      else { alert(res.error || 'Erro ao redefinir senha') }
    } catch (err) { alert((err as Error).message) }
    finally { setSaving(false) }
  }

  const handleImportUsers = async () => {
    if (!importFile) return
    setError(null)
    setSaving(true)
    try {
      const res = await usersApi.importUsers(importFile)
      if (res.success) {
        setImportSummary(res.data.summary)
        fetchData()
      } else {
        setError(res.data.error || 'Erro ao importar usuários')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleInstance = (instanceId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedInstances: prev.allowedInstances.includes(instanceId)
        ? prev.allowedInstances.filter(id => id !== instanceId)
        : [...prev.allowedInstances, instanceId]
    }))
  }

  const handleSelectAllInstances = () => {
    setFormData(prev => ({
      ...prev,
      allowedInstances: prev.allowedInstances.length === instances.length
        ? []
        : instances.map(i => i.id)
    }))
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'agent': return 'Agente'
      case 'supervisor': return 'Supervisor'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545'
      case 'supervisor': return '#fd7e14'
      case 'agent': return '#28a745'
      default: return '#6c757d'
    }
  }

  return (
    <MainLayout>
      <div className="users-page">
        <header className="users-header">
          <div className="header-left">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
            </button>
            <h1>Gerenciar Usuários</h1>
          </div>
          <div className="header-right">
            {isSuperAdmin && (
              <select
                className="tenant-select"
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
              >
                <option value="">Todas as Empresas</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
            <button className="import-btn" onClick={() => { setShowImportModal(true); setImportSummary(null); setImportFile(null); }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              Importar em Lote
            </button>
            <button className="add-btn" onClick={() => handleOpenModal()}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Novo Usuário
            </button>
          </div>
        </header>

        <main className="users-content">
          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Carregando usuários...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="no-users">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#8696a0">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <p>Nenhum usuário cadastrado.</p>
              <button className="add-btn" onClick={() => handleOpenModal()}>
                Criar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Nome</th>
                    <th>Função</th>
                    <th>Instâncias</th>
                    <th>Status</th>
                    <th>Último Acesso</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className={!user.active ? 'inactive' : ''}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="username">{user.username}</span>
                            {user.email && <span className="email">{user.email}</span>}
                            {user.mustChangePassword && <span className="pwd-hint">Senha expirada</span>}
                          </div>
                        </div>
                      </td>
                      <td>{user.name}</td>
                      <td>
                        <span
                          className="role-badge"
                          style={{ backgroundColor: getRoleColor(user.role) }}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        {user.role === 'admin' ? (
                          <span className="all-instances">Todas</span>
                        ) : user.allowedInstances?.length > 0 ? (
                          <span className="instance-count">
                            {user.allowedInstances.length} instância(s)
                          </span>
                        ) : (
                          <span className="no-instances">Nenhuma</span>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${user.active ? 'active' : 'inactive'}`}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        {user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="reset-pwd-btn"
                            onClick={() => handleResetPassword(user.id, user.username)}
                            title="Redefinir Senha"
                          >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
                            </svg>
                          </button>
                          <button className="edit-btn" onClick={() => handleOpenModal(user)} title="Editar">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                          {user.id !== currentUser?.id && (
                            <button className="delete-btn" onClick={() => handleDelete(user.id)} title="Excluir">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>

        {/* User Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content user-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button className="close-btn" onClick={handleCloseModal}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="error-message">{error}</div>}

                  {isSuperAdmin && !editingUser && (
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Empresa (Tenant) *</label>
                      <select
                        value={formData.tenantId}
                        onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value }))}
                        required
                      >
                        <option value="">Selecione uma empresa</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome de Usuário *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        disabled={!!editingUser}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Nome Completo *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>{editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        required={!editingUser}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Função *</label>
                      <select
                        value={formData.role}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          role: e.target.value as 'admin' | 'agent' | 'supervisor'
                        }))}
                      >
                        <option value="agent">Agente</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        value={formData.active ? 'active' : 'inactive'}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          active: e.target.value === 'active'
                        }))}
                      >
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>

                  {formData.role !== 'admin' && (
                    <div className="form-group instances-group">
                      <div className="instances-header">
                        <label>Instâncias WhatsApp Permitidas</label>
                        <button
                          type="button"
                          className="select-all-btn"
                          onClick={handleSelectAllInstances}
                        >
                          {formData.allowedInstances.length === instances.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                        </button>
                      </div>

                      {instances.length === 0 ? (
                        <p className="no-instances-msg">Nenhuma instância disponível</p>
                      ) : (
                        <div className="instances-list">
                          {instances.map(instance => (
                            <label key={instance.id} className="instance-checkbox">
                              <input
                                type="checkbox"
                                checked={formData.allowedInstances.includes(instance.id)}
                                onChange={() => handleToggleInstance(instance.id)}
                              />
                              <span className="checkbox-custom"></span>
                              <span className="instance-name">{instance.name}</span>
                              {instance.phoneNumber && <span className="instance-phone">{instance.phoneNumber}</span>}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Salvando...' : (editingUser ? 'Salvar Alterações' : 'Criar Usuário')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
            <div className="modal-content import-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Importação em Lote de Funcionários</h3>
                <button className="close-btn" onClick={() => setShowImportModal(false)}>×</button>
              </div>
              <div className="modal-body">
                {error && <div className="error-message">{error}</div>}

                {!importSummary ? (
                  <div className="import-instructions">
                    <p>O arquivo deve seguir o padrão de colunas:</p>
                    <div className="template-hint">
                      <strong>Nome | data de nascimento | cpf | email | senha padrão</strong>
                    </div>
                    <ul>
                      <li><strong>Nome</strong>: Nome completo do funcionário</li>
                      <li><strong>data de nascimento</strong>: DD/MM/AAAA</li>
                      <li><strong>cpf</strong>: Apenas números ou formatado</li>
                      <li><strong>email</strong>: Utilizado para login</li>
                      <li><strong>senha padrão</strong>: Senha provisória</li>
                    </ul>
                    <div className="file-upload-zone">
                      <input type="file" accept=".xlsx, .xls, .csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                      <p className="file-hint">Arraste ou selecione um arquivo XLSX, XLS ou CSV</p>
                    </div>
                  </div>
                ) : (
                  <div className="import-summary">
                    <div className="summary-stat success">
                      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                      <span>{importSummary.success} usuários importados com sucesso!</span>
                    </div>
                    {importSummary.errors.length > 0 && (
                      <div className="summary-errors">
                        <h4>Falhas na Importação ({importSummary.errors.length}):</h4>
                        <div className="error-list">
                          {importSummary.errors.map((err, i) => <div key={i} className="error-item">• {err}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={() => setShowImportModal(false)}>
                  {importSummary ? 'Fechar' : 'Cancelar'}
                </button>
                {!importSummary && (
                  <button type="button" className="save-btn" onClick={handleImportUsers} disabled={saving || !importFile}>
                    {saving ? 'Importando...' : 'Iniciar Importação'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
