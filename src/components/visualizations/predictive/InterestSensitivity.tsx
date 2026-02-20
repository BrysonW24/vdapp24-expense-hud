import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'

export function InterestSensitivity() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const [rateAdj, setRateAdj] = useState(0) // -2 to +3
  const height = 300

  const baseRate = 6.5
  const loanAmount = 450000
  const loanTerm = 30

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 15, bottom: 30, left: 55 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // Calculate monthly repayments at different rates
    const rates = d3.range(-2, 3.5, 0.5)
    const calcMonthly = (rate: number) => {
      const r = rate / 100 / 12
      if (r === 0) return loanAmount / (loanTerm * 12)
      return (loanAmount * r * Math.pow(1 + r, loanTerm * 12)) / (Math.pow(1 + r, loanTerm * 12) - 1)
    }

    const lineData = rates.map(adj => ({
      rate: baseRate + adj,
      monthly: calcMonthly(baseRate + adj),
      adj,
    }))

    const x = d3.scaleLinear()
      .domain([d3.min(lineData, d => d.rate)!, d3.max(lineData, d => d.rate)!])
      .range([0, innerW])

    const y = d3.scaleLinear()
      .domain([d3.min(lineData, d => d.monthly)! * 0.95, d3.max(lineData, d => d.monthly)! * 1.05])
      .range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Line
    const line = d3.line<typeof lineData[0]>()
      .x(d => x(d.rate))
      .y(d => y(d.monthly))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(lineData)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', VIZ_COLORS.info)
      .attr('stroke-width', 2)

    // Area fill
    const area = d3.area<typeof lineData[0]>()
      .x(d => x(d.rate))
      .y0(innerH)
      .y1(d => y(d.monthly))
      .curve(d3.curveMonotoneX)

    g.append('path')
      .datum(lineData)
      .attr('d', area)
      .attr('fill', VIZ_COLORS.info)
      .attr('opacity', 0.08)

    // Current rate marker
    const currentRate = baseRate + rateAdj
    const currentMonthly = calcMonthly(currentRate)

    g.append('line')
      .attr('x1', x(currentRate)).attr('x2', x(currentRate))
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', VIZ_COLORS.brand)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.7)

    g.append('circle')
      .attr('cx', x(currentRate)).attr('cy', y(currentMonthly))
      .attr('r', 5).attr('fill', VIZ_COLORS.brand)

    g.append('text')
      .attr('x', x(currentRate)).attr('y', y(currentMonthly) - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.text).attr('font-size', 11).attr('font-weight', 700)
      .text(`$${currentMonthly.toFixed(0)}/mo`)

    g.append('text')
      .attr('x', x(currentRate)).attr('y', y(currentMonthly) - 24)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 9)
      .text(`${currentRate.toFixed(1)}%`)

    // Base rate marker
    if (rateAdj !== 0) {
      const baseMonthly = calcMonthly(baseRate)
      g.append('circle')
        .attr('cx', x(baseRate)).attr('cy', y(baseMonthly))
        .attr('r', 3).attr('fill', VIZ_COLORS.textDim).attr('opacity', 0.5)
    }

    // Axes
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d => `${d}%`)
    g.append('g').attr('transform', `translate(0,${innerH})`).call(xAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

    const yAxis = d3.axisLeft(y).ticks(5).tickFormat(d => `$${d}`)
    g.append('g').call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

  }, [width, rateAdj])

  return (
    <VizCard title="Interest Sensitivity" description="Slide the rate — watch housing costs change in real time">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-slate-400">Rate adj:</span>
        <input
          type="range" min={-2} max={3} step={0.5} value={rateAdj}
          onChange={e => setRateAdj(parseFloat(e.target.value))}
          className="flex-1 accent-brand h-1.5"
        />
        <span className="text-xs font-mono text-slate-300 w-14 text-right">
          {rateAdj >= 0 ? '+' : ''}{rateAdj.toFixed(1)}%
        </span>
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
