import { useState, useRef, useEffect } from 'react'
import { mediaApi, MediaUploadResult } from '../../services/api'
import {
  X,
  Image as ImageIcon,
  Film,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  CloudUpload
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface MediaUploadProps {
  type: 'image' | 'video' | 'document'
  onUpload: (media: MediaUploadResult, caption?: string) => void
  onCancel: () => void
  file?: File
}

export default function MediaUpload({ type, onUpload, onCancel, file: initialFile }: MediaUploadProps) {
  const [file, setFile] = useState<File | null>(initialFile || null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const result = await mediaApi.upload(file)

      clearInterval(progressInterval)
      setProgress(100)

      if (result.success && result.media) {
        onUpload(result.media, caption.trim() || undefined)
      } else {
        setError(result.error || 'Erro no upload')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const getAcceptTypes = () => {
    switch (type) {
      case 'image': return 'image/*'
      case 'video': return 'video/*'
      case 'document': return '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'
      default: return '*/*'
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'image': return 'Imagem'
      case 'video': return 'Vídeo'
      case 'document': return 'Documento'
      default: return 'Arquivo'
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-500" onClick={onCancel}>
      <div
        className="w-full max-w-xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-widest">Enviar {getTitle()}</h3>
          </div>
          <button className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90 text-slate-400 hover:text-slate-900" onClick={onCancel}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-10">
          {!file ? (
            <div
              className="group border-4 border-dashed border-slate-100 rounded-[40px] p-16 text-center hover:border-emerald-500/20 hover:bg-emerald-50/50 transition-all cursor-pointer relative overflow-hidden"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.02] transition-colors" />
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-200/50 border border-slate-100 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-emerald-500/10">
                {type === 'image' && <ImageIcon className="w-12 h-12 text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                {type === 'video' && <Film className="w-12 h-12 text-slate-300 group-hover:text-emerald-500 transition-colors" />}
                {type === 'document' && <FileText className="w-12 h-12 text-slate-300 group-hover:text-emerald-500 transition-colors" />}
              </div>
              <p className="text-base font-bold text-slate-400 leading-relaxed max-w-[280px] mx-auto group-hover:text-slate-600 transition-colors">
                Arraste seu arquivo ou <span className="text-emerald-600 font-black">clique para selecionar</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptTypes()}
                onChange={handleFileSelect}
                hidden
              />
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative rounded-[32px] overflow-hidden bg-slate-50 border border-slate-100 min-h-[250px] flex items-center justify-center shadow-inner group">
                {type === 'image' && preview && (
                  <img src={preview} alt="Preview" className="w-full h-auto max-h-[450px] object-contain transition-transform duration-700 group-hover:scale-105" />
                )}
                {type === 'video' && preview && (
                  <video src={preview} controls className="w-full max-h-[450px]" />
                )}
                {type === 'document' && (
                  <div className="p-16 text-center space-y-6">
                    <div className="w-24 h-24 bg-white rounded-[32px] shadow-2xl border border-slate-100 flex items-center justify-center mx-auto text-red-500 animate-in zoom-in duration-500">
                      <FileText className="w-12 h-12" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 truncate max-w-[350px] text-lg uppercase tracking-tight">{file.name}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin" />
                    <div className="space-y-3 text-center">
                      <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.3em] animate-pulse">{progress}% ENVIANDO...</span>
                      <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-5 bg-red-50 rounded-[24px] border border-red-100 flex items-center gap-4 text-red-600 animate-in slide-in-from-top-4 duration-500 shadow-sm shadow-red-500/5">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-red-500 shadow-sm border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              {file && (type === 'image' || type === 'video') && (
                <div className="relative group">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Adicionar legenda à mídia..."
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    className="w-full h-16 bg-slate-50 border border-slate-100 focus:border-emerald-500 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 transition-all text-[15px] font-bold text-slate-900 pl-16 pr-6 rounded-[24px] shadow-inner"
                    disabled={uploading}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 pb-10 flex gap-4">
          <button
            className="flex-1 py-5 px-8 rounded-[24px] font-black text-slate-400 hover:bg-slate-50 transition-all disabled:opacity-50 uppercase tracking-widest text-xs active:scale-95"
            onClick={onCancel}
            disabled={uploading}
          >
            Cancelar
          </button>
          <button
            className={cn(
              "flex-[2] py-5 px-8 rounded-[24px] font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden",
              !file || uploading ? "bg-slate-200 shadow-none cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/40"
            )}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="uppercase tracking-[0.2em] text-[11px]">Subindo arquivo...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                <span className="uppercase tracking-[0.2em] text-[11px]">Enviar Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
