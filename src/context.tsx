'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

export type VideoContextValue = {
  currentlyPlayingId: string | null
  setCurrentlyPlayingId: React.Dispatch<React.SetStateAction<string | null>>
  playVideo: (id: string) => void
  pauseVideo: (id?: string) => void
}

// Lazy initialization to avoid SSR issues
let VideoContext: React.Context<VideoContextValue | undefined> | undefined

const getVideoContext = () => {
  if (!VideoContext) {
    VideoContext = createContext<VideoContextValue | undefined>(undefined)
  }
  return VideoContext
}

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(
    null
  )

  const playVideo = useCallback((id: string) => {
    setCurrentlyPlayingId(id)
  }, [])

  const pauseVideo = useCallback((id?: string) => {
    setCurrentlyPlayingId((prev) => {
      if (id === undefined || prev === id) {
        return null
      }
      return prev
    })
  }, [])

  const value = useMemo(
    () => ({
      currentlyPlayingId,
      setCurrentlyPlayingId,
      playVideo,
      pauseVideo,
    }),
    [currentlyPlayingId, playVideo, pauseVideo]
  )

  const Context = getVideoContext()
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useVideoContext = (): VideoContextValue => {
  const Context = getVideoContext()
  const context = useContext(Context)
  if (!context) {
    throw new Error(
      'useVideoContext must be used within a VideoProvider. ' +
        'Wrap your component tree with <VideoProvider> to use VideoPlayer components.'
    )
  }
  return context
}
