import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MOMENTUM } from '../shared/mockData'

export function CategoryMomentum() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)

  const data = MOCK_MOMENTUM.slice().sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  const barHeight = 28
  const gap = 6
  const margin = { top: 10, right: 70, bottom: 10, left: 100 }
  const height = margin.top + margin.bottom + data.length * (barHeight + gap)

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const innerW = width - margin.left - margin.right
    const maxSpend = d3.max(data, d => d.current)!

    const x = d3.scaleLinear().domain([0, maxSpend]).range([0, innerW])
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    data.forEach((d, i) => {
      const y = i * (barHeight + gap)
      const barW = x(d.current)
      const color = d.change > 10 ? VIZ_COLORS.negative : d.change > 0 ? VIZ_COLORS.warning : VIZ_COLORS.positive

      // Bar
      g.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', barW)
        .attr('height', barHeight)
        .attr('rx', 4)
        .attr('fill', color)
        .attr('opacity', 0.7)

      // Category label
      g.append('text')
        .attr('x', -8)
        .attr('y', y + barHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'central')
        .attr('fill', VIZ_COLORS.text)
        .attr('font-size', 11)
        .text(d.category)

      // Amount inside bar
      if (barW > 50) {
        g.append('text')
          .attr('x', barW - 6)
          .attr('y', y + barHeight / 2)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'central')
          .attr('fill', '#fff')
          .attr('font-size', 10)
          .attr('font-weight', 600)
          .text(`$${d.current}`)
      }

      // Momentum arrow + percentage
      const arrow = d.change > 0 ? '↑' : d.change < 0 ? '↓' : '→'
      g.append('text')
        .attr('x', barW + 8)
        .attr('y', y + barHeight / 2)
        .attr('dominant-baseline', 'central')
        .attr('fill', color)
        .attr('font-size', 12)
        .attr('font-weight', 700)
        .text(`${arrow} ${Math.abs(d.change).toFixed(1)}%`)
    })

  }, [width])

  return (
    <VizCard title="Category Momentum" description="Which categories are accelerating — momentum arrows, not static pie charts">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
