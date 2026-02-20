import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MONTHLY } from '../shared/mockData'

export function TimeTunnel() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_MONTHLY
    const cx = width / 2
    const cy = height / 2
    const maxRadius = Math.min(width, height) / 2 - 20
    const minRadius = 30

    const radiusScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([minRadius, maxRadius])

    const maxExpense = d3.max(data, d => d.expenses)!
    const thicknessScale = d3.scaleLinear()
      .domain([3500, maxExpense])
      .range([4, 18])

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    data.forEach((d, i) => {
      const r = radiusScale(i)
      const thickness = thicknessScale(d.expenses)
      const surplus = d.income - d.expenses
      const color = surplus > 2500 ? VIZ_COLORS.positive : surplus > 1500 ? VIZ_COLORS.warning : VIZ_COLORS.negative

      // Full ring
      const arc = d3.arc<unknown>()
        .innerRadius(r - thickness / 2)
        .outerRadius(r + thickness / 2)
        .startAngle(0)
        .endAngle(2 * Math.PI)

      g.append('path')
        .attr('d', arc({}) as string)
        .attr('fill', color)
        .attr('opacity', 0.15 + (i / data.length) * 0.6)

      // Expense proportion arc
      const expensePct = d.expenses / d.income
      const expArc = d3.arc<unknown>()
        .innerRadius(r - thickness / 2)
        .outerRadius(r + thickness / 2)
        .startAngle(0)
        .endAngle(expensePct * 2 * Math.PI)

      g.append('path')
        .attr('d', expArc({}) as string)
        .attr('fill', color)
        .attr('opacity', 0.7)

      // Month label (right side)
      g.append('text')
        .attr('x', r + thickness / 2 + 6)
        .attr('y', 3)
        .attr('fill', VIZ_COLORS.textDim)
        .attr('font-size', 8)
        .attr('opacity', i % 2 === 0 ? 1 : 0.5)
        .text(d.label)
    })

    // Center text
    const latest = data[data.length - 1]
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -6)
      .attr('fill', VIZ_COLORS.text)
      .attr('font-size', 14)
      .attr('font-weight', 700)
      .text(latest.label)

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 9)
      .text(`$${(latest.expenses / 1000).toFixed(1)}k spent`)

  }, [width])

  return (
    <VizCard title="3D Time Tunnel" description="Fly through your financial history — thicker rings = higher spend, colour = surplus/deficit">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
