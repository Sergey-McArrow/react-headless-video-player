import React from 'react'
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

// Advanced example showcasing full custom controls (buffering, error retry, playbackRate, fullscreen, PiP)
export function AdvancedVideoExample() {
  return (
    <VideoProvider>
      <div style={{ maxWidth: '56rem', margin: '0 auto', padding: '1rem' }}>
        <VideoPlayer
          src="/videos/sample.mp4"
          autoPlay={false}
          autoHideControls={true}
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
            isMuted,
            toggleMute,
            isBuffering,
            isControlsVisible,
            error,
            retry,
            currentTime,
            duration,
            formatTime,
            progress,
            buffered,
            playbackRate,
            setPlaybackRate,
            seekPercent,
            toggleFullscreen,
            togglePictureInPicture,
            isLoaded,
          }) => (
            <>
              {/* Loading / Buffering state */}
              {(!isLoaded || isBuffering) && !error && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(17, 24, 39, 0.5)',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                  }}
                >
                  Loading...
                </div>
              )}

              {/* Error state with Retry button */}
              {error && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(17, 24, 39, 0.85)',
                    color: '#ffffff',
                    gap: '0.75rem',
                  }}
                >
                  <span>Playback failed</span>
                  <button
                    type="button"
                    onClick={retry}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Controls overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.75), transparent 40%, rgba(0,0,0,0.3))',
                  opacity: isControlsVisible ? 1 : 0,
                  transition: 'opacity 250ms ease',
                  pointerEvents: isControlsVisible ? 'auto' : 'none',
                }}
              >
                {/* Bottom controls */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1rem',
                  }}
                >
                  {/* Progress bar with buffered indicator */}
                  <div
                    role="slider"
                    aria-label="Seek video"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    tabIndex={0}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      if (!rect.width) return
                      const x = e.clientX - rect.left
                      seekPercent((x / rect.width) * 100)
                    }}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
                        backgroundColor: '#3b82f6',
                      }}
                    />
                  </div>

                  {/* Control buttons row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: '#ffffff',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button type="button" onClick={togglePlay}>
                        {isPlaying ? 'Pause' : 'Play'}
                      </button>
                      <button type="button" onClick={toggleMute}>
                        {isMuted ? 'Unmute' : 'Mute'}
                      </button>
                      <span>
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() =>
                          setPlaybackRate(playbackRate === 1 ? 1.5 : 1)
                        }
                      >
                        {playbackRate}x
                      </button>
                      <button type="button" onClick={togglePictureInPicture}>
                        PiP
                      </button>
                      <button type="button" onClick={toggleFullscreen}>
                        Fullscreen
                      </button>
                    </div>
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
