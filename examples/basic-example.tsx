import React from 'react'
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

// Basic example with custom render-prop controls using native inline styles
export function BasicVideoExample() {
  return (
    <VideoProvider>
      <div style={{ maxWidth: '42rem', margin: '0 auto', padding: '1rem' }}>
        <VideoPlayer
          src="/videos/sample.mp4"
          poster="/images/poster.jpg"
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            backgroundColor: '#000',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
        >
          {({
            isPlaying,
            togglePlay,
            currentTime,
            formatTime,
            progress,
            buffered,
          }) => (
            <>
              {/* Center Play/Pause overlay button */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause video' : 'Play video'}
                  aria-pressed={isPlaying}
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    color: '#ffffff',
                    padding: '1rem',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? (
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg
                      width="24"
                      height="24"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M6 4L18 12L6 20V4Z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Bottom progress bar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background:
                    'linear-gradient(to top, rgba(0, 0, 0, 0.65), transparent)',
                  padding: '1rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <div
                    style={{
                      position: 'relative',
                      flex: 1,
                      height: '0.25rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      borderRadius: '9999px',
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
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: '#ffffff',
                        transition: 'width 150ms linear',
                      }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </VideoPlayer>
      </div>
    </VideoProvider>
  )
}
