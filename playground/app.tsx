import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  PlayButtonPosition,
  VideoPlayer,
  VideoProvider,
  useVideoContext,
} from '../src'

const SAMPLE_VIDEOS = [
  {
    id: 'bbb',
    title: 'Big Buck Bunny (MDN Sample)',
    src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'w3c',
    title: 'Bear in Nature (W3Schools Sample)',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
]

function GlobalStatusBanner() {
  const { currentlyPlayingId, pauseVideo } = useVideoContext()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.25rem',
        backgroundColor: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '0.75rem',
        marginBottom: '1.5rem',
      }}
    >
      <div>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Active Player ID in Context:{' '}
        </span>
        <strong
          data-testid="active-player-id"
          style={{
            color: currentlyPlayingId ? '#a3e635' : '#64748b',
            fontFamily: 'monospace',
          }}
        >
          {currentlyPlayingId || 'none'}
        </strong>
      </div>
      {currentlyPlayingId && (
        <button
          type="button"
          onClick={() => pauseVideo()}
          style={{
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          Pause All
        </button>
      )}
    </div>
  )
}

function PlaygroundApp() {
  const [primaryColor, setPrimaryColor] = useState('#a3e635')
  const [position, setPosition] = useState<PlayButtonPosition>('top-right')
  const [autoHide, setAutoHide] = useState(false)

  return (
    <VideoProvider>
      <div
        style={{
          maxWidth: '64rem',
          margin: '0 auto',
          padding: '2rem 1.5rem',
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#f8fafc',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
          react-headless-video-player v0.2.0 — Live Playground
        </h1>
        <p style={{ color: '#94a3b8', marginTop: 0, marginBottom: '1.5rem' }}>
          Native CSS Variables, Pointer Scrubbing, Single Active Playback,
          Hotkeys (K / Space / M / F / Arrows)
        </p>

        <GlobalStatusBanner />

        {/* Section 1: Built-in Controls + Interactive Theme & Position */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            1. Built-in Controls (Native CSS & Theme Customizer)
          </h2>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              padding: '0.875rem 1rem',
              backgroundColor: '#1e293b',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Primary Color:
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                style={{ cursor: 'pointer' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Button Position:
              <select
                value={position}
                onChange={(e) =>
                  setPosition(e.target.value as PlayButtonPosition)
                }
                style={{
                  backgroundColor: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  padding: '0.25rem 0.5rem',
                }}
              >
                <option value="top-right">top-right</option>
                <option value="center">center</option>
                <option value="bottom-left">bottom-left</option>
                <option value="bottom-right">bottom-right</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoHide}
                onChange={(e) => setAutoHide(e.target.checked)}
              />
              Auto-hide controls (2.5s)
            </label>
          </div>

          <VideoPlayer
            videoId="builtin-demo"
            src={SAMPLE_VIDEOS[0].src}
            autoPlay={false}
            tabIndex={0}
            playButtonPosition={position}
            autoHideControls={autoHide}
            controlsTheme={{
              primary: primaryColor,
              background: 'rgba(15, 23, 42, 0.7)',
              hover: 'rgba(15, 23, 42, 0.92)',
              text: '#f8fafc',
            }}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#000',
            }}
          />
        </section>

        {/* Section 2: Headless Render-Prop Player */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
            2. Headless Render-Prop API (Custom UI, Speed, Volume, Fullscreen)
          </h2>

          <VideoPlayer
            videoId="headless-demo"
            src={SAMPLE_VIDEOS[1].src}
            autoPlay={false}
            tabIndex={0}
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              backgroundColor: '#000',
            }}
          >
            {({
              isPlaying,
              togglePlay,
              isMuted,
              toggleMute,
              volume,
              setVolume,
              playbackRate,
              setPlaybackRate,
              currentTime,
              duration,
              progress,
              buffered,
              seekPercent,
              toggleFullscreen,
              formatTime,
            }) => (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1rem',
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
                }}
              >
                {/* Custom Timeline */}
                <div
                  role="slider"
                  aria-label="Custom Seek"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  tabIndex={0}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    if (!rect.width) return
                    seekPercent(((e.clientX - rect.left) / rect.width) * 100)
                  }}
                  style={{
                    position: 'relative',
                    height: '0.5rem',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    marginBottom: '0.75rem',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${buffered}%`,
                      backgroundColor: 'rgba(255,255,255,0.35)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: '#38bdf8',
                    }}
                  />
                </div>

                {/* Controls Bar */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.625rem',
                    }}
                  >
                    <button
                      type="button"
                      onClick={togglePlay}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        backgroundColor: '#38bdf8',
                        color: '#0f172a',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {isPlaying ? 'Pause' : 'Play'}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMute}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #475569',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {isMuted ? 'Unmute' : 'Mute'}
                    </button>

                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      aria-label="Volume"
                      style={{ width: '5rem', cursor: 'pointer' }}
                    />

                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {[1, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setPlaybackRate(rate)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          border: '1px solid #475569',
                          backgroundColor:
                            playbackRate === rate ? '#38bdf8' : 'transparent',
                          color: playbackRate === rate ? '#0f172a' : '#fff',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {rate}x
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #475569',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      Fullscreen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </VideoPlayer>
        </section>
      </div>
    </VideoProvider>
  )
}

const rootEl = document.getElementById('root')
if (rootEl) {
  createRoot(rootEl).render(<PlaygroundApp />)
}

