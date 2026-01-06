import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import {
    User,
    Phone,
    Mail,
    Fingerprint,
    Building2,
    Briefcase,
    Cake,
    Edit3,
    Save,
    X,
    Check,
    Loader2,
    AlertCircle,
    Tag,
    LayoutGrid,
    Plus,
    ChevronRight,
    Search
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

interface CustomField {
    id: string
    field_key: string
    field_value: string
}

interface ContactCRMProps {
    conversationId: string
    instanceId: string
    contactName?: string
    contactPhone?: string
}

const DEFAULT_FIELDS = [
    { key: 'email', label: 'Email do Cliente', type: 'email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50/50' },
    { key: 'cpf', label: 'CPF / CNPJ', type: 'text', icon: Fingerprint, color: 'text-slate-500', bg: 'bg-slate-50/50' },
    { key: 'empresa', label: 'Nome da Empresa', type: 'text', icon: Building2, color: 'text-emerald-500', bg: 'bg-emerald-50/50' },
    { key: 'segmento', label: 'Segmento de Atuação', type: 'text', icon: Tag, color: 'text-orange-500', bg: 'bg-orange-50/50' },
    { key: 'cargo', label: 'Cargo / Função', type: 'text', icon: Briefcase, color: 'text-indigo-500', bg: 'bg-indigo-50/50' },
    { key: 'aniversario', label: 'Data de Aniversário', type: 'date', icon: Cake, color: 'text-pink-500', bg: 'bg-pink-50/50' },
]

export default function ContactCRM({ conversationId, instanceId, contactName, contactPhone }: ContactCRMProps) {
    const [fields, setFields] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        loadFields()
    }, [conversationId])

    const loadFields = async () => {
        try {
            setIsLoading(true)
            const response = await api.get<{ fields: CustomField[] }>(
                `/api/instances/${instanceId}/conversations/${conversationId}/custom-fields`
            )

            if (response.success && response.data?.fields) {
                const fieldsMap: Record<string, string> = {}
                response.data.fields.forEach((f: CustomField) => {
                    fieldsMap[f.field_key] = f.field_value
                })
                setFields(fieldsMap)
            }
        } catch (error) {
            console.error('Erro ao carregar campos:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setMessage(null)

            const fieldsArray = Object.entries(fields).map(([key, value]) => ({
                key,
                value
            }))

            const response = await api.post(
                `/api/instances/${instanceId}/conversations/${conversationId}/custom-fields`,
                { fields: fieldsArray }
            )

            if (response.success) {
                setMessage({ type: 'success', text: 'Os dados foram atualizados no CRM!' })
                setIsEditing(false)
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'Não foi possível sincronizar os dados.' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Falha na comunicação com o servidor.' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleFieldChange = (key: string, value: string) => {
        setFields(prev => ({ ...prev, [key]: value }))
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-50">
                        <Search className="w-3.5 h-3.5 text-slate-300" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Consultando CRM</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Aguarde alguns instantes...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center shadow-2xl shadow-emerald-500/20 group hover:scale-105 transition-transform">
                        <LayoutGrid className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-black text-slate-900 uppercase tracking-tighter leading-none">Dados do Cliente</h3>
                        <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">Painel Estratégico CRM</p>
                    </div>
                </div>

                {!isEditing ? (
                    <button
                        className="h-12 px-6 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-emerald-500/20 hover:text-emerald-600 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all flex items-center gap-3 active:scale-95 group"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Editar
                    </button>
                ) : (
                    <div className="flex items-center gap-3 animate-in slide-in-from-right-10 duration-500">
                        <button
                            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-95"
                            onClick={() => {
                                setIsEditing(false)
                                loadFields()
                            }}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            className="h-12 px-8 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-600 shadow-2xl shadow-emerald-500/20 disabled:bg-slate-100 disabled:shadow-none transition-all flex items-center gap-3 active:scale-95 group"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            )}
                            Sincronizar
                        </button>
                    </div>
                )}
            </div>

            {message && (
                <div className={cn(
                    "p-6 rounded-[28px] flex items-center gap-4 animate-in slide-in-from-top-6 duration-500 shadow-xl",
                    message.type === 'success'
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-emerald-500/5"
                        : "bg-red-50 text-red-700 border border-red-100 shadow-red-500/5"
                )}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        message.type === 'success' ? "bg-white text-emerald-500" : "bg-white text-red-500")}>
                        {message.type === 'success' ? <Check className="w-5 h-5 stroke-[3]" /> : <AlertCircle className="w-5 h-5 stroke-[3]" />}
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-wider">{message.text}</p>
                </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group p-6 bg-slate-50/50 rounded-[32px] border border-transparent hover:border-slate-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-900/[0.02] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                            <User className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Identificação</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 truncate pl-1">{contactName || 'Nome não definido'}</p>
                </div>
                <div className="group p-6 bg-slate-50/50 rounded-[32px] border border-transparent hover:border-slate-200 transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-900/[0.02] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-emerald-500 transition-colors shadow-sm">
                            <Phone className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Conectividade</span>
                    </div>
                    <p className="text-sm font-black text-slate-900 truncate pl-1">+{contactPhone || 'Celular oculto'}</p>
                </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent mx-10" />

            {/* Custom Fields */}
            <div className="grid grid-cols-1 gap-8">
                {DEFAULT_FIELDS.map((field, idx) => (
                    <div
                        key={field.key}
                        className="space-y-4 px-1 animate-in slide-in-from-bottom-5 duration-500 fill-mode-both"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2.5">
                                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px]", field.bg, field.color)}>
                                    <field.icon className="w-3.5 h-3.5" />
                                </div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{field.label}</label>
                            </div>
                            {!isEditing && fields[field.key] && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/5 animate-pulse" />
                            )}
                        </div>

                        {isEditing ? (
                            <div className="relative group/input">
                                <input
                                    type={field.type}
                                    value={fields[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    placeholder={`Inserir ${field.label.toLowerCase()}...`}
                                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 rounded-[24px] py-5 px-8 text-sm font-bold text-slate-700 transition-all placeholder:text-slate-200 outline-none shadow-sm"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/input:opacity-100 transition-opacity">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                </div>
                            </div>
                        ) : (
                            <div className="px-8 py-6 bg-white border border-slate-100 rounded-[28px] text-[15px] font-bold text-slate-900 shadow-sm transition-all group/cell hover:shadow-2xl hover:shadow-slate-900/[0.03] hover:-translate-y-0.5 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 transform -translate-x-full group-hover/cell:translate-x-0 transition-transform" />
                                <span className={cn(fields[field.key] ? "text-slate-900" : "text-slate-200 italic font-medium")}>
                                    {fields[field.key] || 'Aguardando preenchimento'}
                                </span>
                                {fields[field.key] && <ChevronRight className="w-4 h-4 text-slate-100 group-hover/cell:text-slate-300 transition-colors" />}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {!isEditing && Object.keys(fields).length === 0 && (
                <div className="py-16 bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-200 text-center space-y-10 group/empty hover:bg-white hover:border-emerald-500/20 transition-all duration-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity pointer-events-none" />

                    <div className="relative z-10 space-y-10">
                        <div className="w-24 h-24 bg-white rounded-[40px] shadow-2xl shadow-slate-900/[0.05] border border-slate-50 flex items-center justify-center mx-auto text-slate-200 group-hover/empty:text-emerald-500 transition-all duration-700 group-hover/empty:scale-110 group-hover/empty:rotate-12">
                            <Tag className="w-10 h-10" />
                        </div>
                        <div className="space-y-3">
                            <p className="text-[17px] font-black text-slate-900 uppercase tracking-tighter">CRM Vazio</p>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-10 leading-relaxed">Este perfil ainda não possui metadados estratégicos. Vamos configurar agora?</p>
                        </div>
                        <button
                            className="px-10 py-5 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] hover:bg-emerald-600 transition-all flex items-center gap-4 mx-auto active:scale-95 group/btn-plus shadow-2xl shadow-emerald-500/30"
                            onClick={() => setIsEditing(true)}
                        >
                            <Plus className="w-5 h-5 group-hover/btn-plus:rotate-90 transition-transform" />
                            Preencher Agora
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
