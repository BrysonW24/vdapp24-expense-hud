import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_PROJECTIONS } from '../shared/mockData'

export function FutureYou() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 300

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_PROJECTIONS
    const margin = { top: 20, right: 60, bottom: 30, left: 55 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, innerW])
    const yMax = d3.max(data, d => Math.max(d.current, d.optimized))!
    const y = d3.scaleLinear().domain([40000, yMax * 1.05]).range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Area between paths
    const areaBetween = d3.area<typeof data[0]>()
      .x((_, i) => x(i))
      .y0(d => y(d.current))
      .y1(d => y(d.optimized))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('d', areaBetween)
      .attr('fill', VIZ_COLORS.positive)
      .attr('opacity', 0.1)

    // Current path
    const lineCurrent = d3.line<typeof data[0]>()
      .x((_, i) => x(i))
      .y(d => y(d.current))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('d', lineCurrent)
      .attr('fill', 'none')
      .attr('stroke', VIZ_COLORS.warning)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '6,3')

    // Optimized path
    const lineOpt = d3.line<typeof data[0]>()
      .x((_, i) => x(i))
      .y(d => y(d.optimized))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('d', lineOpt)
      .attr('fill', 'none')
      .attr('stroke', VIZ_COLORS.positive)
      .attr('stroke-width', 2.5)

    // End labels
    const last = data[data.length - 1]
    g.append('text')
      .attr('x', innerW + 6).attr('y', y(last.optimized))
      .attr('fill', VIZ_COLORS.positive).attr('font-size', 10).attr('font-weight', 700)
      .attr('dominant-baseline', 'central')
      .text(`$${(last.optimized / 1000).toFixed(0)}k`)

    g.append('text')
      .attr('x', innerW + 6).attr('y', y(last.current))
      .attr('fill', VIZ_COLORS.warning).attr('font-size', 10).attr('font-weight', 700)
      .attr('dominant-baseline', 'central')
      .text(`$${(last.current / 1000).toFixed(0)}k`)

    // Gap annotation at midpoint
    const mid = Math.floor(data.length / 2)
    const midData = data[mid]
    const gap = midData.optimized - midData.current
    g.append('text')
      .attr('x', x(mid)).attr('y', y((midData.optimized + midData.current) / 2))
      .attr('text-anchor', 'middle').attr('fill', VIZ_COLORS.positive)
      .attr('font-size', 9).attr('font-weight', 600)
      .text(`+$${(gap / 1000).toFixed(0)}k gap`)

    // Axes
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(i => `M${(i as number) + 1}`)
    g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => `$${(d as number) / 1000}k`)
    g.append('g').call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

    // Legend
    g.append('line').attr('x1', 0).attr('y1', -8).attr('x2', 20).attr('y2', -8)
      .attr('stroke', VIZ_COLORS.warning).attr('stroke-width', 2).attr('stroke-dasharray', '6,3')
    g.append('text').attr('x', 24).attr('y', -5).attr('fill', VIZ_COLORS.textDim).attr('font-size', 9).text('Current path')

    g.append('line').attr('x1', 110).attr('y1', -8).attr('x2', 130).attr('y2', -8)
      .attr('stroke', VIZ_COLORS.positive).attr('stroke-width', 2.5)
    g.append('text').attr('x', 134).attr('y', -5).attr('fill', VIZ_COLORS.textDim).attr('font-size', 9).text('Optimised (-10% spend)')

  }, [width])

  return (
    <VizCard title="Future You" description="Two animated futures side-by-side — current path vs optimised net worth projection">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
