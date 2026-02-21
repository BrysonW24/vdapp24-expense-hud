import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_DAILY_SPEND } from '../shared/mockData'

export function FinancialECG() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const height = 220

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const tooltip = d3.select(tooltipRef.current)

    const data = MOCK_DAILY_SPEND
    const margin = { top: 30, right: 15, bottom: 25, left: 45 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const parseDate = (s: string) => new Date(s)
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => parseDate(d.date)) as [Date, Date])
      .range([0, innerW])

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.amount)! * 1.15])
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

    // Glow filter for spike dots
    const filter = defs.append('filter').attr('id', 'spike-glow')
    filter.append('feGaussianBlur').attr('stdDeviation', 2.5).attr('result', 'blur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'blur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

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

    // Spike markers with merchant labels
    const spikes = data.filter(d => d.topMerchant)

    spikes.forEach(d => {
      const cx = x(parseDate(d.date))
      const cy = y(d.amount)

      // Vertical leader line from dot up to label
      g.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', cy - 5).attr('y2', cy - 18)
        .attr('stroke', VIZ_COLORS.negative)
        .attr('stroke-width', 0.5)
        .attr('opacity', 0.5)

      // Merchant label above the spike
      g.append('text')
        .attr('x', cx)
        .attr('y', cy - 20)
        .attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.negative)
        .attr('font-size', 8)
        .attr('font-weight', 600)
        .text(d.topMerchant!)

      // Glowing dot
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4)
        .attr('fill', VIZ_COLORS.negative)
        .attr('filter', 'url(#spike-glow)')
        .attr('opacity', 0.9)
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          const dateStr = new Date(d.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
          tooltip
            .style('opacity', '1')
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 10}px`)
            .html(`
              <div class="font-semibold">${d.topMerchant}</div>
              <div class="text-[10px] opacity-70">${dateStr}</div>
              <div class="text-xs mt-0.5">$${d.topAmount?.toFixed(0)} of <span class="opacity-60">$${d.amount.toFixed(0)} total</span></div>
            `)
        })
        .on('mousemove', (event: MouseEvent) => {
          tooltip
            .style('left', `${event.offsetX + 12}px`)
            .style('top', `${event.offsetY - 10}px`)
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', '0')
        })

      // Outer pulse ring
      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', VIZ_COLORS.negative)
        .attr('stroke-width', 1)
        .attr('opacity', 0.3)
        .style('pointer-events', 'none')
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
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity duration-150 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10 z-20 whitespace-nowrap"
        />
      </div>
    </VizCard>
  )
}
