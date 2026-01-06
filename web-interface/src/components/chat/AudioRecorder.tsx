import { useState, useRef, useEffect, useCallback } from 'react'
import { mediaApi } from '../../services/api'
import {
  Play,
  Pause,
  Square,
  Send,
  Loader2,
  Trash2,
  Check
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface AudioRecorderProps {
  onSend: (mediaId: string, duration: number) => void
  onCancel: () => void
}

export default function AudioRecorder({ onSend, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyserRef.current = analyser
      analyser.fftSize = 256

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setError(null)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

      const updateWaveform = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)

          const samples: number[] = []
          const sampleCount = 30
          const step = Math.floor(dataArray.length / sampleCount)
          for (let i = 0; i < sampleCount; i++) {
            samples.push(dataArray[i * step] / 255)
          }
          setWaveformData(samples)
        }
        animationRef.current = requestAnimationFrame(updateWaveform)
      }
      updateWaveform()

    } catch (err) {
      setError('Não foi possível acessar o microfone')
      console.error('Error accessing microphone:', err)
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        timerRef.current = setInterval(() => {
          setDuration(d => d + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        if (timerRef.current) clearInterval(timerRef.current)
      }
      setIsPaused(!isPaused)
    }
  }, [isRecording, isPaused])

  const cancelRecording = useCallback(() => {
    stopRecording()
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setWaveformData([])
    onCancel()
  }, [stopRecording, onCancel])

  const sendAudio = useCallback(async () => {
    if (!audioBlob) return
    setUploading(true)
    setError(null)
    try {
      const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' })
      const result = await mediaApi.upload(file)
      if (result.success && result.media) {
        onSend(result.media.id, duration)
      } else {
        setError(result.error || 'Erro ao enviar áudio')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }, [audioBlob, duration, onSend])

  useEffect(() => {
    startRecording()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop())
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [startRecording])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative border-t border-slate-100 bg-white/90 backdrop-blur-xl px-6 lg:px-12 py-5 z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-6 bg-white text-slate-900 rounded-[32px] p-2 pl-6 shadow-2xl border border-slate-200 transition-all animate-in slide-in-from-bottom-6 duration-500">

        {/* Recording Status Dot */}
        {isRecording && !isPaused && (
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20" />
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          </div>
        )}

        {/* Timer */}
        <span className={cn(
          "text-[15px] font-black tabular-nums tracking-wider min-w-[48px]",
          isRecording && !isPaused ? "text-white" : "text-white/40"
        )}>
          {formatDuration(duration)}
        </span>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[40px] px-4 overflow-hidden">
          {isRecording ? (
            <div className="flex items-center gap-[4px] h-8">
              {waveformData.map((value, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-[3px] rounded-full transition-all duration-150",
                    isPaused ? "bg-white/20" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  )}
                  style={{ height: `${Math.max(6, value * 32)}px` }}
                />
              ))}
            </div>
          ) : audioUrl ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <Check className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Áudio Pronto para Enviar</span>
              <div className="w-24 h-0.5 bg-emerald-500/20 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-500 animate-in slide-in-from-left duration-1000" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 opacity-40">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Iniciando Gravação...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pr-1">
          {/* Cancel Button */}
          <button
            onClick={cancelRecording}
            className="p-3.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-[22px] transition-all active:scale-90"
            title="Cancelar"
          >
            <Trash2 className="w-5.5 h-5.5" />
          </button>

          {isRecording ? (
            <div className="flex items-center gap-2">
              <button
                onClick={pauseRecording}
                className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-[22px] transition-all active:scale-90"
              >
                {isPaused ? <Play className="w-5.5 h-5.5 fill-current" /> : <Pause className="w-5.5 h-5.5 fill-current" />}
              </button>
              <button
                onClick={stopRecording}
                className="w-14 h-14 flex items-center justify-center bg-white text-slate-900 rounded-[22px] hover:scale-105 active:scale-90 transition-all shadow-xl"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            </div>
          ) : audioBlob ? (
            <button
              onClick={sendAudio}
              disabled={uploading}
              className="w-14 h-14 flex items-center justify-center bg-emerald-500 text-white rounded-[22px] hover:bg-emerald-600 hover:scale-105 active:scale-90 transition-all shadow-xl shadow-emerald-500/20 disabled:bg-white/10 disabled:text-white/20"
            >
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Send className="w-6 h-6 fill-current group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              )}
            </button>
          ) : null}
        </div>

        {error && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest text-center rounded-[20px] shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
