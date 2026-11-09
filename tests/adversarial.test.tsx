import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { GlobalWindow } from 'happy-dom'
import { act } from 'react'
import { createRoot, Root } from 'react-dom/client'
import {
  VideoPlayer,
  VideoPlayerApi,
  VideoProvider,
  useVideoContext,
} from '../src'

type IntersectionCallback = (
  entries: Array<{ isIntersecting: boolean; target: Element }>,
) => void

let intersectionCallbacks: Array<{
  callback: IntersectionCallback
  elements: Set<Element>
  disconnected: boolean
}> = []

class MockIntersectionObserver {
  private record: {
    callback: IntersectionCallback
    elements: Set<Element>
    disconnected: boolean
  }

  constructor(callback: IntersectionCallback) {
    this.record = {
      callback,
      elements: new Set(),
      disconnected: false,
    }
    intersectionCallbacks.push(this.record)
  }

  observe(element: Element) {
    this.record.elements.add(element)
  }

  unobserve(element: Element) {
    this.record.elements.delete(element)
  }

  disconnect() {
    this.record.disconnected = true
    this.record.elements.clear()
  }
}

function triggerIntersection(index: number, isIntersecting = true) {
  const rec = intersectionCallbacks[index]
  if (!rec) return
  const targets = Array.from(rec.elements)
  rec.callback(
    targets.map((target) => ({
      isIntersecting,
      target,
    })),
  )
}

