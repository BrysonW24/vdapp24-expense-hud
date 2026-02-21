import { useEffect, useRef } from 'react'

// Lightweight animated background with two counter-scrolling columns
// of financial visualization elements — particles, rings, bars, dots

interface Particle {
  x: number
  y: number
  r: number
  speed: number
  opacity: number
  color: string
}

const COLORS = ['#FF6B35', '#22c55e', '#3b82f6', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#eab308']

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)]
}

export function SplashBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let particles: Particle[] = []

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas!.width = window.innerWidth * dpr
      canvas!.height = window.innerHeight * dpr
      canvas!.style.width = `${window.innerWidth}px`
      canvas!.style.height = `${window.innerHeight}px`
      ctx!.scale(dpr, dpr)
      initParticles()
    }

    function initParticles() {
      const w = window.innerWidth
      const h = window.innerHeight
      particles = []

      // Left column particles — moving UP
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * w * 0.4 + w * 0.02,
          y: Math.random() * h * 1.5,
          r: Math.random() * 4 + 1,
          speed: -(Math.random() * 0.6 + 0.2), // upward
          opacity: Math.random() * 0.4 + 0.1,
          color: randomColor(),
        })
      }

      // Right column particles — moving DOWN
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * w * 0.4 + w * 0.58,
          y: Math.random() * h * 1.5 - h * 0.5,
          r: Math.random() * 4 + 1,
          speed: Math.random() * 0.6 + 0.2, // downward
          opacity: Math.random() * 0.4 + 0.1,
          color: randomColor(),
        })
      }
    }

    function drawRing(x: number, y: number, r: number, color: string, opacity: number) {
      ctx!.beginPath()
      ctx!.arc(x, y, r, 0, Math.PI * 2)
      ctx!.strokeStyle = color
      ctx!.globalAlpha = opacity * 0.3
      ctx!.lineWidth = 1
      ctx!.stroke()
      ctx!.globalAlpha = 1
    }

    function drawBar(x: number, y: number, w: number, h: number, color: string, opacity: number) {
      ctx!.globalAlpha = opacity * 0.25
      ctx!.fillStyle = color
      ctx!.beginPath()
      ctx!.roundRect(x, y, w, h, 3)
      ctx!.fill()
      ctx!.globalAlpha = 1
    }

    let time = 0

    function animate() {
      const w = window.innerWidth
      const h = window.innerHeight

      ctx!.clearRect(0, 0, w, h)
      time += 0.005

      // Draw and move particles
      for (const p of particles) {
        p.y += p.speed

        // Wrap around
        if (p.speed < 0 && p.y < -20) p.y = h + 20
        if (p.speed > 0 && p.y > h + 20) p.y = -20

        // Draw circle
        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.opacity
        ctx!.fill()
        ctx!.globalAlpha = 1
      }

      // Draw decorative elements — left column (slow upward drift)
      const leftOffset = (time * 80) % h
      for (let i = 0; i < 6; i++) {
        const yy = ((i * h / 5) - leftOffset + h * 2) % (h * 1.5) - h * 0.25
        const xx = w * 0.12 + Math.sin(time + i) * 30
        drawRing(xx, yy, 20 + Math.sin(time * 2 + i) * 8, COLORS[i % COLORS.length], 0.5 + Math.sin(time + i) * 0.2)
      }

      // Draw decorative bars — left column
      for (let i = 0; i < 5; i++) {
        const yy = ((i * h / 4) - leftOffset * 0.7 + h * 2) % (h * 1.5) - h * 0.25
        const xx = w * 0.25
        const bw = 30 + Math.sin(time * 1.5 + i * 2) * 15
        drawBar(xx, yy, bw, 6, COLORS[(i + 3) % COLORS.length], 0.6)
      }

      // Draw decorative elements — right column (slow downward drift)
      const rightOffset = (time * 60) % h
      for (let i = 0; i < 6; i++) {
        const yy = ((i * h / 5) + rightOffset) % (h * 1.5) - h * 0.25
        const xx = w * 0.85 + Math.cos(time + i) * 25
        drawRing(xx, yy, 15 + Math.cos(time * 1.8 + i) * 6, COLORS[(i + 2) % COLORS.length], 0.4 + Math.cos(time + i) * 0.15)
      }

      // Draw decorative bars — right column
      for (let i = 0; i < 5; i++) {
        const yy = ((i * h / 4) + rightOffset * 0.8) % (h * 1.5) - h * 0.25
        const xx = w * 0.68
        const bw = 25 + Math.cos(time * 1.3 + i * 2) * 12
        drawBar(xx, yy, bw, 6, COLORS[(i + 5) % COLORS.length], 0.5)
      }

      // Orbiting dots around center area
      for (let i = 0; i < 8; i++) {
        const angle = time * (0.3 + i * 0.05) + (i * Math.PI * 2) / 8
        const radius = 180 + i * 20 + Math.sin(time * 2 + i) * 15
        const ox = w / 2 + Math.cos(angle) * radius
        const oy = h / 2 + Math.sin(angle) * radius * 0.6 // elliptical
        ctx!.beginPath()
        ctx!.arc(ox, oy, 2.5, 0, Math.PI * 2)
        ctx!.fillStyle = COLORS[i % COLORS.length]
        ctx!.globalAlpha = 0.25
        ctx!.fill()
        ctx!.globalAlpha = 1
      }

      animId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
