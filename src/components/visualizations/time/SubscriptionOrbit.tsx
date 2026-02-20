import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_SUBSCRIPTIONS } from '../shared/mockData'

export function SubscriptionOrbit() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const cx = width / 2
    const cy = height / 2
    const maxOrbitR = Math.min(width, height) / 2 - 30

    // Sort by monthly cost (yearly / 12 for annuals)
    const subs = MOCK_SUBSCRIPTIONS.map(s => ({
      ...s,
      monthlyCost: s.frequency === 'yearly' ? s.cost / 12 : s.cost,
    })).sort((a, b) => b.monthlyCost - a.monthlyCost)

    const totalMonthlyCost = d3.sum(subs, s => s.monthlyCost)

    // Orbit radii: closer = more expensive
    const costScale = d3.scaleLinear()
      .domain([d3.max(subs, s => s.monthlyCost)!, d3.min(subs, s => s.monthlyCost)!])
      .range([40, maxOrbitR])

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    // Center — core income
    g.append('circle').attr('r', 28).attr('fill', VIZ_COLORS.brand).attr('opacity', 0.2)
    g.append('circle').attr('r', 20).attr('fill', VIZ_COLORS.brand).attr('opacity', 0.4)
    g.append('text')
      .attr('text-anchor', 'middle').attr('y', -4)
      .attr('fill', VIZ_COLORS.text).attr('font-size', 10).attr('font-weight', 700)
      .text('Income')
    g.append('text')
      .attr('text-anchor', 'middle').attr('y', 10)
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8)
      .text(`$${totalMonthlyCost.toFixed(0)}/mo`)

    // Draw orbit rings and satellites
    subs.forEach((s, i) => {
      const orbitR = costScale(s.monthlyCost)

      // Orbit ring
      g.append('circle')
        .attr('r', orbitR)
        .attr('fill', 'none')
        .attr('stroke', VIZ_COLORS.surfaceLight)
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', s.used ? 'none' : '3,3')

      // Satellite position (spread evenly by index)
      const angle = (i / subs.length) * 2 * Math.PI - Math.PI / 2
      const sx = Math.cos(angle) * orbitR
      const sy = Math.sin(angle) * orbitR
      const dotR = 6 + s.monthlyCost / 8

      // Unused = red orbit
      const dotColor = s.used ? VIZ_COLORS.info : VIZ_COLORS.negative

      g.append('circle')
        .attr('cx', sx).attr('cy', sy).attr('r', dotR)
        .attr('fill', dotColor).attr('opacity', 0.8)

      // Label
      const labelOffset = dotR + 8
      const labelX = sx + Math.cos(angle) * labelOffset
      const labelY = sy + Math.sin(angle) * labelOffset

      g.append('text')
        .attr('x', labelX).attr('y', labelY - 5)
        .attr('text-anchor', Math.cos(angle) < -0.1 ? 'end' : Math.cos(angle) > 0.1 ? 'start' : 'middle')
        .attr('fill', VIZ_COLORS.text).attr('font-size', 9).attr('font-weight', 600)
        .text(s.name)

      g.append('text')
        .attr('x', labelX).attr('y', labelY + 7)
        .attr('text-anchor', Math.cos(angle) < -0.1 ? 'end' : Math.cos(angle) > 0.1 ? 'start' : 'middle')
        .attr('fill', s.used ? VIZ_COLORS.textDim : VIZ_COLORS.negative)
        .attr('font-size', 8)
        .text(`$${s.monthlyCost.toFixed(0)}/mo${!s.used ? ' · unused' : ''}`)
    })

  }, [width])

  return (
    <VizCard title="Subscription Orbit System" description="Subscriptions orbit your income — closer = more expensive, red = unused">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
