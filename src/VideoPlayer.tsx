'use client'

import React, {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useVideoContext } from './context'
import { ensureStylesInjected } from './styles'

export type ControlsTheme = {
  /**
   * Play/mute button icon and progress bar color (CSS color value, e.g. '#a3e635')
   */
  primary?: string
  /**
   * Controls button background color (CSS color value, e.g. 'rgba(0, 0, 0, 0.5)')
   */
  background?: string
  /**
   * Time text color (CSS color value, e.g. '#ffffff')
   */
  text?: string
  /**
   * Controls button hover background color (CSS color value, e.g. 'rgba(0, 0, 0, 0.65)')
   */
  hover?: string
}

export type PlayButtonPosition =
  | 'center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'

export type VideoTrack = {
  src: string
  srclang: string
  label: string
  kind?: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata'
  default?: boolean
}

export type VideoPlayerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onError'
> & {
  /**
   * Video source URL
   */
  src: string
  /**
   * Whether the video should autoplay when visible (default: true)
   */
  autoPlay?: boolean
  /**
   * Whether the video starts muted (default: true)
   */
  muted?: boolean
  /**
   * Unique identifier for the video player instance
   */
  videoId?: string
  /**
   * Poster image URL to display before video loads
   */
  poster?: string
  /**
   * Whether the video should loop (default: false)
   */
  loop?: boolean
  /**
   * Video preload strategy (default: 'metadata')
   */
  preload?: 'none' | 'metadata' | 'auto'
  /**
   * Whether the video should play inline on mobile devices (default: true)
   */
  playsInline?: boolean
  /**
   * Whether to pause the video automatically when it scrolls out of view (default: false)
   */
  pauseWhenOutOfView?: boolean
  /**
   * Whether to show built-in controls (default: true when `children` is omitted, false when `children` is provided)
   */
  showControls?: boolean
  /**
   * Automatically hide built-in controls after inactivity while playing (default: false)
   */
  autoHideControls?: boolean
  /**
   * Inactivity delay in ms before controls hide when `autoHideControls` is enabled (default: 2500)
   */
  autoHideDelay?: number
  /**
   * Enable keyboard shortcuts (Space/K, M, F, ArrowLeft/ArrowRight) when player is focused (default: true)
   */
  enableHotkeys?: boolean
  /**
   * Custom colors for built-in controls via CSS custom properties (`--rhvp-*`)
   */
  controlsTheme?: ControlsTheme
  /**
   * Position of the built-in play/pause button (default: 'top-right')
   */
  playButtonPosition?: PlayButtonPosition
  /**
   * Optional subtitle/caption tracks rendered inside `<video>`
   */
  tracks?: VideoTrack[]
  /**
   * Additional native attributes forwarded directly to the `<video>` element
   */
  videoProps?: Omit<
    React.VideoHTMLAttributes<HTMLVideoElement>,
    'src' | 'poster' | 'loop' | 'preload' | 'playsInline' | 'muted' | 'autoPlay'
  >
  /**
   * Callback fired when playback starts
   */
  onPlay?: () => void
  /**
   * Callback fired when playback pauses
   */
  onPause?: () => void
  /**
   * Callback fired when playback ends
   */
  onEnded?: () => void
  /**
   * Callback fired when time updates
   */
  onTimeUpdate?: (currentTime: number, progress: number) => void
  /**
   * Callback fired when video metadata is loaded
   */
  onLoadedMetadata?: (duration: number) => void
  /**
   * Callback fired when a media playback error occurs
   */
  onError?: (error: MediaError | null) => void
  /**
   * Render-prop function that receives video player API to build custom UI
   */
  children?: (api: VideoPlayerApi) => React.ReactNode
}

export type VideoPlayerApi = {
  id: string
  isLoaded: boolean
  isVisible: boolean
  isPlaying: boolean
  isMuted: boolean
  isBuffering: boolean
  isScrubbing: boolean
  isFullscreen: boolean
  isControlsVisible: boolean
  error: MediaError | null
  currentTime: number
  duration: number
  progress: number // 0..100
  buffered: number // 0..100
  volume: number // 0..1
  playbackRate: number
  play: () => void
  pause: () => void
  togglePlay: () => void
  toggleMute: () => void
  setMuted: (muted: boolean) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  seekTo: (seconds: number) => void
  seekPercent: (percent: number) => void // 0..100
  retry: () => void
  toggleFullscreen: () => Promise<void>
  togglePictureInPicture: () => Promise<void>
  formatTime: (seconds: number) => string
  videoRef: React.RefObject<HTMLVideoElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
}

