import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'

const TARGETS = [
  { id: 'housing', label: 'Housing', pct: 0.23, color: VIZ_COLORS.categories[0] },
  { id: 'groceries', label: 'Groceries', pct: 0.14, color: VIZ_COLORS.categories[1] },
  { id: 'transport', label: 'Transport', pct: 0.06, color: VIZ_COLORS.categories[2] },
  { id: 'eating', label: 'Eating Out', pct: 0.05, color: VIZ_COLORS.categories[3] },
  { id: 'savings', label: 'Savings', pct: 0.38, color: VIZ_COLORS.positive },
  { id: 'other', label: 'Other', pct: 0.14, color: VIZ_COLORS.categories[6] },
]

interface Particle extends d3.SimulationNodeDatum {
  targetX: number
  targetY: number
  color: string
  r: number
}

export function MoneyParticles() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 400

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 20, bottom: 30, left: 20 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // Target zones (right side)
    const targetX = innerW * 0.75
    const targetSpacing = innerH / TARGETS.length
    const targetPositions = TARGETS.map((t, i) => ({
      ...t,
      x: targetX,
      y: i * targetSpacing + targetSpacing / 2,
    }))

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Source (left)
    g.append('circle')
      .attr('cx', innerW * 0.1).attr('cy', innerH / 2).attr('r', 25)
      .attr('fill', VIZ_COLORS.brand).attr('opacity', 0.3)
    g.append('text')
      .attr('x', innerW * 0.1).attr('y', innerH / 2)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('fill', VIZ_COLORS.text).attr('font-size', 10).attr('font-weight', 700)
      .text('$7.8k')

    // Target zones
    targetPositions.forEach(t => {
      g.append('circle')
        .attr('cx', t.x).attr('cy', t.y).attr('r', 20 + t.pct * 40)
        .attr('fill', t.color).attr('opacity', 0.15)

      g.append('text')
        .attr('x', t.x + 25 + t.pct * 40).attr('y', t.y - 5)
        .attr('fill', VIZ_COLORS.text).attr('font-size', 9).attr('font-weight', 600)
        .text(t.label)

      g.append('text')
        .attr('x', t.x + 25 + t.pct * 40).attr('y', t.y + 8)
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8)
        .text(`${(t.pct * 100).toFixed(0)}%`)
    })

    // Create particles
    const numParticles = 80
    const particles: Particle[] = []

    TARGETS.forEach(t => {
      const count = Math.round(t.pct * numParticles)
      const tp = targetPositions.find(p => p.id === t.id)!
      for (let i = 0; i < count; i++) {
        particles.push({
          x: innerW * 0.1 + (Math.random() - 0.5) * 20,
          y: innerH / 2 + (Math.random() - 0.5) * 40,
          targetX: tp.x + (Math.random() - 0.5) * (15 + t.pct * 30),
          targetY: tp.y + (Math.random() - 0.5) * (15 + t.pct * 30),
          color: t.color,
          r: 2 + Math.random() * 2,
        })
      }
    })

    // Draw particles
    const dots = g.selectAll('.particle')
      .data(particles)
      .enter()
      .append('circle')
      .attr('cx', d => d.x!)
      .attr('cy', d => d.y!)
      .attr('r', d => d.r)
      .attr('fill', d => d.color)
      .attr('opacity', 0.7)

    // Animate particles to targets
    const simulation = d3.forceSimulation(particles)
      .force('x', d3.forceX<Particle>(d => d.targetX).strength(0.03))
      .force('y', d3.forceY<Particle>(d => d.targetY).strength(0.03))
      .force('collision', d3.forceCollide<Particle>().radius(d => d.r + 1))
      .alphaDecay(0.01)

    simulation.on('tick', () => {
      dots
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!)
    })

    return () => { simulation.stop() }
  }, [width])

  return (
    <VizCard title="Money as Particles" description="Every dollar is a particle — flowing from income into category targets">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
