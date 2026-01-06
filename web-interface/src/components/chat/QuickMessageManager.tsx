import { useState } from 'react'
import { useChatStore, QuickMessage } from '../../store/chatStore'
import {
    X,
    Zap,
    Edit3,
    Trash2,
    Plus,
    Info,
    Save,
    MessageSquare
} from 'lucide-react'




interface QuickMessageManagerProps {
    onClose: () => void
}

export default function QuickMessageManager({ onClose }: QuickMessageManagerProps) {
    const { quickMessages, addQuickMessage, updateQuickMessage, deleteQuickMessage } = useChatStore()
    const [editingMessage, setEditingMessage] = useState<Partial<QuickMessage> | null>(null)

    const handleSave = async () => {
        if (!editingMessage?.shortcut || !editingMessage?.content || !editingMessage?.title) {
            alert('Preencha todos os campos obrigatórios')
            return
        }

        if (editingMessage.id) {
            await updateQuickMessage(editingMessage.id, editingMessage)
        } else {
            await addQuickMessage(editingMessage as QuickMessage)
        }
        setEditingMessage(null)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir esta resposta rápida?')) return
        await deleteQuickMessage(id)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <Zap className="w-5 h-5 fill-emerald-600" />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Respostas Rápidas</h3>
                    </div>
                    <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {editingMessage ? (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Título</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Saudação Inicial"
                                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-4 px-6 text-sm font-bold text-slate-700 transition-all"
                                        value={editingMessage.title || ''}
                                        onChange={e => setEditingMessage({ ...editingMessage, title: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Atalho</label>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">/</span>
                                        <input
                                            type="text"
                                            placeholder="atalho"
                                            className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl py-4 pl-10 pr-6 text-sm font-bold text-slate-700 transition-all"
                                            value={editingMessage.shortcut || ''}
                                            onChange={e => setEditingMessage({ ...editingMessage, shortcut: e.target.value.replace('/', '') })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Conteúdo da Mensagem</label>
                                <textarea
                                    placeholder="Escreva sua resposta automática aqui..."
                                    rows={4}
                                    className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-3xl py-4 px-6 text-sm font-bold text-slate-700 transition-all resize-none"
                                    value={editingMessage.content || ''}
                                    onChange={e => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                />
                            </div>

                            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3 text-emerald-700">
                                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] font-bold leading-relaxed">
                                    Dica: Use <span className="text-emerald-900">{"{nome}"}</span> para o nome do cliente e <span className="text-emerald-900">{"{data}"}</span> para a data atual.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button className="flex-1 py-4 text-xs font-bold text-slate-400 hover:bg-slate-50 rounded-2xl" onClick={() => setEditingMessage(null)}>Cancelar</button>
                                <button className="flex-2 py-4 px-8 bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2" onClick={handleSave}>
                                    <Save className="w-4 h-4" />
                                    <span>Salvar Resposta</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <button
                                className="w-full py-5 border-2 border-dashed border-slate-100 rounded-[32px] text-slate-400 hover:border-emerald-500/20 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                onClick={() => setEditingMessage({ shortcut: '', title: '', content: '', variables: [] })}
                            >
                                <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-bold tracking-tight">Adicionar Nova Resposta</span>
                            </button>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Respostas Salvas</h4>
                                    <span className="text-[10px] font-bold text-slate-300">{quickMessages.length} cadastradas</span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
                                    {quickMessages.length === 0 ? (
                                        <div className="py-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                                                <MessageSquare className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">Nenhuma resposta automática criada ainda</p>
                                        </div>
                                    ) : (
                                        quickMessages.map(msg => (
                                            <div key={msg.id} className="group p-5 bg-slate-50/50 rounded-3xl border border-transparent hover:border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all flex items-start gap-4">
                                                <div className="w-10 h-10 bg-white rounded-2xl shadow-sm border border-slate-50 flex items-center justify-center text-emerald-500 flex-shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                    <span className="text-xs font-black">/{msg.shortcut[0].toUpperCase()}</span>
                                                </div>
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-900">{msg.title}</span>
                                                        <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-black text-slate-400 rounded-md">/{msg.shortcut}</span>
                                                    </div>
                                                    <p className="text-xs font-medium text-slate-400 line-clamp-1 italic">"{msg.content}"</p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl" onClick={() => setEditingMessage(msg)}>
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDelete(msg.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
