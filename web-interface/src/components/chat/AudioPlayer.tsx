import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Clock } from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

interface AudioPlayerProps {
  src: string
  duration?: number
  isFromMe?: boolean
}

export default function AudioPlayer({ src, duration: initialDuration, isFromMe }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(initialDuration || 0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [waveformData, setWaveformData] = useState<number[]>([])

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate static waveform data with a more natural look
    const bars = 40
    const data: number[] = []
    let lastValue = 0.5
    for (let i = 0; i < bars; i++) {
      // Create waves more than pure random
      const change = (Math.random() - 0.5) * 0.4
      lastValue = Math.max(0.2, Math.min(0.9, lastValue + change))
      data.push(lastValue)
    }
    setWaveformData(data)
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    const progressDiv = progressRef.current
    if (!audio || !progressDiv) return

    const rect = progressDiv.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    audio.currentTime = percentage * duration
  }

  const togglePlaybackRate = () => {
    const rates = [1, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextRate = rates[(currentIndex + 1) % rates.length]
    setPlaybackRate(nextRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className={cn(
      "flex items-center gap-5 py-4 px-5 rounded-[32px] min-w-[320px] transition-all duration-500",
      isFromMe ? "bg-white/10 ring-1 ring-white/10" : "bg-slate-50 border border-slate-100 shadow-inner shadow-slate-200/50"
    )}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button - Centered Circle */}
      <button
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-90 group relative flex-shrink-0",
          isFromMe
            ? "bg-white text-emerald-600 shadow-emerald-950/20"
            : "bg-white text-slate-900 shadow-slate-200 border border-slate-200"
        )}
        onClick={togglePlay}
      >
        <div className="absolute inset-0 rounded-full bg-current opacity-0 group-hover:opacity-10 transition-opacity" />
        {isPlaying ? (
          <Pause className="w-6 h-6 fill-current animate-in fade-in zoom-in duration-300" />
        ) : (
          <Play className="w-6 h-6 fill-current ml-1 animate-in fade-in zoom-in duration-300" />
        )}
      </button>

      {/* Waveform & Info Container */}
      <div className="flex-1 space-y-3 min-w-0">
        <div
          className="h-10 flex items-center gap-[4px] cursor-pointer group/wave relative"
          ref={progressRef}
          onClick={handleProgressClick}
        >
          {waveformData.map((value, index) => {
            const barProgress = (index / waveformData.length) * 100
            const isPlayed = barProgress <= progress
            return (
              <div
                key={index}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-300 group-hover/wave:opacity-80",
                  isPlayed
                    ? (isFromMe ? "bg-white" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]")
                    : (isFromMe ? "bg-white/20" : "bg-slate-200")
                )}
                style={{
                  height: `${20 + (value * 80)}%`,
                  transitionDelay: `${index * 15}ms`
                }}
              />
            )
          })}
        </div>

        {/* Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={cn("w-3 h-3", isFromMe ? "text-white/40" : "text-slate-300")} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em]",
              isFromMe ? "text-white/60" : "text-slate-400"
            )}>
              {formatTime(isPlaying ? currentTime : duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              className={cn(
                "px-3 py-1 rounded-xl text-[9px] font-black tracking-widest transition-all active:scale-95 shadow-sm",
                playbackRate !== 1
                  ? (isFromMe ? "bg-white text-emerald-600" : "bg-white text-slate-900")
                  : (isFromMe ? "bg-white/10 text-white" : "bg-white text-slate-500 border border-slate-100")
              )}
              onClick={togglePlaybackRate}
            >
              {playbackRate}x
            </button>
            <div className={cn("transition-transform hover:scale-110", isFromMe ? "text-white/40" : "text-slate-300")}>
              <Volume2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
