import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { GlobalWindow } from 'happy-dom'
import { act, createRef } from 'react'
import { createRoot, Root } from 'react-dom/client'
import {
  RHVP_STYLE_ID,
  VideoPlayer,
  VideoPlayerApi,
  VideoProvider,
  ensureStylesInjected,
  formatVideoTime,
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

describe('react-headless-video-player comprehensive suite', () => {
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
      HTMLInputElement: windowInstance.HTMLInputElement,
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

  describe('1. formatVideoTime', () => {
    it('formats seconds into m:ss', () => {
      expect(formatVideoTime(0)).toBe('0:00')
      expect(formatVideoTime(9)).toBe('0:09')
      expect(formatVideoTime(65)).toBe('1:05')
      expect(formatVideoTime(600)).toBe('10:00')
    })

    it('handles invalid or negative values safely', () => {
      expect(formatVideoTime(-5)).toBe('0:00')
      expect(formatVideoTime(Number.NaN)).toBe('0:00')
      expect(formatVideoTime(Number.POSITIVE_INFINITY)).toBe('0:00')
    })
  })

  describe('2. VideoProvider & useVideoContext', () => {
    it('throws when useVideoContext is used outside VideoProvider', () => {
      const BrokenConsumer = () => {
        useVideoContext()
        return null
      }

      expect(() => {
        act(() => {
          root.render(<BrokenConsumer />)
        })
      }).toThrow('useVideoContext must be used within a VideoProvider')
    })

    it('supports playVideo and pauseVideo(id) / pauseVideo()', () => {
      let ctxValue: ReturnType<typeof useVideoContext> | undefined
      const Consumer = () => {
        ctxValue = useVideoContext()
        return null
      }

      act(() => {
        root.render(
          <VideoProvider>
            <Consumer />
          </VideoProvider>,
        )
      })

      expect(ctxValue?.currentlyPlayingId).toBeNull()

      act(() => {
        ctxValue?.playVideo('v1')
      })
      expect(ctxValue?.currentlyPlayingId).toBe('v1')

      // Pausing a different id does not stop v1
      act(() => {
        ctxValue?.pauseVideo('v2')
      })
      expect(ctxValue?.currentlyPlayingId).toBe('v1')

      // Pausing v1 stops it
      act(() => {
        ctxValue?.pauseVideo('v1')
      })
      expect(ctxValue?.currentlyPlayingId).toBeNull()

      // Pausing without id stops any active video
      act(() => {
        ctxValue?.playVideo('v3')
      })
      expect(ctxValue?.currentlyPlayingId).toBe('v3')
      act(() => {
        ctxValue?.pauseVideo()
      })
      expect(ctxValue?.currentlyPlayingId).toBeNull()
    })
  })

  describe('3. Native CSS & Controls customization', () => {
    it('injects native stylesheet once into document.head and renders semantic rhvp-* classes', () => {
      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/demo.mp4" />
            <VideoPlayer src="/demo2.mp4" />
          </VideoProvider>,
        )
      })

      // Idempotency check
      ensureStylesInjected()
      const styleEls = document.querySelectorAll(`#${RHVP_STYLE_ID}`)
      expect(styleEls.length).toBe(1)
      expect(styleEls[0]?.textContent).toContain('.rhvp-container')

      const buttons = container.querySelectorAll('.rhvp-btn')
      expect(buttons.length).toBe(4) // 2 per player
      expect(container.querySelector('.rhvp-progress-track')).not.toBeNull()
      expect(container.querySelector('.rhvp-progress-buffered')).not.toBeNull()
      expect(container.querySelector('.rhvp-progress-fill')).not.toBeNull()
    })

    it('hides built-in controls automatically when render-prop children is provided, unless showControls={true}', () => {
      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/demo.mp4">
              {({ isPlaying, togglePlay }) => (
                <button
                  type="button"
                  data-testid="custom-btn"
                  onClick={togglePlay}
                >
                  {isPlaying ? 'Custom Pause' : 'Custom Play'}
                </button>
              )}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      expect(container.querySelectorAll('.rhvp-btn').length).toBe(0)
      expect(
        container.querySelector('[data-testid="custom-btn"]'),
      ).not.toBeNull()

      // Now explicitly enable showControls alongside children
      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/demo.mp4" showControls={true}>
              {() => <div data-testid="custom-overlay">Overlay</div>}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      expect(container.querySelectorAll('.rhvp-btn').length).toBe(2)
      expect(
        container.querySelector('[data-testid="custom-overlay"]'),
      ).not.toBeNull()
    })

    it('applies controlsTheme CSS variables and all playButtonPosition modifier classes', () => {
      const positions = [
        'center',
        'top-right',
        'bottom-left',
        'bottom-right',
      ] as const

      for (const pos of positions) {
        act(() => {
          root.render(
            <VideoProvider>
              <VideoPlayer
                src="/demo.mp4"
                playButtonPosition={pos}
                controlsTheme={{
                  primary: '#ff6b6b',
                  background: 'rgba(0, 0, 0, 0.8)',
                  text: '#123456',
                  hover: 'rgba(0, 0, 0, 0.95)',
                }}
              />
            </VideoProvider>,
          )
        })

        const playerContainer = container.querySelector(
          '.rhvp-container',
        ) as HTMLDivElement
        expect(playerContainer.style.getPropertyValue('--rhvp-primary')).toBe(
          '#ff6b6b',
        )
        expect(playerContainer.style.getPropertyValue('--rhvp-bg')).toBe(
          'rgba(0, 0, 0, 0.8)',
        )
        expect(playerContainer.style.getPropertyValue('--rhvp-text')).toBe(
          '#123456',
        )
        expect(playerContainer.style.getPropertyValue('--rhvp-hover')).toBe(
          'rgba(0, 0, 0, 0.95)',
        )

        expect(container.querySelector(`.rhvp-btn-wrap--${pos}`)).not.toBeNull()

        const expectedMuteClass =
          pos === 'top-right'
            ? '.rhvp-btn-wrap--mute-offset'
            : '.rhvp-btn-wrap--mute-top'
        expect(container.querySelector(expectedMuteClass)).not.toBeNull()
      }
    })
  })

  describe('4. Single active playback, autoPlay & pauseWhenOutOfView', () => {
    it('coordinates autoPlay across multiple videos so only one plays at a time', () => {
      const apis: Record<string, VideoPlayerApi> = {}

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer videoId="v1" src="/v1.mp4" autoPlay={true}>
              {(api) => {
                apis.v1 = api
                return null
              }}
            </VideoPlayer>
            <VideoPlayer videoId="v2" src="/v2.mp4" autoPlay={true}>
              {(api) => {
                apis.v2 = api
                return null
              }}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      act(() => {
        triggerIntersection(0, true)
      })
      expect(apis.v1?.isPlaying).toBe(true)
      expect(apis.v2?.isPlaying).toBe(false)

      act(() => {
        triggerIntersection(1, true)
      })
      expect(apis.v1?.isPlaying).toBe(false)
      expect(apis.v2?.isPlaying).toBe(true)
    })

    it('pauses playback automatically when scrolled out of view if pauseWhenOutOfView={true}', () => {
      let currentApi: VideoPlayerApi | undefined

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer
              videoId="v1"
              src="/v1.mp4"
              autoPlay={true}
              pauseWhenOutOfView={true}
            >
              {(api) => {
                currentApi = api
                return null
              }}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      act(() => {
        triggerIntersection(0, true)
      })
      expect(currentApi?.isPlaying).toBe(true)

      act(() => {
        triggerIntersection(0, false)
      })
      expect(currentApi?.isPlaying).toBe(false)
    })

    it('reloads video when src prop changes dynamically', () => {
      const renderWithSrc = (src: string) => (
        <VideoProvider>
          <VideoPlayer videoId="v1" src={src} autoPlay={false} />
        </VideoProvider>
      )

      act(() => {
        root.render(renderWithSrc('/first.mp4'))
      })
      act(() => {
        triggerIntersection(0, true)
      })

      const video = container.querySelector('video') as HTMLVideoElement
      expect(video.src).toContain('/first.mp4')

      act(() => {
        root.render(renderWithSrc('/second.mp4'))
      })
      expect(video.src).toContain('/second.mp4')
    })
  })

  describe('5. Timeline Scrubbing, Buffering, Volume, PlaybackRate & Native Events', () => {
    it('updates buffered, duration, currentTime, progress, volume, and playbackRate', () => {
      let currentApi: VideoPlayerApi | undefined
      const onLoadedMetadata = mock(() => {})
      const onTimeUpdate = mock(() => {})
      const onEnded = mock(() => {})

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer
              src="/demo.mp4"
              autoPlay={false}
              onLoadedMetadata={onLoadedMetadata}
              onTimeUpdate={onTimeUpdate}
              onEnded={onEnded}
            >
              {(api) => {
                currentApi = api
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
      Object.defineProperty(video, 'duration', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(video, 'buffered', {
        value: {
          length: 1,
          start: () => 0,
          end: () => 100,
        },
        configurable: true,
      })

      act(() => {
        video.dispatchEvent(new Event('loadedmetadata'))
      })
      expect(currentApi?.duration).toBe(200)
      expect(currentApi?.buffered).toBe(50)
      expect(onLoadedMetadata).toHaveBeenCalledWith(200)

      // Seek via seekTo and seekPercent
      act(() => {
        currentApi?.seekTo(50)
      })
      expect(currentApi?.currentTime).toBe(50)
      expect(currentApi?.progress).toBe(25)

      act(() => {
        currentApi?.seekPercent(75)
      })
      expect(currentApi?.currentTime).toBe(150)
      expect(currentApi?.progress).toBe(75)

      // Volume & PlaybackRate
      act(() => {
        currentApi?.setVolume(0.4)
        currentApi?.setPlaybackRate(1.5)
      })
      expect(currentApi?.volume).toBe(0.4)
      expect(currentApi?.isMuted).toBe(false) // Setting volume > 0 unmutes
      expect(currentApi?.playbackRate).toBe(1.5)

      // Buffering events
      act(() => {
        video.dispatchEvent(new Event('waiting'))
      })
      expect(currentApi?.isBuffering).toBe(true)

      act(() => {
        video.dispatchEvent(new Event('playing'))
      })
      expect(currentApi?.isBuffering).toBe(false)

      // Ended event
      act(() => {
        currentApi?.play()
      })
      expect(currentApi?.isPlaying).toBe(true)

      act(() => {
        video.dispatchEvent(new Event('ended'))
      })
      expect(currentApi?.isPlaying).toBe(false)
      expect(currentApi?.progress).toBe(0)
      expect(onEnded).toHaveBeenCalled()
    })

    it('supports pointer dragging (scrubbing) on built-in progress bar', () => {
      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/demo.mp4" autoPlay={false} />
          </VideoProvider>,
        )
      })

      act(() => {
        triggerIntersection(0, true)
      })

      const video = container.querySelector('video') as HTMLVideoElement
      Object.defineProperty(video, 'duration', {
        value: 100,
        configurable: true,
      })
      act(() => {
        video.dispatchEvent(new Event('loadedmetadata'))
      })

      const track = container.querySelector(
        '.rhvp-progress-track',
      ) as HTMLDivElement
      track.getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          width: 200,
          height: 8,
          right: 200,
          bottom: 8,
          x: 0,
          y: 0,
          toJSON: () => {},
        }) as DOMRect

      act(() => {
        track.dispatchEvent(
          new windowInstance.MouseEvent('pointerdown', {
            clientX: 50,
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(video.currentTime).toBe(25)

      act(() => {
        track.dispatchEvent(
          new windowInstance.MouseEvent('pointermove', {
            clientX: 150,
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(video.currentTime).toBe(75)

      act(() => {
        track.dispatchEvent(
          new windowInstance.MouseEvent('pointerup', {
            clientX: 150,
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(track.getAttribute('aria-valuenow')).toBe('75')
    })
  })

  describe('6. Auto-hide controls, Hotkeys, Error/Retry, forwardRef & Tracks', () => {
    it('hides controls after autoHideDelay while playing and shows on mousemove', async () => {
      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer
              src="/demo.mp4"
              autoPlay={true}
              autoHideControls={true}
              autoHideDelay={40}
            />
          </VideoProvider>,
        )
      })

      act(() => {
        triggerIntersection(0, true)
      })

      const controls = container.querySelector(
        '.rhvp-controls',
      ) as HTMLDivElement
      expect(controls.classList.contains('rhvp-controls--hidden')).toBe(false)

      await act(async () => {
        await new Promise((r) => setTimeout(r, 60))
      })
      expect(controls.classList.contains('rhvp-controls--hidden')).toBe(true)

      const playerContainer = container.querySelector(
        '.rhvp-container',
      ) as HTMLDivElement
      act(() => {
        playerContainer.dispatchEvent(
          new windowInstance.MouseEvent('mousemove', {
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(controls.classList.contains('rhvp-controls--hidden')).toBe(false)
    })

    it('handles media error event and retry()', () => {
      let currentApi: VideoPlayerApi | undefined
      const onError = mock(() => {})

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/broken.mp4" autoPlay={false} onError={onError}>
              {(api) => {
                currentApi = api
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
      const fakeError = { code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED' }
      Object.defineProperty(video, 'error', {
        value: fakeError,
        configurable: true,
      })

      act(() => {
        video.dispatchEvent(new Event('error'))
      })
      expect(currentApi?.error).toEqual(fakeError as unknown as MediaError)
      expect(onError).toHaveBeenCalled()

      act(() => {
        currentApi?.retry()
      })
      expect(currentApi?.error).toBeNull()
    })

    it('supports forwardRef, videoProps, and subtitle tracks', () => {
      const videoRef = createRef<HTMLVideoElement>()

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer
              ref={videoRef}
              src="/demo.mp4"
              videoProps={{ crossOrigin: 'anonymous' }}
              tracks={[
                {
                  src: '/subs-en.vtt',
                  srclang: 'en',
                  label: 'English',
                  default: true,
                },
              ]}
            />
          </VideoProvider>,
        )
      })

      expect(videoRef.current).not.toBeNull()
      expect(videoRef.current?.getAttribute('crossorigin')).toBe('anonymous')

      const track = container.querySelector('track')
      expect(track).not.toBeNull()
      expect(track?.getAttribute('srclang')).toBe('en')
      expect(track?.getAttribute('label')).toBe('English')
    })

    it('toggles play and mute via keyboard shortcuts when focused, and ignores inputs', () => {
      let currentApi: VideoPlayerApi | undefined

      act(() => {
        root.render(
          <VideoProvider>
            <VideoPlayer src="/demo.mp4" autoPlay={false} tabIndex={0}>
              {(api) => {
                currentApi = api
                return <input data-testid="inner-input" />
              }}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      const playerContainer = container.querySelector(
        '.rhvp-container',
      ) as HTMLDivElement
      const innerInput = container.querySelector(
        '[data-testid="inner-input"]',
      ) as HTMLInputElement

      // Typing 'k' inside an <input> should NOT trigger play
      act(() => {
        innerInput.dispatchEvent(
          new windowInstance.KeyboardEvent('keydown', {
            key: 'k',
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(currentApi?.isPlaying).toBe(false)

      // Pressing 'k' on the player container toggles play
      act(() => {
        playerContainer.dispatchEvent(
          new windowInstance.KeyboardEvent('keydown', {
            key: 'k',
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(currentApi?.isPlaying).toBe(true)

      // Pressing 'm' toggles mute
      act(() => {
        playerContainer.dispatchEvent(
          new windowInstance.KeyboardEvent('keydown', {
            key: 'm',
            bubbles: true,
          }) as unknown as Event,
        )
      })
      expect(currentApi?.isMuted).toBe(false)
    })
  })

  describe('7. Bundle & CJS/ESM runtime export verification', () => {
    it('includes "use client" in JS bundles, exports dist/styles.css, and imports cleanly from dist', async () => {
      const esmFile = await Bun.file('dist/index.js').text()
      const cjsFile = await Bun.file('dist/index.cjs').text()
      const cssFile = await Bun.file('dist/styles.css').text()

      expect(esmFile.startsWith("'use client';")).toBe(true)
      expect(cjsFile.startsWith("'use client';")).toBe(true)
      expect(cssFile).toContain('.rhvp-container')
      expect(cssFile).toContain('--rhvp-primary')

      const distEsm = await import('../dist/index.js')
      expect(typeof distEsm.VideoPlayer).toBe('object') // forwardRef object
      expect(typeof distEsm.VideoProvider).toBe('function')
      expect(typeof distEsm.useVideoContext).toBe('function')
      expect(typeof distEsm.formatVideoTime).toBe('function')
    })

    it('runs end-to-end user interaction flow across built-in and headless players', () => {
      const StatusBanner = () => {
        const { currentlyPlayingId, pauseVideo } = useVideoContext()
        return (
          <div>
            <span data-testid="active-id">{currentlyPlayingId || 'none'}</span>
            <button
              type="button"
              data-testid="pause-all"
              onClick={() => pauseVideo()}
            >
              Pause All
            </button>
          </div>
        )
      }

      act(() => {
        root.render(
          <VideoProvider>
            <StatusBanner />
            <VideoPlayer
              videoId="player-builtin"
              src="/v1.mp4"
              autoPlay={false}
            />
            <VideoPlayer
              videoId="player-headless"
              src="/v2.mp4"
              autoPlay={false}
            >
              {({ isPlaying, togglePlay }) => (
                <button
                  type="button"
                  data-testid="headless-play"
                  onClick={togglePlay}
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
              )}
            </VideoPlayer>
          </VideoProvider>,
        )
      })

      act(() => {
        triggerIntersection(0, true)
        triggerIntersection(1, true)
      })

      const activeIdEl = container.querySelector(
        '[data-testid="active-id"]',
      ) as HTMLElement
      const builtinPlayBtn = container.querySelector(
        '.rhvp-btn--play',
      ) as HTMLButtonElement
      const headlessPlayBtn = container.querySelector(
        '[data-testid="headless-play"]',
      ) as HTMLButtonElement
      const pauseAllBtn = container.querySelector(
        '[data-testid="pause-all"]',
      ) as HTMLButtonElement

      expect(activeIdEl.textContent).toBe('none')

      // 1. User clicks built-in Play button on player 1
      act(() => {
        builtinPlayBtn.click()
      })
      expect(activeIdEl.textContent).toBe('player-builtin')
      expect(builtinPlayBtn.getAttribute('aria-pressed')).toBe('true')
      expect(headlessPlayBtn.textContent).toBe('Play')

      // 2. User clicks custom Play button on player 2 -> pauses player 1 automatically
      act(() => {
        headlessPlayBtn.click()
      })
      expect(activeIdEl.textContent).toBe('player-headless')
      expect(builtinPlayBtn.getAttribute('aria-pressed')).toBe('false')
      expect(headlessPlayBtn.textContent).toBe('Pause')

      // 3. User clicks global "Pause All" button
      act(() => {
        pauseAllBtn.click()
      })
      expect(activeIdEl.textContent).toBe('none')
      expect(builtinPlayBtn.getAttribute('aria-pressed')).toBe('false')
      expect(headlessPlayBtn.textContent).toBe('Play')
    })
  })
})
