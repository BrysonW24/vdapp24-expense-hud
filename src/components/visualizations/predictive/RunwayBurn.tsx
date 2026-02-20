import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'

export function RunwayBurn() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 180

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const savings = 45000
    const monthlyBurn = 5000
    const optimizedBurn = 4200
    const currentMonths = savings / monthlyBurn
    const optimizedMonths = savings / optimizedBurn
    const maxMonths = Math.ceil(optimizedMonths * 1.2)

    const margin = { top: 30, right: 20, bottom: 40, left: 20 }
    const innerW = width - margin.left - margin.right
    const barH = 24

    const x = d3.scaleLinear().domain([0, maxMonths]).range([0, innerW])
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Gradient for current runway
    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', 'runway-grad')
    grad.append('stop').attr('offset', '0%').attr('stop-color', VIZ_COLORS.positive)
    grad.append('stop').attr('offset', '60%').attr('stop-color', VIZ_COLORS.warning)
    grad.append('stop').attr('offset', '100%').attr('stop-color', VIZ_COLORS.negative)

    // Background track
    g.append('rect')
      .attr('y', 0).attr('width', innerW).attr('height', barH).attr('rx', 6)
      .attr('fill', VIZ_COLORS.surfaceLight)

    // Current runway
    g.append('rect')
      .attr('y', 0).attr('width', x(currentMonths)).attr('height', barH).attr('rx', 6)
      .attr('fill', 'url(#runway-grad)').attr('opacity', 0.85)

    // Current label
    g.append('text')
      .attr('x', x(currentMonths) + 6).attr('y', barH / 2).attr('dominant-baseline', 'central')
      .attr('fill', VIZ_COLORS.text).attr('font-size', 11).attr('font-weight', 700)
      .text(`${currentMonths.toFixed(0)} months`)

    g.append('text')
      .attr('x', 6).attr('y', barH / 2).attr('dominant-baseline', 'central')
      .attr('fill', '#fff').attr('font-size', 10).attr('font-weight', 600)
      .text('Current burn rate')

    // Optimised scenario
    const optY = barH + 16
    g.append('rect')
      .attr('y', optY).attr('width', innerW).attr('height', barH).attr('rx', 6)
      .attr('fill', VIZ_COLORS.surfaceLight)

    g.append('rect')
      .attr('y', optY).attr('width', x(optimizedMonths)).attr('height', barH).attr('rx', 6)
      .attr('fill', VIZ_COLORS.positive).attr('opacity', 0.7)

    g.append('text')
      .attr('x', x(optimizedMonths) + 6).attr('y', optY + barH / 2).attr('dominant-baseline', 'central')
      .attr('fill', VIZ_COLORS.positive).attr('font-size', 11).attr('font-weight', 700)
      .text(`${optimizedMonths.toFixed(0)} months`)

    g.append('text')
      .attr('x', 6).attr('y', optY + barH / 2).attr('dominant-baseline', 'central')
      .attr('fill', '#fff').attr('font-size', 10).attr('font-weight', 600)
      .text('Optimised (-$800/mo)')

    // Scale ticks
    const tickValues = d3.range(0, maxMonths + 1, 2)
    tickValues.forEach(t => {
      g.append('text')
        .attr('x', x(t)).attr('y', optY + barH + 16).attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8)
        .text(`${t}mo`)
    })

    // Savings callout
    svg.append('text')
      .attr('x', margin.left).attr('y', 16)
      .attr('fill', VIZ_COLORS.textMuted).attr('font-size', 10)
      .text(`Savings: $${(savings / 1000).toFixed(0)}k · Burn: $${(monthlyBurn / 1000).toFixed(1)}k/mo`)

  }, [width])

  return (
    <VizCard title="Runway Burn Simulation" description="How long your savings last at current vs optimised burn rate" fullWidth>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