export const formatVideoTime = (timeInSeconds: number): string => {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) {
    return '0:00'
  }
  const minutes = Math.floor(timeInSeconds / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

// Hoisted static SVG icons to avoid re-allocating JSX elements on every timeupdate render
const PAUSE_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
  </svg>
)

const PLAY_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M6 4L18 12L6 20V4Z" fill="currentColor" />
  </svg>
)

const MUTED_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor" />
    <path
      d="M23 9L17 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M17 9L23 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

const UNMUTED_ICON = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M3 8.99998V15H7L12 20V3.99998L7 8.99998H3ZM10 8.82998V15.17L7.83 13H5V11H7.83L10 8.82998ZM16.5 12C16.5 10.23 15.48 8.70998 14 7.96998V16.02C15.48 15.29 16.5 13.77 16.5 12ZM14 3.22998V5.28998C16.89 6.14998 19 8.82998 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.71998 18.01 4.13998 14 3.22998Z"
      fill="currentColor"
    />
  </svg>
)

type BuiltInControlsProps = {
  isPlaying: boolean
  isMuted: boolean
  currentTime: number
  progress: number
  buffered: number
  playButtonPosition: PlayButtonPosition
  hidden: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onSeekPercent: (percent: number) => void
  onScrubbingChange: (scrubbing: boolean) => void
}

