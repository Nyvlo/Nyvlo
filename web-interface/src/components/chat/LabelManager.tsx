import { useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { labelsApi } from '../../services/api'
import {
    X,
    Trash2,
    Plus,
    Tag,
    Check,
    Palette
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

interface LabelManagerProps {
    onClose: () => void
}

const PREDEFINED_COLORS = [
    '#00a884', '#128c7e', '#34b7f1', '#25d366',
    '#ff2e74', '#7f66ff', '#007bfc', '#ffbc00',
    '#ff5b5b', '#a6a6a6', '#000000', '#54656f'
]

export default function LabelManager({ onClose }: LabelManagerProps) {
    const { labels, loadLabels } = useChatStore()
    const [newLabelName, setNewLabelName] = useState('')
    const [selectedColor, setSelectedColor] = useState(PREDEFINED_COLORS[0])
    const [isAdding, setIsAdding] = useState(false)

    const handleAddLabel = async () => {
        if (!newLabelName.trim()) return

        const response = await labelsApi.create(newLabelName.trim(), selectedColor)
        if (response.success) {
            setNewLabelName('')
            setIsAdding(false)
            loadLabels()
        }
    }

    const handleDeleteLabel = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta etiqueta?')) return
        const response = await labelsApi.delete(id)
        if (response.success) {
            loadLabels()
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-500" onClick={onClose}>
            <div
                className="w-full max-w-lg bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 relative"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/10">
                            <Tag className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">Etiquetas</h3>
                            <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Organize suas conversas</p>
                        </div>
                    </div>
                    <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-900" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-10 space-y-10">
                    {/* Add New Section */}
                    {isAdding ? (
                        <div className="space-y-8 animate-in slide-in-from-top-6 duration-500 p-8 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome da Nova Etiqueta</label>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Ex: Suporte VIP, Urgente..."
                                    className="w-full bg-white border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 rounded-2xl py-5 px-6 text-[15px] font-bold text-slate-900 placeholder:text-slate-300 transition-all shadow-sm outline-none"
                                    value={newLabelName}
                                    onChange={e => setNewLabelName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <Palette className="w-3.5 h-3.5 text-emerald-500" />
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Selecione uma Cor</label>
                                </div>
                                <div className="grid grid-cols-6 gap-4">
                                    {PREDEFINED_COLORS.map(color => (
                                        <button
                                            key={color}
                                            className={cn(
                                                "aspect-square rounded-2xl transition-all duration-300 flex items-center justify-center relative group/color overflow-hidden",
                                                selectedColor === color
                                                    ? "scale-110 shadow-xl shadow-slate-900/10 ring-4 ring-emerald-500 ring-offset-2"
                                                    : "hover:scale-105 hover:shadow-lg"
                                            )}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setSelectedColor(color)}
                                        >
                                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/color:opacity-100 transition-opacity" />
                                            {selectedColor === color && <Check className="w-5 h-5 text-white stroke-[4px] animate-in zoom-in duration-300 relative z-10" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    className="flex-1 py-5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 rounded-2xl transition-all active:scale-95"
                                    onClick={() => setIsAdding(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="flex-[2] py-5 px-8 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                    onClick={handleAddLabel}
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    <span>Criar Etiqueta</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            className="w-full py-8 border-4 border-dashed border-slate-100 rounded-[35px] text-slate-300 hover:border-emerald-500/30 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all flex flex-col items-center justify-center gap-4 active:scale-[0.98] group relative overflow-hidden"
                            onClick={() => setIsAdding(true)}
                        >
                            <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors" />
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl group-hover:text-emerald-500 transition-all duration-500">
                                <Plus className="w-8 h-8" />
                            </div>
                            <span className="text-base font-black uppercase tracking-[0.2em]">Nova Etiqueta</span>
                        </button>
                    )}

                    {/* List Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                Suas Etiquetas
                            </h4>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                {labels.length} ATIVAS
                            </span>
                        </div>

                        <div className="space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide pr-2 py-1">
                            {labels.length === 0 ? (
                                <div className="py-20 text-center space-y-6 bg-slate-50/50 rounded-[40px] border border-dashed border-slate-100">
                                    <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center mx-auto text-slate-200 shadow-inner">
                                        <Tag className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Nenhuma etiqueta</p>
                                        <p className="text-xs font-bold text-slate-400">Comece criando uma para organizar seu fluxo.</p>
                                    </div>
                                </div>
                            ) : (
                                labels.map(label => (
                                    <div key={label.id} className="group flex items-center justify-between p-5 bg-white rounded-[28px] border border-slate-100 hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-0.5 transition-all duration-300">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="w-5 h-5 rounded-full shadow-inner ring-4 ring-white" style={{ backgroundColor: label.color }} />
                                                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: label.color }} />
                                            </div>
                                            <span className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{label.name}</span>
                                        </div>
                                        <button
                                            className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                            onClick={() => handleDeleteLabel(label.id)}
                                            title="Excluir etiqueta"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
