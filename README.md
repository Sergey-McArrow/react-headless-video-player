# react-headless-video-player

[![npm version](https://badge.fury.io/js/react-headless-video-player.svg)](https://www.npmjs.com/package/react-headless-video-player)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Headless, customizable React video player with shared context to ensure only one
video plays at a time.

- **Headless by default when using render-props**: you fully control the UI via `children(api)`.
- **Native CSS built-in controls**: omit `children` to get ready-to-use controls powered by semantic `.rhvp-*` classes and `--rhvp-*` CSS Custom Properties — **zero Tailwind dependency**.
- **Single active playback**: global `VideoProvider` coordinates play/pause across the page (including `autoPlay`).
- **Interactive timeline**: pointer drag scrubbing (`onPointerDown`/`Move`/`Up`), buffered progress bar (`buffered`), keyboard shortcuts (`Space`/`K`, `M`, `F`, `ArrowLeft`/`ArrowRight`), and optional `autoHideControls`.
- **SSR-friendly**: lazy-loads video source on visibility via `IntersectionObserver` and ships with `'use client'` banner.

## Installation

Using Bun:

```sh
bun add react-headless-video-player
```

Peer dependencies:

- **react >=18**
- **react-dom >=18**

## Quick start (Headless Render-Prop)

Wrap your app with `VideoProvider` and use the `VideoPlayer` render-prop API to
build your custom UI. When `children` is provided, built-in controls are
automatically hidden unless `showControls={true}` is explicitly passed.

```tsx
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

export default function Page() {
  return (
    <VideoProvider>
      <VideoPlayer src="/video/clip-1.mp4" poster="/video/poster-clip-1.png">
        {({
          isPlaying,
          togglePlay,
          isMuted,
          toggleMute,
          progress,
          buffered,
          seekPercent,
          currentTime,
          formatTime,
        }) => (
          <div className="my-custom-controls">
            <button
              type="button"
              onClick={togglePlay}
              aria-pressed={isPlaying}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-pressed={isMuted}
            >
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <div
              role="slider"
              aria-label="Seek video"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              tabIndex={0}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                seekPercent((x / rect.width) * 100)
              }}
            >
              <div style={{ width: `${buffered}%`, opacity: 0.35 }} />
              <div style={{ width: `${progress}%` }} />
            </div>

            <div>{formatTime(currentTime)}</div>
          </div>
        )}
      </VideoPlayer>
    </VideoProvider>
  )
}
```

### Built-in Controls (Zero-Config Native CSS)

For quick setup, omit `children` and built-in controls render automatically.
Lightweight native CSS (~1 KB) is injected automatically on mount, or can be
imported explicitly via `import 'react-headless-video-player/styles.css'`.

```tsx
import { VideoProvider, VideoPlayer } from 'react-headless-video-player'

export default function SimpleVideo() {
  return (
    <VideoProvider>
      <VideoPlayer
        src="/video/clip-1.mp4"
        poster="/video/poster-clip-1.png"
        style={{ width: '100%', aspectRatio: '16 / 9' }}
      />
    </VideoProvider>
  )
}
```

### Custom Colors & Themes (CSS Custom Properties)

Customize built-in controls via the `controlsTheme` prop or by overriding `--rhvp-*` CSS variables in your stylesheet:

```tsx
<VideoPlayer
  src="/video/clip-1.mp4"
  controlsTheme={{
    primary: '#ff6b6b', // Sets --rhvp-primary (icons & progress bar)
    background: 'rgba(0, 0, 0, 0.7)', // Sets --rhvp-bg (button background)
    text: '#ffffff', // Sets --rhvp-text (time label)
    hover: 'rgba(0, 0, 0, 0.9)', // Sets --rhvp-hover (button hover background)
  }}
  playButtonPosition="center" // 'center' | 'top-right' | 'bottom-left' | 'bottom-right'
  autoHideControls
/>
```

Or in your own CSS:

```css
.rhvp-container {
  --rhvp-primary: #10b981;
  --rhvp-bg: rgba(15, 23, 42, 0.75);
  --rhvp-hover: rgba(15, 23, 42, 0.95);
  --rhvp-text: #f8fafc;
}
```

## API

### `VideoProvider`

Context provider that ensures a single video plays at a time.

### `useVideoContext()`

Hook to access the shared playback state. Throws if used outside `VideoProvider`.

```ts
const {
  currentlyPlayingId,
  setCurrentlyPlayingId,
  playVideo,
  pauseVideo,
} = useVideoContext()
```

### `VideoPlayer`

Supports `ref` forwarding to the underlying `HTMLVideoElement`.

- **Props (`VideoPlayerProps`)**:
  - `src: string` – required video source URL
  - `autoPlay?: boolean` – default `true`
  - `muted?: boolean` – default `true`
  - `videoId?: string` – stable ID; auto-generated via `useId()` when omitted
  - `poster?: string` – poster image URL
  - `loop?: boolean` – default `false`
  - `preload?: 'none' | 'metadata' | 'auto'` – default `'metadata'`
  - `playsInline?: boolean` – default `true`
  - `pauseWhenOutOfView?: boolean` – default `false`; pauses playback when scrolled out of view
  - `showControls?: boolean` – default `true` when `children` is omitted, `false` when `children` is provided
  - `autoHideControls?: boolean` – default `false`; hides controls after inactivity while playing
  - `autoHideDelay?: number` – default `2500` (ms)
  - `enableHotkeys?: boolean` – default `true`; enables `Space`/`K`, `M`, `F`, `ArrowLeft`/`ArrowRight`
  - `controlsTheme?: ControlsTheme` – `{ primary?, background?, text?, hover? }`
  - `playButtonPosition?: 'center' | 'top-right' | 'bottom-left' | 'bottom-right'` – default `'top-right'`
  - `tracks?: VideoTrack[]` – subtitle/caption `<track>` items
  - `videoProps?: React.VideoHTMLAttributes<HTMLVideoElement>` – extra attributes forwarded to `<video>`
  - `onPlay?: () => void`
  - `onPause?: () => void`
  - `onEnded?: () => void`
  - `onTimeUpdate?: (currentTime: number, progress: number) => void`
  - `onLoadedMetadata?: (duration: number) => void`
  - `onError?: (error: MediaError | null) => void`
  - `children?: (api: VideoPlayerApi) => React.ReactNode` – render-prop function

- **Render-prop API (`VideoPlayerApi`)**:
  - `id: string`
  - `isLoaded: boolean`
  - `isVisible: boolean`
  - `isPlaying: boolean`
  - `isMuted: boolean`
  - `isBuffering: boolean`
  - `isScrubbing: boolean`
  - `isFullscreen: boolean`
  - `isControlsVisible: boolean`
  - `error: MediaError | null`
  - `currentTime: number`
  - `duration: number`
  - `progress: number` (`0..100`)
  - `buffered: number` (`0..100`)
  - `volume: number` (`0..1`)
  - `playbackRate: number`
  - `play(): void`
  - `pause(): void`
  - `togglePlay(): void`
  - `toggleMute(): void`
  - `setMuted(muted: boolean): void`
  - `setVolume(volume: number): void` (`0..1`)
  - `setPlaybackRate(rate: number): void`
  - `seekTo(seconds: number): void`
  - `seekPercent(percent: number): void` (`0..100`)
  - `retry(): void`
  - `toggleFullscreen(): Promise<void>`
  - `togglePictureInPicture(): Promise<void>`
  - `formatTime(seconds: number): string`
  - `videoRef: RefObject<HTMLVideoElement>`
  - `containerRef: RefObject<HTMLDivElement>`

## License

MIT