const BuiltInControls = memo<BuiltInControlsProps>(
  ({
    isPlaying,
    isMuted,
    currentTime,
    progress,
    buffered,
    playButtonPosition,
    hidden,
    onTogglePlay,
    onToggleMute,
    onSeekPercent,
    onScrubbingChange,
  }) => {
    const isDraggingRef = useRef(false)

    const seekFromClientX = (clientX: number, trackEl: HTMLDivElement) => {
      const rect = trackEl.getBoundingClientRect()
      if (!rect.width) return
      const x = clientX - rect.left
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
      onSeekPercent(percent)
    }

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      const trackEl = e.currentTarget
      isDraggingRef.current = true
      onScrubbingChange(true)
      if (trackEl.setPointerCapture) {
        try {
          trackEl.setPointerCapture(e.pointerId)
        } catch {
          // Ignore if pointer capture is unsupported in synthetic test env
        }
      }
      seekFromClientX(e.clientX, trackEl)
    }

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      e.stopPropagation()
      seekFromClientX(e.clientX, e.currentTarget)
    }

    const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return
      e.stopPropagation()
      isDraggingRef.current = false
      const trackEl = e.currentTarget
      if (trackEl.releasePointerCapture) {
        try {
          trackEl.releasePointerCapture(e.pointerId)
        } catch {
          // Ignore
        }
      }
      onScrubbingChange(false)
    }

    const handleProgressKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        onSeekPercent(Math.max(0, progress - 5))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        onSeekPercent(Math.min(100, progress + 5))
      } else if (e.key === 'Home') {
        e.preventDefault()
        e.stopPropagation()
        onSeekPercent(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        e.stopPropagation()
        onSeekPercent(100)
      }
    }

    const playPositionModifier = `rhvp-btn-wrap--${playButtonPosition}`
    const mutePositionModifier =
      playButtonPosition === 'top-right'
        ? 'rhvp-btn-wrap--mute-offset'
        : 'rhvp-btn-wrap--mute-top'
    const visibilityModifier = hidden ? 'rhvp-controls--hidden' : ''

    return (
      <div className={`rhvp-controls ${visibilityModifier}`.trim()}>
        <div className={`rhvp-btn-wrap ${playPositionModifier}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onTogglePlay()
            }}
            className="rhvp-btn rhvp-btn--play"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? PAUSE_ICON : PLAY_ICON}
          </button>
        </div>

        <div className={`rhvp-btn-wrap ${mutePositionModifier}`}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              onToggleMute()
            }}
            className="rhvp-btn rhvp-btn--mute"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            aria-pressed={isMuted}
          >
            {isMuted ? MUTED_ICON : UNMUTED_ICON}
          </button>
        </div>

        <div className="rhvp-bottom-bar" onClick={(e) => e.stopPropagation()}>
          <div>
            <div className="rhvp-time">{formatVideoTime(currentTime)}</div>
            <div className="rhvp-progress-row">
              <div
                role="slider"
                aria-label="Seek video"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                tabIndex={0}
                onKeyDown={handleProgressKeyDown}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={(e) => {
                  seekFromClientX(e.clientX, e.currentTarget)
                }}
                className="rhvp-progress-track"
              >
                <div
                  className="rhvp-progress-buffered"
                  style={{ width: `${buffered}%` }}
                />
                <div
                  className="rhvp-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

BuiltInControls.displayName = 'BuiltInControls'

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      className = '',
      style,
      autoPlay = true,
      muted: initialMuted = true,
      videoId,
      poster,
      loop = false,
      preload = 'metadata',
      playsInline = true,
      pauseWhenOutOfView = false,
      showControls,
      autoHideControls = false,
      autoHideDelay = 2500,
      enableHotkeys = true,
      controlsTheme = {},
      playButtonPosition = 'top-right',
      tracks,
      videoProps,
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onLoadedMetadata,
      onError,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      onKeyDown,
      ...containerProps
    },
    forwardedRef
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const loadedSrcRef = useRef<string | null>(null)
    const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null
    )

    // Latest callback refs to prevent tearing down DOM listeners when inline callbacks re-render
    const callbacksRef = useRef({
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onLoadedMetadata,
      onError,
    })
    callbacksRef.current = {
      onPlay,
      onPause,
      onEnded,
      onTimeUpdate,
      onLoadedMetadata,
      onError,
    }

    const uniqueId = useId()
    const id = videoId || uniqueId
    const { currentlyPlayingId, setCurrentlyPlayingId, playVideo } =
      useVideoContext()

    useImperativeHandle(
      forwardedRef,
      () => videoRef.current as HTMLVideoElement
    )

    const shouldShowControls = showControls ?? !children

    const [isPlaying, setIsPlaying] = useState(false)
    const [progress, setProgress] = useState(0)
    const [buffered, setBuffered] = useState(0)
    const [isMuted, setIsMuted] = useState(initialMuted)
    const [volume, setVolumeState] = useState(1)
    const [playbackRate, setPlaybackRateState] = useState(1)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)
    const [isBuffering, setIsBuffering] = useState(false)
    const [isScrubbing, setIsScrubbing] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isControlsVisible, setIsControlsVisible] = useState(true)
    const [error, setError] = useState<MediaError | null>(null)

    const isPlayingRef = useRef(isPlaying)
    isPlayingRef.current = isPlaying
    const durationRef = useRef(duration)
    durationRef.current = duration
    const progressRef = useRef(progress)
    progressRef.current = progress

    // Inject native CSS once on client
    useEffect(() => {
      ensureStylesInjected()
    }, [])

    // Release global context lock if this player unmounts while active
    useEffect(() => {
      return () => {
        setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
      }
    }, [id, setCurrentlyPlayingId])

    // Keep muted state in sync if prop changes
    useEffect(() => {
      setIsMuted(initialMuted)
    }, [initialMuted])

    // Auto-hide controls timer management
    const resetControlsTimer = useCallback(() => {
      setIsControlsVisible(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = null
      }
      if (autoHideControls && isPlaying && !isScrubbing) {
        hideControlsTimeoutRef.current = setTimeout(() => {
          setIsControlsVisible(false)
        }, autoHideDelay)
      }
    }, [autoHideControls, autoHideDelay, isPlaying, isScrubbing])

    useEffect(() => {
      if (!autoHideControls) {
        setIsControlsVisible(true)
        return
      }
      if (isPlaying && !isScrubbing) {
        resetControlsTimer()
      } else {
        setIsControlsVisible(true)
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current)
          hideControlsTimeoutRef.current = null
        }
      }
      return () => {
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current)
          hideControlsTimeoutRef.current = null
        }
      }
    }, [autoHideControls, isPlaying, isScrubbing, resetControlsTimer])

    // Lazy-load by visibility & optionally pause when out of view
    useEffect(() => {
      if (!containerRef.current) return
      if (typeof IntersectionObserver === 'undefined') {
        setIsVisible(true)
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (!entry) return

          if (entry.isIntersecting) {
            setIsVisible(true)
            if (!pauseWhenOutOfView) {
              observer.disconnect()
            }
          } else if (pauseWhenOutOfView) {
            setIsPlaying(false)
            setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
          }
        },
        { threshold: 0.1 }
      )

      observer.observe(containerRef.current)
      return () => observer.disconnect()
    }, [id, pauseWhenOutOfView, setCurrentlyPlayingId])

    // Set or update src when visible
    useEffect(() => {
      if (!isVisible || !videoRef.current) return
      const video = videoRef.current

      if (loadedSrcRef.current !== src) {
        const isInitialLoad = loadedSrcRef.current === null
        loadedSrcRef.current = src
        setError(null)
        video.src = src
        video.load()
        setIsLoaded(true)
        setCurrentTime(0)
        setProgress(0)
        setBuffered(0)
        setDuration(0)

        if (autoPlay && isInitialLoad) {
          playVideo(id)
          setIsPlaying(true)
        }
      }
    }, [isVisible, autoPlay, src, id, playVideo])

    // Attach native video events (callbacks accessed via ref to keep listener attachment stable)
    useEffect(() => {
      const video = videoRef.current
      if (!video || !isLoaded) return

      const updateBuffered = () => {
        const dur = video.duration
        if (
          !dur ||
          !Number.isFinite(dur) ||
          !video.buffered ||
          video.buffered.length === 0
        ) {
          return
        }
        try {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1)
          const pct = Math.max(0, Math.min(100, (bufferedEnd / dur) * 100))
          setBuffered(pct)
        } catch {
          // Ignore IndexSizeError if buffered ranges mutated
        }
      }

      const handleLoadedMetadata = () => {
        const nextDuration = Number.isFinite(video.duration)
          ? video.duration
          : 0
        setDuration(nextDuration)
        updateBuffered()
        callbacksRef.current.onLoadedMetadata?.(nextDuration)
      }

      const handleTimeUpdate = () => {
        const time = video.currentTime
        const dur = video.duration
        const nextProgress =
          dur && Number.isFinite(dur) ? (time / dur) * 100 : 0
        setCurrentTime(time)
        setProgress(nextProgress)
        updateBuffered()
        callbacksRef.current.onTimeUpdate?.(time, nextProgress)
      }

      const handleEnded = () => {
        if (loop) return
        setIsPlaying(false)
        setProgress(0)
        video.currentTime = 0
        setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
        callbacksRef.current.onEnded?.()
      }

      const handleNativePlay = () => {
        setIsPlaying(true)
        playVideo(id)
        callbacksRef.current.onPlay?.()
      }

      const handleNativePause = () => {
        if (video.ended) return
        setIsPlaying(false)
        setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
        callbacksRef.current.onPause?.()
      }

      const handleVolumeChange = () => {
        setIsMuted(video.muted)
        setVolumeState(video.volume)
      }

      const handleRateChange = () => {
        setPlaybackRateState(video.playbackRate)
      }

      const handleWaiting = () => setIsBuffering(true)
      const handlePlaying = () => setIsBuffering(false)

      const handleError = () => {
        const mediaError = video.error || null
        setError(mediaError)
        setIsBuffering(false)
        setIsPlaying(false)
        setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
        callbacksRef.current.onError?.(mediaError)
      }

      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('durationchange', handleLoadedMetadata)
      video.addEventListener('progress', updateBuffered)
      video.addEventListener('loadeddata', updateBuffered)
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('ended', handleEnded)
      video.addEventListener('play', handleNativePlay)
      video.addEventListener('pause', handleNativePause)
      video.addEventListener('volumechange', handleVolumeChange)
      video.addEventListener('ratechange', handleRateChange)
      video.addEventListener('waiting', handleWaiting)
      video.addEventListener('playing', handlePlaying)
      video.addEventListener('canplay', handlePlaying)
      video.addEventListener('error', handleError)

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('durationchange', handleLoadedMetadata)
        video.removeEventListener('progress', updateBuffered)
        video.removeEventListener('loadeddata', updateBuffered)
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('ended', handleEnded)
        video.removeEventListener('play', handleNativePlay)
        video.removeEventListener('pause', handleNativePause)
        video.removeEventListener('volumechange', handleVolumeChange)
        video.removeEventListener('ratechange', handleRateChange)
        video.removeEventListener('waiting', handleWaiting)
        video.removeEventListener('playing', handlePlaying)
        video.removeEventListener('canplay', handlePlaying)
        video.removeEventListener('error', handleError)
      }
    }, [isLoaded, id, loop, playVideo, setCurrentlyPlayingId])

    // Track fullscreen changes
    useEffect(() => {
      if (typeof document === 'undefined') return
      const handleFullscreenChange = () => {
        setIsFullscreen(
          Boolean(
            document.fullscreenElement &&
              containerRef.current &&
              document.fullscreenElement === containerRef.current
          )
        )
      }
      document.addEventListener('fullscreenchange', handleFullscreenChange)
      return () =>
        document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Sync with global context (single active video)
    useEffect(() => {
      if (currentlyPlayingId === id) {
        setIsPlaying(true)
      } else if (currentlyPlayingId !== id && isPlaying) {
        setIsPlaying(false)
      }
    }, [currentlyPlayingId, id, isPlaying])

    // Execute play/pause on the underlying <video> element
    useEffect(() => {
      const video = videoRef.current
      if (!video || !isLoaded) return

      let cancelled = false

      const doPlay = async () => {
        try {
          await video.play()
        } catch (err) {
          if (cancelled) return
          // eslint-disable-next-line no-console
          console.error('Video playback failed:', err)
          setIsPlaying(false)
          setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
        }
      }

      if (isPlaying) {
        doPlay()
      } else {
        video.pause()
      }

      return () => {
        cancelled = true
      }
    }, [isPlaying, isLoaded, src, id, setCurrentlyPlayingId])

    const play = useCallback(() => {
      setIsVisible(true)
      playVideo(id)
      setIsPlaying(true)
    }, [id, playVideo])

    const pause = useCallback(() => {
      setCurrentlyPlayingId((prev) => (prev === id ? null : prev))
      setIsPlaying(false)
    }, [id, setCurrentlyPlayingId])

    const togglePlay = useCallback(() => {
      if (isPlayingRef.current) {
        setCurrentlyPlayingId((curr) => (curr === id ? null : curr))
        setIsPlaying(false)
      } else {
        setIsVisible(true)
        playVideo(id)
        setIsPlaying(true)
      }
    }, [id, playVideo, setCurrentlyPlayingId])

    const setMuted = useCallback((muted: boolean) => {
      setIsMuted(muted)
      if (videoRef.current) {
        videoRef.current.muted = muted
      }
    }, [])

    const toggleMute = useCallback(() => {
      setIsMuted((prev) => {
        const next = !prev
        if (videoRef.current) {
          videoRef.current.muted = next
        }
        return next
      })
    }, [])

    const setVolume = useCallback((nextVolume: number) => {
      if (!Number.isFinite(nextVolume)) return
      const clamped = Math.max(0, Math.min(1, nextVolume))
      setVolumeState(clamped)
      if (videoRef.current) {
        videoRef.current.volume = clamped
        if (clamped > 0 && videoRef.current.muted) {
          videoRef.current.muted = false
          setIsMuted(false)
        }
      }
    }, [])

    const setPlaybackRate = useCallback((rate: number) => {
      if (!Number.isFinite(rate) || rate <= 0) return
      setPlaybackRateState(rate)
      if (videoRef.current) {
        videoRef.current.playbackRate = rate
      }
    }, [])

    const seekTo = useCallback((seconds: number) => {
      if (!Number.isFinite(seconds) || !videoRef.current) return
      const effectiveDuration =
        durationRef.current || videoRef.current.duration || 0
      const clamped =
        effectiveDuration > 0
          ? Math.max(0, Math.min(effectiveDuration, seconds))
          : Math.max(0, seconds)
      videoRef.current.currentTime = clamped
      setCurrentTime(clamped)
      if (effectiveDuration > 0) {
        setProgress((clamped / effectiveDuration) * 100)
      }
    }, [])

    const seekPercent = useCallback((percent: number) => {
      if (!Number.isFinite(percent) || !videoRef.current) return
      const effectiveDuration =
        durationRef.current || videoRef.current.duration || 0
      if (!effectiveDuration) return
      const clamped = Math.max(0, Math.min(100, percent))
      const newTime = (clamped / 100) * effectiveDuration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      setProgress(clamped)
    }, [])

    const retry = useCallback(() => {
      if (!videoRef.current) return
      setError(null)
      setIsVisible(true)
      loadedSrcRef.current = src
      videoRef.current.src = src
      videoRef.current.load()
      setIsLoaded(true)
      playVideo(id)
      setIsPlaying(true)
    }, [src, id, playVideo])

    const toggleFullscreen = useCallback(async () => {
      if (typeof document === 'undefined' || !containerRef.current) return
      try {
        if (!document.fullscreenElement) {
          await containerRef.current.requestFullscreen()
        } else {
          await document.exitFullscreen()
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Fullscreen toggle failed:', err)
      }
    }, [])

    const togglePictureInPicture = useCallback(async () => {
      if (typeof document === 'undefined' || !videoRef.current) return
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture()
        } else if (videoRef.current.requestPictureInPicture) {
          await videoRef.current.requestPictureInPicture()
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Picture-in-Picture toggle failed:', err)
      }
    }, [])

    const api: VideoPlayerApi = useMemo(
      () => ({
        id,
        isLoaded,
        isVisible,
        isPlaying,
        isMuted,
        isBuffering,
        isScrubbing,
        isFullscreen,
        isControlsVisible,
        error,
        currentTime,
        duration,
        progress,
        buffered,
        volume,
        playbackRate,
        play,
        pause,
        togglePlay,
        toggleMute,
        setMuted,
        setVolume,
        setPlaybackRate,
        seekTo,
        seekPercent,
        retry,
        toggleFullscreen,
        togglePictureInPicture,
        formatTime: formatVideoTime,
        videoRef,
        containerRef,
      }),
      [
        id,
        isLoaded,
        isVisible,
        isPlaying,
        isMuted,
        isBuffering,
        isScrubbing,
        isFullscreen,
        isControlsVisible,
        error,
        currentTime,
        duration,
        progress,
        buffered,
        volume,
        playbackRate,
        play,
        pause,
        togglePlay,
        toggleMute,
        setMuted,
        setVolume,
        setPlaybackRate,
        seekTo,
        seekPercent,
        retry,
        toggleFullscreen,
        togglePictureInPicture,
      ]
    )

    const onClickVideo = useCallback(
      (e: MouseEvent<HTMLVideoElement>) => {
        e.stopPropagation()
        togglePlay()
      },
      [togglePlay]
    )

    const handleContainerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || !enableHotkeys) return
      if (e.altKey || e.ctrlKey || e.metaKey) return

      const target = e.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
        if (tagName === 'button' && e.key === ' ') return
        e.preventDefault()
        togglePlay()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        toggleMute()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        seekPercent(Math.max(0, progressRef.current - 5))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        seekPercent(Math.min(100, progressRef.current + 5))
      }
    }

    // Native CSS custom properties for theming
    const themeVars: Record<string, string | undefined> = {
      '--rhvp-primary': controlsTheme.primary || '#a3e635',
      '--rhvp-bg': controlsTheme.background || 'rgba(0, 0, 0, 0.5)',
      '--rhvp-text': controlsTheme.text || '#ffffff',
      '--rhvp-hover': controlsTheme.hover || 'rgba(0, 0, 0, 0.65)',
    }

    return (
      <div
        ref={containerRef}
        className={`rhvp-container ${className}`.trim()}
        style={{
          ...themeVars,
          ...style,
        }}
        onMouseEnter={(e) => {
          resetControlsTimer()
          onMouseEnter?.(e)
        }}
        onMouseMove={(e) => {
          if (autoHideControls) resetControlsTimer()
          onMouseMove?.(e)
        }}
        onMouseLeave={(e) => {
          if (autoHideControls && isPlaying && !isScrubbing) {
            setIsControlsVisible(false)
          }
          onMouseLeave?.(e)
        }}
        onKeyDown={handleContainerKeyDown}
        {...containerProps}
      >
        <video
          {...videoProps}
          ref={videoRef}
          playsInline={playsInline}
          muted={isMuted}
          autoPlay={false}
          loop={loop}
          onClick={shouldShowControls ? onClickVideo : videoProps?.onClick}
          poster={poster}
          preload={preload}
          aria-label={videoProps?.['aria-label'] || 'Video player'}
          className={`rhvp-video ${videoProps?.className || ''}`.trim()}
        >
          {tracks?.map((track) => (
            <track
              key={`${track.srclang}-${track.src}`}
              src={track.src}
              srcLang={track.srclang}
              label={track.label}
              kind={track.kind || 'subtitles'}
              default={track.default}
            />
          ))}
        </video>

        {shouldShowControls ? (
          <BuiltInControls
            isPlaying={isPlaying}
            isMuted={isMuted}
            currentTime={currentTime}
            progress={progress}
            buffered={buffered}
            playButtonPosition={playButtonPosition}
            hidden={autoHideControls && !isControlsVisible}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onSeekPercent={seekPercent}
            onScrubbingChange={setIsScrubbing}
          />
        ) : null}

        {/* Custom Controls via children */}
        {children ? children(api) : null}
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
