// Example: Correct usage in Next.js to avoid context errors
import React from 'react'
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

// ❌ WRONG: Using VideoPlayer without VideoProvider throws an error
export function IncorrectUsage() {
  return (
    <div>
      <VideoPlayer src="/video.mp4">
        {({ isPlaying, togglePlay }) => (
          <button type="button" onClick={togglePlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </VideoPlayer>
    </div>
  )
}

// ✅ CORRECT: Wrap with VideoProvider
export function CorrectUsage() {
  return (
    <VideoProvider>
      <div>
        <VideoPlayer src="/video.mp4">
          {({ isPlaying, togglePlay }) => (
            <button type="button" onClick={togglePlay}>
              {isPlaying ? 'Pause' : 'Play'}
            </button>
          )}
        </VideoPlayer>
      </div>
    </VideoProvider>
  )
}

// ✅ BEST PRACTICE: Provider at app level (Next.js App Router)
// In your app/layout.tsx:
/*
import { VideoProvider } from 'react-headless-video-player'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <VideoProvider>
          {children}
        </VideoProvider>
      </body>
    </html>
  )
}
*/

export function VideoPage() {
  return (
    <div>
      <h1>My Video Page</h1>
      <VideoPlayer
        src="/videos/demo.mp4"
        poster="/images/poster.jpg"
        style={{ width: '100%', aspectRatio: '16 / 9' }}
      />
    </div>
  )
}