describe('Adversarial Resilience & Edge-Case Regression Suite', () => {
  let windowInstance: GlobalWindow
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    intersectionCallbacks = []
    windowInstance = new GlobalWindow()
    Object.assign(globalThis, {
      window: windowInstance,
      document: windowInstance.document,
      HTMLElement: windowInstance.HTMLElement,
      HTMLVideoElement: windowInstance.HTMLVideoElement,
      HTMLDivElement: windowInstance.HTMLDivElement,
      Element: windowInstance.Element,
      Event: windowInstance.Event,
      KeyboardEvent: windowInstance.KeyboardEvent,
      MouseEvent: windowInstance.MouseEvent,
      PointerEvent: windowInstance.PointerEvent || windowInstance.MouseEvent,
      IntersectionObserver: MockIntersectionObserver,
      IS_REACT_ACT_ENVIRONMENT: true,
    })

    windowInstance.HTMLVideoElement.prototype.play = mock(() =>
      Promise.resolve(),
    )
    windowInstance.HTMLVideoElement.prototype.pause = mock(() => {})
    windowInstance.HTMLVideoElement.prototype.load = mock(() => {})

    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => {
      root.unmount()
    })
    container.remove()
  })

  it('1. Unmount Cleanup: Unmounting an active VideoPlayer releases currentlyPlayingId in VideoProvider', () => {
    let contextRef: ReturnType<typeof useVideoContext> | undefined

    const ContextInspector = () => {
      contextRef = useVideoContext()
      return null
    }

    const App = ({ showVideo }: { showVideo: boolean }) => (
      <VideoProvider>
        <ContextInspector />
        {showVideo && (
          <VideoPlayer
            videoId="ephemeral-video"
            src="/v1.mp4"
            autoPlay={true}
          />
        )}
      </VideoProvider>
    )

    act(() => {
      root.render(<App showVideo={true} />)
    })
    act(() => {
      triggerIntersection(0, true)
    })

    expect(contextRef?.currentlyPlayingId).toBe('ephemeral-video')

    // Unmount the active video player while it is playing
    act(() => {
      root.render(<App showVideo={false} />)
    })

    expect(contextRef?.currentlyPlayingId).toBeNull()
  })

  it('2. Pre-Visibility Play: Calling play() before IntersectionObserver fires force-loads src and starts playback immediately', () => {
    let apiRef: VideoPlayerApi | undefined

    act(() => {
      root.render(
        <VideoProvider>
          <VideoPlayer videoId="pre-visible" src="/v1.mp4" autoPlay={false}>
            {(api) => {
              apiRef = api
              return null
            }}
          </VideoPlayer>
        </VideoProvider>,
      )
    })

    const video = container.querySelector('video') as HTMLVideoElement
    const playSpy = video.play as ReturnType<typeof mock>

    act(() => {
      apiRef?.play()
    })

    expect(apiRef?.isPlaying).toBe(true)
    expect(video.src).toContain('/v1.mp4')
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('3. Dynamic src Switch Mid-Playback: Changing src while video is playing reloads and automatically resumes playback on the new source', () => {
    const App = ({ src }: { src: string }) => (
      <VideoProvider>
        <VideoPlayer videoId="playlist-player" src={src} autoPlay={true} />
      </VideoProvider>
    )

    act(() => {
      root.render(<App src="/episode-1.mp4" />)
    })
    act(() => {
      triggerIntersection(0, true)
    })

    const video = container.querySelector('video') as HTMLVideoElement
    const playSpy = video.play as ReturnType<typeof mock>
    expect(playSpy).toHaveBeenCalledTimes(1)

    act(() => {
      root.render(<App src="/episode-2.mp4" />)
    })

    expect(video.src).toContain('/episode-2.mp4')
    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  it('4. Boundary & Non-Finite Input Guard: Passing NaN or Infinity to setVolume, seekTo, or seekPercent is safely ignored without throwing or corrupting state', () => {
    let apiRef: VideoPlayerApi | undefined

    act(() => {
      root.render(
        <VideoProvider>
          <VideoPlayer src="/v1.mp4" autoPlay={false}>
            {(api) => {
              apiRef = api
              return null
            }}
          </VideoPlayer>
        </VideoProvider>,
      )
    })
    act(() => {
      triggerIntersection(0, true)
    })

    const video = container.querySelector('video') as HTMLVideoElement
    Object.defineProperty(video, 'duration', { value: 100, configurable: true })
    act(() => {
      video.dispatchEvent(new Event('loadedmetadata'))
    })

    act(() => {
      apiRef?.setVolume(Number.NaN)
      apiRef?.seekTo(Number.NaN)
      apiRef?.seekPercent(Number.NaN)
      apiRef?.setVolume(Number.POSITIVE_INFINITY)
      apiRef?.seekTo(Number.NEGATIVE_INFINITY)
    })

    expect(Number.isNaN(apiRef?.volume)).toBe(false)
    expect(Number.isNaN(apiRef?.currentTime)).toBe(false)
    expect(Number.isNaN(apiRef?.progress)).toBe(false)
    expect(apiRef?.volume).toBe(1)
    expect(apiRef?.currentTime).toBe(0)
    expect(apiRef?.progress).toBe(0)
  })

  it('5. Error Recovery: Calling retry() after a playback error clears error state, reloads source, and resumes playback', () => {
    let apiRef: VideoPlayerApi | undefined

    act(() => {
      root.render(
        <VideoProvider>
          <VideoPlayer src="/flaky-stream.mp4" autoPlay={true}>
            {(api) => {
              apiRef = api
              return null
            }}
          </VideoPlayer>
        </VideoProvider>,
      )
    })
    act(() => {
      triggerIntersection(0, true)
    })

    const video = container.querySelector('video') as HTMLVideoElement
    const playSpy = video.play as ReturnType<typeof mock>
    expect(apiRef?.isPlaying).toBe(true)
    expect(playSpy).toHaveBeenCalledTimes(1)

    Object.defineProperty(video, 'error', {
      value: { code: 2, message: 'MEDIA_ERR_NETWORK' },
      configurable: true,
    })
    act(() => {
      video.dispatchEvent(new Event('error'))
    })
    expect(apiRef?.error).not.toBeNull()
    expect(apiRef?.isPlaying).toBe(false)

    Object.defineProperty(video, 'error', {
      value: null,
      configurable: true,
    })
    act(() => {
      apiRef?.retry()
    })

    expect(apiRef?.error).toBeNull()
    expect(apiRef?.isPlaying).toBe(true)
    expect(playSpy).toHaveBeenCalledTimes(2)
  })
})
