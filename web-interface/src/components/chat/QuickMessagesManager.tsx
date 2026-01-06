import { useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { QuickMessage } from './QuickMessages'
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Zap,
  MessageSquare,
  Info,
  Save,
  ChevronRight,
  Code,
  Terminal
} from 'lucide-react'
interface QuickMessagesManagerProps {
  onClose: () => void
}

export default function QuickMessagesManager({ onClose }: QuickMessagesManagerProps) {
  const { quickMessages, addQuickMessage, updateQuickMessage, deleteQuickMessage } = useChatStore()
  const [editingMessage, setEditingMessage] = useState<QuickMessage | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    shortcut: '',
    title: '',
    content: ''
  })

  const handleCreate = () => {
    setIsCreating(true)
    setEditingMessage(null)
    setFormData({ shortcut: '', title: '', content: '' })
  }

  const handleEdit = (msg: QuickMessage) => {
    setEditingMessage(msg)
    setIsCreating(false)
    setFormData({
      shortcut: msg.shortcut,
      title: msg.title,
      content: msg.content
    })
  }

  const handleSave = () => {
    if (!formData.shortcut || !formData.title || !formData.content) return

    // Extract variables from content
    const variableRegex = /\{(\w+)\}/g
    const variables: string[] = []
    let match
    while ((match = variableRegex.exec(formData.content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    if (isCreating) {
      addQuickMessage({
        id: Date.now().toString(),
        ...formData,
        variables
      })
    } else if (editingMessage) {
      updateQuickMessage(editingMessage.id, { ...formData, variables })
    }

    setIsCreating(false)
    setEditingMessage(null)
    setFormData({ shortcut: '', title: '', content: '' })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Tem certeza que deseja excluir esta mensagem rápida?')) {
      deleteQuickMessage(id)
    }
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingMessage(null)
    setFormData({ shortcut: '', title: '', content: '' })
  }

  const insertVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + `{${variable}}`
    }))
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}>
      <div
        className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 bg-white/80 backdrop-blur-xl z-20 sticky top-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 group">
              <Zap className="w-7 h-7 fill-current group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">Respostas Rápidas</h3>
              <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Agilize cada interação</p>
            </div>
          </div>
          <button className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-900 group" onClick={onClose}>
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="p-10">
            {(isCreating || editingMessage) ? (
              <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{isCreating ? 'Novo Modelo de Mensagem' : 'Editando Modelo Existente'}</h4>
                  </div>
                  <div className="px-4 py-2 bg-white text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm ring-1 ring-slate-100">
                    /{formData.shortcut || 'atribuir'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Atalho (sem a barra)</label>
                    </div>
                    <div className="relative group">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-lg group-focus-within:text-emerald-500 transition-colors">/</span>
                      <input
                        type="text"
                        value={formData.shortcut}
                        onChange={e => setFormData(prev => ({ ...prev, shortcut: e.target.value.replace(/\s/g, '').toLowerCase() }))}
                        placeholder="ola"
                        className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 rounded-[24px] py-5 pl-10 pr-6 text-[15px] font-bold text-slate-900 transition-all placeholder:text-slate-200 outline-none shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <Info className="w-3.5 h-3.5 text-emerald-500" />
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Título Identificador</label>
                    </div>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Saudação Padrão"
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 rounded-[24px] py-5 px-6 text-[15px] font-bold text-slate-900 transition-all placeholder:text-slate-200 outline-none shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Conteúdo da Mensagem</label>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                      <Code className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Suporta variáveis</span>
                    </div>
                  </div>
                  <div className="relative group">
                    <textarea
                      value={formData.content}
                      onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Digite aqui o texto que será enviado automaticamente..."
                      rows={6}
                      className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 rounded-[32px] py-8 px-10 text-[15px] font-medium leading-relaxed text-slate-900 transition-all placeholder:text-slate-200 resize-none outline-none shadow-sm"
                    />
                    <div className="absolute bottom-6 right-6 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Digitando modelo...</span>
                    </div>
                  </div>
                </div>

                {/* Variables Panel */}
                <div className="bg-emerald-50 rounded-[32px] p-8 space-y-5 relative overflow-hidden shadow-xl border border-emerald-100">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl pointer-events-none" />

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-black text-white/90 uppercase tracking-[0.2em]">Variáveis Dinâmicas</span>
                    </div>
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Clique para inserir</span>
                  </div>

                  <div className="flex flex-wrap gap-3 relative z-10">
                    {['nome', 'primeiro_nome', 'numero', 'data', 'hora', 'minutos'].map(v => (
                      <button
                        key={v}
                        onClick={() => insertVariable(v)}
                        className="bg-white/10 hover:bg-emerald-500 hover:text-white px-5 py-3 rounded-2xl text-emerald-300 text-[11px] font-black tracking-widest transition-all border border-white/5 active:scale-95 flex items-center gap-2 group/var"
                      >
                        <Plus className="w-3 h-3 opacity-0 group-hover/var:opacity-100 transition-all -ml-2 group-hover:ml-0" />
                        {`{${v}}`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-5 pt-8">
                  <button
                    className="px-10 py-5 text-slate-400 hover:text-slate-900 font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-slate-50 rounded-[24px] active:scale-95"
                    onClick={handleCancel}
                  >
                    Cancelar
                  </button>
                  <button
                    className="px-12 py-5 bg-emerald-500 text-white rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-3 group disabled:bg-slate-100 disabled:shadow-none disabled:text-slate-300"
                    onClick={handleSave}
                    disabled={!formData.shortcut || !formData.title || !formData.content}
                  >
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-10 animate-in slide-in-from-top-6 duration-500">
                <div className="flex items-center justify-between px-2 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                      <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20" />
                    </div>
                    <span className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">{quickMessages.length} Modelos Configurados</span>
                  </div>
                  <button
                    className="px-8 py-4 bg-emerald-500 text-white rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-3 active:scale-95 group"
                    onClick={handleCreate}
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Novo Modelo
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 pb-10">
                  {quickMessages.length === 0 ? (
                    <div className="py-24 text-center space-y-8 bg-slate-50 rounded-[50px] border-4 border-dashed border-slate-100">
                      <div className="w-24 h-24 bg-white rounded-[40px] shadow-sm flex items-center justify-center mx-auto text-slate-200 group hover:scale-110 transition-transform duration-500">
                        <MessageSquare className="w-12 h-12" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-black text-slate-900 uppercase tracking-widest">Nenhuma Mensagem</p>
                        <p className="text-sm font-bold text-slate-400">Automatize suas respostas e ganhe tempo no atendimento.</p>
                      </div>
                    </div>
                  ) : (
                    quickMessages.map(msg => (
                      <div
                        key={msg.id}
                        className="group flex items-center justify-between p-7 bg-white border border-slate-100 rounded-[35px] hover:border-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden active:scale-[0.99]"
                        onClick={() => handleEdit(msg)}
                      >
                        {/* Status bar */}
                        <div className="absolute inset-y-0 left-0 w-1.5 bg-emerald-500 transform -translate-x-full group-hover:translate-x-0 transition-transform" />

                        <div className="flex items-start gap-6 flex-1 min-w-0">
                          <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-50 transition-all duration-500 relative">
                            <div className="absolute inset-2 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-emerald-200 transition-colors" />
                            <span className="text-lg font-black text-slate-400 group-hover:text-emerald-500 transition-colors relative z-10">/{msg.shortcut[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0 pr-6 space-y-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg ring-1 ring-emerald-100">/{msg.shortcut}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-200 group-hover:text-emerald-200 transition-colors" />
                              <span className="text-[15px] font-black text-slate-900 truncate uppercase tracking-tight">{msg.title}</span>
                            </div>
                            <p className="text-[13px] font-medium text-slate-400 line-clamp-2 leading-relaxed h-[40px]">{msg.content}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                          <button
                            className="w-12 h-12 flex items-center justify-center bg-white shadow-xl shadow-slate-200 text-slate-400 hover:text-emerald-600 hover:scale-110 active:scale-95 rounded-2xl transition-all border border-slate-50"
                            onClick={(e) => { e.stopPropagation(); handleEdit(msg); }}
                            title="Editar"
                          >
                            <Edit3 className="w-5 h-5" />
                          </button>
                          <button
                            className="w-12 h-12 flex items-center justify-center bg-white shadow-xl shadow-slate-200 text-slate-400 hover:text-red-500 hover:scale-110 active:scale-95 rounded-2xl transition-all border border-slate-50"
                            onClick={(e) => handleDelete(msg.id, e)}
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
