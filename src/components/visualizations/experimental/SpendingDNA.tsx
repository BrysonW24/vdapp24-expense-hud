import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_DNA, DNA_CATEGORIES } from '../shared/mockData'

export function SpendingDNA() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 250

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_DNA
    const margin = { top: 10, right: 10, bottom: 40, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, innerW])
      .padding(0.15)

    const y = d3.scaleLinear().domain([0, 1]).range([innerH, 0])

    const color = d3.scaleOrdinal<string>().domain(DNA_CATEGORIES).range(VIZ_COLORS.categories)

    // Stack
    const stackData = data.map(d => {
      const row: Record<string, number> = { month: 0 }
      DNA_CATEGORIES.forEach(cat => { row[cat] = d.categories[cat] || 0 })
      return row
    })

    const stack = d3.stack<Record<string, number>>()
      .keys(DNA_CATEGORIES)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)

    const series = stack(stackData)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Stacked bars
    series.forEach(s => {
      g.selectAll(`.bar-${s.key}`)
        .data(s)
        .enter()
        .append('rect')
        .attr('x', (_, i) => x(data[i].month)!)
        .attr('y', d => y(d[1]))
        .attr('height', d => y(d[0]) - y(d[1]))
        .attr('width', x.bandwidth())
        .attr('fill', color(s.key))
        .attr('rx', 2)
        .attr('opacity', 0.85)
    })

    // Month labels
    g.selectAll('.month-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.month)! + x.bandwidth() / 2)
      .attr('y', innerH + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 8)
      .text(d => d.month)

    // Legend
    const legendY = innerH + 26
    const legendSpacing = Math.min(innerW / DNA_CATEGORIES.length, 80)
    DNA_CATEGORIES.slice(0, 6).forEach((cat, i) => {
      const lx = i * legendSpacing
      g.append('rect')
        .attr('x', lx).attr('y', legendY).attr('width', 8).attr('height', 8).attr('rx', 2)
        .attr('fill', color(cat))
      g.append('text')
        .attr('x', lx + 11).attr('y', legendY + 7)
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 7)
        .text(cat)
    })

  }, [width])

  return (
    <VizCard title="Spending DNA" description="Your financial fingerprint — category proportions across 12 months" fullWidth>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
