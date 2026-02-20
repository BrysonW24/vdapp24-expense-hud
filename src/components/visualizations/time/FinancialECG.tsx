import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_DAILY_SPEND } from '../shared/mockData'

export function FinancialECG() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 200

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_DAILY_SPEND
    const margin = { top: 15, right: 15, bottom: 25, left: 45 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const parseDate = (s: string) => new Date(s)
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => parseDate(d.date)) as [Date, Date])
      .range([0, innerW])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)! * 1.1])
      .range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Calm zone (below average)
    const avg = d3.mean(data, d => d.amount)!
    g.append('rect')
      .attr('x', 0)
      .attr('y', y(avg))
      .attr('width', innerW)
      .attr('height', innerH - y(avg))
      .attr('fill', VIZ_COLORS.positive)
      .attr('opacity', 0.05)

    // Average line
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', y(avg)).attr('y2', y(avg))
      .attr('stroke', VIZ_COLORS.textDim)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.4)

    g.append('text')
      .attr('x', innerW + 4)
      .attr('y', y(avg) + 3)
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 8)
      .text(`avg $${avg.toFixed(0)}`)

    // ECG line
    const line = d3.line<typeof data[0]>()
      .x(d => x(parseDate(d.date)))
      .y(d => y(d.amount))
      .curve(d3.curveMonotoneX)

    // Gradient fill
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'ecg-fill')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%')
    gradient.append('stop').attr('offset', '0%').attr('stop-color', VIZ_COLORS.brand).attr('stop-opacity', 0.3)
    gradient.append('stop').attr('offset', '100%').attr('stop-color', VIZ_COLORS.brand).attr('stop-opacity', 0)

    const area = d3.area<typeof data[0]>()
      .x(d => x(parseDate(d.date)))
      .y0(innerH)
      .y1(d => y(d.amount))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(data)
      .attr('d', area)
      .attr('fill', 'url(#ecg-fill)')

    g.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', VIZ_COLORS.brand)
      .attr('stroke-width', 1.5)

    // Spike markers (above 2x average)
    data.forEach(d => {
      if (d.amount > avg * 2) {
        g.append('circle')
          .attr('cx', x(parseDate(d.date)))
          .attr('cy', y(d.amount))
          .attr('r', 3)
          .attr('fill', VIZ_COLORS.negative)
      }
    })

    // X axis
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%d %b') as unknown as (d: d3.NumberValue, i: number) => string)
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

    // Y axis
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat(d => `$${d}`)
    g.append('g')
      .call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

  }, [width])

  return (
    <VizCard title="Financial ECG" description="Daily spending heartbeat — spikes show high-spend days, calm zones show discipline" fullWidth>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
