import { useState, useEffect, useRef, useCallback } from 'react'

export function useContainerSize() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const measure = useCallback(() => {
    if (containerRef.current) {
      setWidth(containerRef.current.clientWidth)
    }
  }, [])

  useEffect(() => {
    measure()
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  return { containerRef, width }
}
