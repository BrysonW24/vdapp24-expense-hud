import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MOMENTUM } from '../shared/mockData'

export function CategoryShock() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const [shock, setShock] = useState(0) // % increase to Groceries
  const [shockCat, setShockCat] = useState('Groceries')
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_MOMENTUM.map(d => ({
      ...d,
      shocked: d.category === shockCat ? d.current * (1 + shock / 100) : d.current,
    }))

    const margin = { top: 10, right: 15, bottom: 25, left: 90 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const y = d3.scaleBand()
      .domain(data.map(d => d.category))
      .range([0, innerH])
      .padding(0.2)

    const maxVal = d3.max(data, d => Math.max(d.current, d.shocked))!
    const x = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, innerW])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    data.forEach(d => {
      const barY = y(d.category)!
      const barH = y.bandwidth()

      // Original bar
      g.append('rect')
        .attr('x', 0).attr('y', barY)
        .attr('width', x(d.current)).attr('height', barH / 2)
        .attr('rx', 3)
        .attr('fill', VIZ_COLORS.info).attr('opacity', 0.6)

      // Shocked bar
      g.append('rect')
        .attr('x', 0).attr('y', barY + barH / 2)
        .attr('width', x(d.shocked)).attr('height', barH / 2)
        .attr('rx', 3)
        .attr('fill', d.shocked > d.current ? VIZ_COLORS.negative : VIZ_COLORS.info)
        .attr('opacity', 0.7)

      // Label
      g.append('text')
        .attr('x', -6).attr('y', barY + barH / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', VIZ_COLORS.text).attr('font-size', 10)
        .text(d.category)

      // Value labels
      if (d.shocked !== d.current) {
        const diff = d.shocked - d.current
        g.append('text')
          .attr('x', x(d.shocked) + 4).attr('y', barY + barH * 0.75)
          .attr('dominant-baseline', 'central')
          .attr('fill', VIZ_COLORS.negative).attr('font-size', 9).attr('font-weight', 600)
          .text(`+$${diff.toFixed(0)}`)
      }
    })

    // Total impact
    const totalBefore = d3.sum(data, d => d.current)
    const totalAfter = d3.sum(data, d => d.shocked)
    const totalImpact = totalAfter - totalBefore

    if (totalImpact > 0) {
      g.append('text')
        .attr('x', innerW).attr('y', innerH + 16).attr('text-anchor', 'end')
        .attr('fill', VIZ_COLORS.negative).attr('font-size', 10).attr('font-weight', 700)
        .text(`Monthly impact: +$${totalImpact.toFixed(0)}`)
    }

  }, [width, shock, shockCat])

  return (
    <VizCard title="Category Shock Simulator" description="What if a category rises? Watch the chart morph live.">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <select
          value={shockCat}
          onChange={e => setShockCat(e.target.value)}
          className="text-xs bg-slate-800 text-slate-200 rounded-lg px-2 py-1 border border-slate-700"
        >
          {MOCK_MOMENTUM.map(m => (
            <option key={m.category} value={m.category}>{m.category}</option>
          ))}
        </select>
        <input
          type="range" min={0} max={50} step={5} value={shock}
          onChange={e => setShock(parseInt(e.target.value))}
          className="flex-1 accent-brand h-1.5 min-w-[100px]"
        />
        <span className="text-xs font-mono text-slate-300 w-10 text-right">+{shock}%</span>
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
