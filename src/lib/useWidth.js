import { useEffect, useRef, useState } from 'react'

// Tracks an element's content width so SVG charts can lay out in real pixels
// (text stays legible instead of shrinking with a fixed viewBox).
export function useWidth(initial = 640) {
  const ref = useRef(null)
  const [width, setWidth] = useState(initial)
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}
