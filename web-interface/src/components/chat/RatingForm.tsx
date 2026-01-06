import { useState } from 'react'
import { api } from '../../services/api'
import {
    Star,
    Send,
    CheckCircle2,
    MessageSquare,
    Loader2,
    AlertCircle,
    Smile,
    Meh,
    Frown,
    Angry,
    Heart
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs))
}

interface RatingFormProps {
    conversationId: string
    instanceId: string
    customerName?: string
    customerPhone?: string
    onSubmitted?: () => void
}

export default function RatingForm({
    conversationId,
    instanceId,
    customerName,
    customerPhone,
    onSubmitted
}: RatingFormProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async () => {
        if (rating === 0) {
            setError('Por favor, selecione uma avaliação')
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            const response = await api.post('/api/ratings/submit', {
                conversationId,
                instanceId,
                rating,
                comment: comment.trim() || null,
                customerName,
                customerPhone
            })

            if (response.success) {
                setIsSubmitted(true)
                onSubmitted?.()
            } else {
                setError(response.error || 'Erro ao enviar avaliação')
            }
        } catch (err) {
            setError('Erro de conexão. Tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getRatingLabel = (stars: number) => {
        switch (stars) {
            case 1: return 'Muito Insatisfeito'
            case 2: return 'Insatisfeito'
            case 3: return 'Neutro'
            case 4: return 'Satisfeito'
            case 5: return 'Muito Satisfeito'
            default: return 'Como foi sua experiência?'
        }
    }

    const getRatingIcon = (stars: number) => {
        const props = { className: "w-8 h-8 transition-all duration-500" }
        switch (stars) {
            case 1: return <Angry {...props} className={cn(props.className, "text-red-500 scale-125")} />
            case 2: return <Frown {...props} className={cn(props.className, "text-orange-500 scale-110")} />
            case 3: return <Meh {...props} className={cn(props.className, "text-yellow-500")} />
            case 4: return <Smile {...props} className={cn(props.className, "text-emerald-500 scale-110")} />
            case 5: return <Heart {...props} className={cn(props.className, "text-pink-500 scale-125 fill-pink-500")} />
            default: return <Smile {...props} className={cn(props.className, "text-slate-200")} />
        }
    }

    if (isSubmitted) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-50 rounded-[40px] flex items-center justify-center mb-8 relative">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-[40px] animate-ping duration-[2000ms]" />
                </div>

                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-4">Avaliação Enviada!</h2>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px] mx-auto mb-10">
                    Sua opinião é fundamental para evoluirmos nosso atendimento. Obrigado!
                </p>

                <div className="p-6 bg-slate-50 rounded-[32px] w-full border border-slate-100/50">
                    <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    "w-5 h-5 transition-all",
                                    star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"
                                )}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Sua Nota: {getRatingLabel(rating)}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-10 py-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Avalie nosso suporte</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed px-10">
                    Como você classifica o atendimento recebido até agora?
                </p>
            </div>

            {/* Stars Section */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className={cn(
                                "group relative p-2 transition-all duration-300",
                                star <= (hoverRating || rating) ? "scale-110" : "hover:scale-110"
                            )}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            disabled={isSubmitting}
                        >
                            <Star
                                className={cn(
                                    "w-10 h-10 transition-all duration-300",
                                    star <= (hoverRating || rating)
                                        ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                                        : "text-slate-100 group-hover:text-yellow-200"
                                )}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-2 animate-in slide-in-from-top-2">
                    <div className="h-10">
                        {getRatingIcon(hoverRating || rating)}
                    </div>
                    <span className={cn(
                        "text-[11px] font-black uppercase tracking-[0.3em]",
                        (hoverRating || rating) > 3 ? "text-emerald-500" : (hoverRating || rating) > 0 ? "text-orange-400" : "text-slate-300"
                    )}>
                        {getRatingLabel(hoverRating || rating)}
                    </span>
                </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-4 px-2">
                <div className="flex items-center gap-2 px-1">
                    <MessageSquare className="w-4 h-4 text-slate-400" />
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Adicional (Opcional)</label>
                </div>
                <div className="relative">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Em que podemos melhorar?"
                        maxLength={500}
                        rows={4}
                        className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 rounded-[28px] py-5 px-7 text-sm font-bold text-slate-700 transition-all placeholder:text-slate-300 resize-none shadow-inner"
                        disabled={isSubmitting}
                    />
                    <div className="absolute bottom-5 right-6">
                        <span className="text-[9px] font-black text-slate-300 tracking-widest">{comment.length}/500</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mx-2 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-xs font-bold leading-none">{error}</p>
                </div>
            )}

            {/* Submit Button */}
            <div className="px-2">
                <button
                    className={cn(
                        "w-full h-16 rounded-[28px] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 group",
                        rating === 0 || isSubmitting
                            ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none"
                            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                    )}
                    onClick={handleSubmit}
                    disabled={isSubmitting || rating === 0}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>ENVIANDO...</span>
                        </>
                    ) : (
                        <>
                            <span>Enviar Avaliação</span>
                            <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
