import { useState, useEffect } from 'react'
import { mediaApi } from '../../services/api'
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Music,
  Loader2
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface MediaItem {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  thumbnailUrl?: string
  filename?: string
  caption?: string
}

interface MediaViewerProps {
  media: MediaItem
  onClose: () => void
  allMedia?: MediaItem[]
  currentIndex?: number
}

export default function MediaViewer({ media, onClose, allMedia, currentIndex = 0 }: MediaViewerProps) {
  const [index, setIndex] = useState(currentIndex)
  const [loading, setLoading] = useState(true)
  const [zoom, setZoom] = useState(1)

  const currentMedia = allMedia ? allMedia[index] : media
  const hasMultiple = allMedia && allMedia.length > 1

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasMultiple && index > 0) setIndex(index - 1)
          break
        case 'ArrowRight':
          if (hasMultiple && index < allMedia!.length - 1) setIndex(index + 1)
          break
        case '+':
        case '=':
          setZoom(z => Math.min(z + 0.25, 3))
          break
        case '-':
          setZoom(z => Math.max(z - 0.25, 0.5))
          break
        case '0':
          setZoom(1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [index, hasMultiple, allMedia, onClose])

  useEffect(() => {
    setLoading(true)
    setZoom(1)
  }, [index])

  const handleDownload = () => {
    const downloadUrl = mediaApi.getDownloadUrl(currentMedia.id)
    window.open(downloadUrl, '_blank')
  }

  const handlePrev = () => {
    if (hasMultiple && index > 0) {
      setIndex(index - 1)
    }
  }

  const handleNext = () => {
    if (hasMultiple && index < allMedia!.length - 1) {
      setIndex(index + 1)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-b from-black/50 to-transparent relative z-10" onClick={e => e.stopPropagation()}>
        <div className="flex flex-col gap-1">
          {currentMedia.filename && (
            <span className="text-sm font-black text-white/90 uppercase tracking-[0.2em] max-w-[300px] truncate">{currentMedia.filename}</span>
          )}
          {hasMultiple && (
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{index + 1} de {allMedia!.length} arquivos</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentMedia.type === 'image' && (
            <div className="flex items-center bg-white/10 rounded-2xl p-1 mr-4 border border-white/5">
              <button
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all"
                onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)) }}
                title="Diminuir zoom"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="px-3 text-[10px] font-black text-white/50 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                className="p-2 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all"
                onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 3)) }}
                title="Aumentar zoom"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
            </div>
          )}

          <button
            className="p-3 bg-white/10 hover:bg-emerald-500 rounded-2xl text-white transition-all group"
            onClick={(e) => { e.stopPropagation(); handleDownload() }}
            title="Baixar"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          <button
            className="p-3 bg-white/10 hover:bg-red-500 rounded-2xl text-white transition-all group"
            onClick={onClose}
            title="Fechar"
          >
            <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Navigation Buttons */}
        {hasMultiple && index > 0 && (
          <button
            className="absolute left-8 z-20 w-16 h-16 bg-white/5 hover:bg-white/20 rounded-3xl flex items-center justify-center text-white transition-all border border-white/5 backdrop-blur-sm group"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center p-12">
          {currentMedia.type === 'image' && (
            <img
              src={currentMedia.url}
              alt={currentMedia.filename || 'Imagem'}
              className={cn(
                "max-w-full max-h-full object-contain transition-all duration-300 shadow-2xl rounded-sm",
                loading ? "opacity-0 scale-95" : "opacity-100 scale-100"
              )}
              style={{ transform: `scale(${zoom})` }}
              onLoad={() => setLoading(false)}
            />
          )}

          {currentMedia.type === 'video' && (
            <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/5">
              <video
                src={currentMedia.url}
                className="w-full h-full"
                controls
                autoPlay
                onLoadedData={() => setLoading(false)}
              />
            </div>
          )}

          {currentMedia.type === 'audio' && (
            <div className="flex flex-col items-center gap-8 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-white/10 rounded-[48px] flex items-center justify-center border border-white/10 shadow-2xl">
                <Music className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="p-8 bg-white/5 backdrop-blur-2xl rounded-[32px] border border-white/10 w-full max-w-lg shadow-2xl">
                <audio
                  src={currentMedia.url}
                  className="w-full"
                  controls
                  autoPlay
                  onLoadedData={() => setLoading(false)}
                />
              </div>
            </div>
          )}

          {currentMedia.type === 'document' && (
            <div className="flex flex-col items-center gap-8 animate-in zoom-in-95">
              <div className="w-32 h-32 bg-white/10 rounded-[48px] flex items-center justify-center border border-white/10 shadow-2xl">
                <FileText className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="text-center space-y-2">
                <span className="block text-lg font-bold text-white tracking-tight">{currentMedia.filename}</span>
                <span className="block text-xs font-black text-white/30 uppercase tracking-[0.2em]">Arquivo de Documento</span>
              </div>
              <button
                className="mt-4 px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-3 active:scale-95"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
                Baixar Documento
              </button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {hasMultiple && index < allMedia!.length - 1 && (
          <button
            className="absolute right-8 z-20 w-16 h-16 bg-white/5 hover:bg-white/20 rounded-3xl flex items-center justify-center text-white transition-all border border-white/5 backdrop-blur-sm group"
            onClick={handleNext}
          >
            <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-8 py-10 bg-gradient-to-t from-black/50 to-transparent" onClick={e => e.stopPropagation()}>
        {currentMedia.caption && (
          <div className="max-w-3xl mx-auto p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] text-center">
            <p className="text-white text-base font-medium leading-relaxed">{currentMedia.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
}
