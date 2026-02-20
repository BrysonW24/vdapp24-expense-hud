import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MONTHLY } from '../shared/mockData'

export function FinancialMoodMap() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 200

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_MONTHLY
    const margin = { top: 20, right: 10, bottom: 30, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const cols = data.length
    const cellW = innerW / cols
    const cellH = innerH

    // Colour scale: red → yellow → green
    const colorScale = d3.scaleSequential(d3.interpolateRdYlGn).domain([30, 90])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    data.forEach((d, i) => {
      const x = i * cellW

      // Mood rect
      g.append('rect')
        .attr('x', x + 1)
        .attr('y', 0)
        .attr('width', cellW - 2)
        .attr('height', cellH)
        .attr('rx', 6)
        .attr('fill', colorScale(d.mood))
        .attr('opacity', 0.85)

      // Mood score
      g.append('text')
        .attr('x', x + cellW / 2)
        .attr('y', cellH / 2 - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', d.mood > 60 ? '#1a1a2e' : '#fff')
        .attr('font-size', 14)
        .attr('font-weight', 700)
        .text(d.mood)

      // Savings indicator
      const savingsRatio = d.savings / d.income
      g.append('text')
        .attr('x', x + cellW / 2)
        .attr('y', cellH / 2 + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', d.mood > 60 ? '#1a1a2e' : '#fff')
        .attr('font-size', 9)
        .attr('opacity', 0.7)
        .text(`${(savingsRatio * 100).toFixed(0)}% saved`)

      // Month label
      g.append('text')
        .attr('x', x + cellW / 2)
        .attr('y', cellH + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textDim)
        .attr('font-size', 9)
        .text(d.label)
    })

    // Legend
    const legendW = 100
    const legendH = 8
    const legendX = width - margin.right - legendW
    const legendY = -12

    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', 'mood-gradient')
    grad.append('stop').attr('offset', '0%').attr('stop-color', colorScale(30))
    grad.append('stop').attr('offset', '50%').attr('stop-color', colorScale(60))
    grad.append('stop').attr('offset', '100%').attr('stop-color', colorScale(90))

    svg.append('rect')
      .attr('x', legendX)
      .attr('y', legendY)
      .attr('width', legendW)
      .attr('height', legendH)
      .attr('rx', 4)
      .attr('fill', 'url(#mood-gradient)')

    svg.append('text').attr('x', legendX - 4).attr('y', legendY + 7).attr('text-anchor', 'end')
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8).text('Stressed')
    svg.append('text').attr('x', legendX + legendW + 4).attr('y', legendY + 7)
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8).text('Calm')

  }, [width])

  return (
    <VizCard title="Financial Mood Map" description="Monthly financial stress — based on volatility, savings rate, and surplus">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
