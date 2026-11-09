import React from 'react'
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

// Examples of using built-in controls with native CSS & CSS Variables

export function DefaultControls() {
  return (
    <VideoProvider>
      <div style={{ width: '100%', maxWidth: '42rem' }}>
        {/* Built-in controls are displayed by default */}
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9' }}
        />
      </div>
    </VideoProvider>
  )
}

export function CustomColorControls() {
  return (
    <VideoProvider>
      <div style={{ width: '100%', maxWidth: '42rem' }}>
        {/* Custom colors via CSS values (mapped to --rhvp-* variables) */}
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9' }}
          controlsTheme={{
            primary: '#ff6b6b',
            background: 'rgba(0, 0, 0, 0.65)',
            text: '#ffffff',
            hover: 'rgba(0, 0, 0, 0.85)',
          }}
        />
      </div>
    </VideoProvider>
  )
}

export function DifferentButtonPositions() {
  return (
    <VideoProvider>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '1rem',
        }}
      >
        <VideoPlayer
          src="/video/demo1.mp4"
          style={{ aspectRatio: '16 / 9' }}
          playButtonPosition="center"
          controlsTheme={{ primary: '#10b981' }}
        />

        <VideoPlayer
          src="/video/demo2.mp4"
          style={{ aspectRatio: '16 / 9' }}
          playButtonPosition="top-right"
          controlsTheme={{ primary: '#f59e0b' }}
        />

        <VideoPlayer
          src="/video/demo3.mp4"
          style={{ aspectRatio: '16 / 9' }}
          playButtonPosition="bottom-left"
          controlsTheme={{ primary: '#ef4444' }}
        />

        <VideoPlayer
          src="/video/demo4.mp4"
          style={{ aspectRatio: '16 / 9' }}
          playButtonPosition="bottom-right"
          controlsTheme={{ primary: '#8b5cf6' }}
        />
      </div>
    </VideoProvider>
  )
}

export function NoControls() {
  return (
    <VideoProvider>
      <div style={{ width: '100%', maxWidth: '42rem' }}>
        <VideoPlayer
          src="/video/demo.mp4"
          style={{ aspectRatio: '16 / 9' }}
          showControls={false}
        />
      </div>
    </VideoProvider>
  )
}
