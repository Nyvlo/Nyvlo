import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '../../store/authStore'
import { usersApi, instancesApi } from '../../services/api'
import './UserManagement.css'

interface User {
  id: string
  username: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'supervisor'
  allowedInstances: string[]
  active: boolean
  created_at: string
  last_login?: string
}

interface Instance {
  id: string
  name: string
  phoneNumber?: string
  status: string
}

interface UserManagementProps {
  onClose: () => void
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [instances, setInstances] = useState<Instance[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    role: 'agent' as 'admin' | 'agent' | 'supervisor',
    allowedInstances: [] as string[],
    active: true
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user: currentUser } = useAuthStore()

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, instancesRes] = await Promise.all([
        usersApi.list(),
        instancesApi.list()
      ])

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data.users || [])
      }
      if (instancesRes.success && instancesRes.data) {
        setInstances(instancesRes.data.instances || [])
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleOpenForm = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        username: user.username,
        email: user.email || '',
        password: '',
        name: user.name,
        role: user.role,
        allowedInstances: user.allowedInstances || [],
        active: user.active
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
        active: true
      })
    }
    setError(null)
    setShowUserForm(true)
  }

  const handleCloseForm = () => {
    setShowUserForm(false)
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
        if (formData.password) {
          updateData.password = formData.password
        }

        const res = await usersApi.update(editingUser.id, updateData)
        if (!res.success) {
          setError(res.error || 'Erro ao atualizar usuário')
          return
        }
      } else {
        if (!formData.password) {
          setError('Senha é obrigatória para novos usuários')
          return
        }

        const res = await usersApi.create(formData)
        if (!res.success) {
          setError(res.error || 'Erro ao criar usuário')
          return
        }
      }

      handleCloseForm()
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
      if (res.success) {
        fetchData()
      } else {
        alert(res.error || 'Erro ao excluir usuário')
      }
    } catch (err) {
      alert((err as Error).message)
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin'
      case 'agent': return 'Agente'
      case 'supervisor': return 'Supervisor'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#dc3545'
      case 'supervisor': return '#fd7e14'
      case 'agent': return '#00a884'
      default: return '#6c757d'
    }
  }

  if (currentUser?.role !== 'admin') {
    return null
  }

  return (
    <div className="user-management-overlay" onClick={onClose}>
      <div className="user-management-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <button className="back-btn" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h2>Gerenciar Usuários</h2>
          <button className="add-user-btn" onClick={() => handleOpenForm()}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            Novo
          </button>
        </div>

        <div className="panel-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Carregando usuários...</p>
            </div>
          ) : showUserForm ? (
            <div className="user-form">
              <div className="form-header">
                <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button className="close-form-btn" onClick={handleCloseForm}>×</button>
              </div>

              {error && <div className="error-message">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nome de Usuário *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    disabled={!!editingUser}
                    placeholder="Digite o username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div className="form-group">
                  <label>{editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUser ? '••••••••' : 'Digite a senha'}
                    required={!editingUser}
                  />
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

                {instances.length > 0 && (
                  <div className="form-group">
                    <label>Instâncias WhatsApp Permitidas</label>
                    <div className="instances-checkboxes">
                      {instances.map(instance => (
                        <label key={instance.id} className="instance-checkbox">
                          <input
                            type="checkbox"
                            checked={formData.allowedInstances.includes(instance.id)}
                            onChange={() => handleToggleInstance(instance.id)}
                          />
                          <span className="checkbox-mark"></span>
                          <span className="instance-label">
                            {instance.name}
                            {instance.phoneNumber && <small>{instance.phoneNumber}</small>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleCloseForm}>
                    Cancelar
                  </button>
                  <button type="submit" className="save-btn" disabled={saving}>
                    {saving ? 'Salvando...' : (editingUser ? 'Salvar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="#8696a0">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <p>Nenhum usuário cadastrado</p>
              <button className="create-first-btn" onClick={() => handleOpenForm()}>
                Criar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className={`user-item ${!user.active ? 'inactive' : ''}`}>
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.name}</div>
                    <div className="user-username">@{user.username}</div>
                  </div>
                  <div className="user-role" style={{ backgroundColor: getRoleColor(user.role) }}>
                    {getRoleLabel(user.role)}
                  </div>
                  <div className="user-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleOpenForm(user)}
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(user.id)}
                        title="Excluir"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
