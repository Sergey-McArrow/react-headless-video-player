import React from 'react'
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

// Simple example - built-in controls are displayed automatically with native CSS
export function SimpleExample() {
  return (
    <VideoProvider>
      <div style={{ maxWidth: '56rem', margin: '0 auto', width: '100%' }}>
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9', borderRadius: '0.5rem', overflow: 'hidden' }}
        />
      </div>
    </VideoProvider>
  )
}

// Example with custom colors via CSS variables (controlsTheme)
export function CustomThemeColors() {
  return (
    <VideoProvider>
      <div style={{ maxWidth: '56rem', margin: '0 auto', width: '100%' }}>
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9', borderRadius: '0.5rem', overflow: 'hidden' }}
          controlsTheme={{
            primary: '#ff6b6b', // Red color for buttons and progress bar (--rhvp-primary)
            background: 'rgba(0, 0, 0, 0.65)', // Semi-transparent button background (--rhvp-bg)
            text: '#ffffff', // White time text (--rhvp-text)
            hover: 'rgba(0, 0, 0, 0.85)', // Darker button background on hover (--rhvp-hover)
          }}
          playButtonPosition="center"
          autoHideControls
        />
      </div>
    </VideoProvider>
  )
}

// Example without built-in controls (Headless Render-Prop)
export function NoBuiltInControls() {
  return (
    <VideoProvider>
      <div style={{ maxWidth: '56rem', margin: '0 auto', width: '100%' }}>
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9', borderRadius: '0.5rem', overflow: 'hidden' }}
        >
          {({ isPlaying, togglePlay, currentTime, formatTime }) => (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={togglePlay}
                  style={{
                    marginBottom: '1rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <div
                  style={{
                    color: '#ffffff',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                  }}
                >
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          )}
        </VideoPlayer>
      </div>
    </VideoProvider>
  )
}
