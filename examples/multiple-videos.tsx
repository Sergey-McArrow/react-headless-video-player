import React from 'react'
import {
  VideoProvider,
  VideoPlayer,
  useVideoContext,
} from 'react-headless-video-player'

function VideoStatusBadge({ videoId }: { videoId: string }) {
  const { currentlyPlayingId } = useVideoContext()
  const isPlaying = currentlyPlayingId === videoId
  return (
    <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
      {isPlaying ? 'Playing' : 'Paused'}
    </span>
  )
}

// Example showing multiple videos with single playback coordination
export function MultipleVideosExample() {
  const videos = [
    { id: 'video-1', src: '/videos/clip-1.mp4', title: 'First Video' },
    { id: 'video-2', src: '/videos/clip-2.mp4', title: 'Second Video' },
    { id: 'video-3', src: '/videos/clip-3.mp4', title: 'Third Video' },
  ]

  return (
    <VideoProvider>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Video Gallery
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))',
            gap: '1.5rem',
          }}
        >
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
              }}
            >
              <VideoPlayer
                videoId={video.id}
                src={video.src}
                autoPlay={false}
                style={{
                  aspectRatio: '16 / 9',
                  backgroundColor: '#111827',
                }}
              />

              <div
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <h3 style={{ fontWeight: 600, fontSize: '1.125rem', margin: 0 }}>
                  {video.title}
                </h3>
                <VideoStatusBadge videoId={video.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </VideoProvider>
  )
}
