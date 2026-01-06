import { useState, FormEvent } from 'react';
import { ShieldCheck, Loader2, ArrowRight } from 'lucide-react';

interface TwoFactorFormProps {
    onSubmit: (code: string) => Promise<void>;
    isLoading: boolean;
    onCancel: () => void;
    primaryColor?: string;
}

export default function TwoFactorForm({ onSubmit, isLoading, onCancel, primaryColor = '#10b981' }: TwoFactorFormProps) {
    const [code, setCode] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (code.length === 6) {
            onSubmit(code);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mb-4 ring-1 ring-emerald-500/20">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Autenticação de Dois Fatores</h2>
                <p className="text-slate-400 text-sm">
                    Digite o código de 6 dígitos do seu aplicativo autenticador.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Código de Verificação</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-2xl h-14 text-center text-2xl tracking-[0.5em] text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-mono"
                        placeholder="000000"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || code.length !== 6}
                    className="relative w-full h-14 text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 overflow-hidden shadow-xl"
                    style={{ backgroundColor: primaryColor }}
                >
                    <span className="flex items-center justify-center space-x-2 relative z-10 font-sans">
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Verificando...</span>
                            </>
                        ) : (
                            <>
                                <span>Confirmar Acesso</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="w-full text-center text-xs text-slate-500 hover:text-white transition-colors"
                >
                    Voltar para login
                </button>
            </form>
        </div>
    );
}
