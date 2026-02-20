import { useRef, useEffect, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_TRANSACTIONS } from '../shared/mockData'

const ALL_CATEGORIES = [...new Set(MOCK_TRANSACTIONS.map(t => t.category))].sort()

export function FilterPlayground() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(ALL_CATEGORIES))
  const [minAmount, setMinAmount] = useState(0)
  const [onlyImpulse, setOnlyImpulse] = useState(false)
  const height = 350

  const filtered = useMemo(() => {
    return MOCK_TRANSACTIONS.filter(t => {
      if (!selectedCats.has(t.category)) return false
      if (t.amount < minAmount) return false
      if (onlyImpulse && t.type !== 'emotional') return false
      return true
    })
  }, [selectedCats, minAmount, onlyImpulse])

  // Aggregate by category
  const aggregated = useMemo(() => {
    const byCategory = d3.rollup(filtered, v => d3.sum(v, t => t.amount), t => t.category)
    return Array.from(byCategory, ([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [filtered])

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 10, right: 15, bottom: 25, left: 90 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    if (aggregated.length === 0) {
      svg.append('text')
        .attr('x', width / 2).attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 12)
        .text('No transactions match filters')
      return
    }

    const y = d3.scaleBand()
      .domain(aggregated.map(d => d.category))
      .range([0, innerH])
      .padding(0.2)

    const x = d3.scaleLinear()
      .domain([0, d3.max(aggregated, d => d.total)! * 1.1])
      .range([0, innerW])

    const color = d3.scaleOrdinal<string>().range(VIZ_COLORS.categories)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    aggregated.forEach(d => {
      const barY = y(d.category)!

      g.append('rect')
        .attr('x', 0).attr('y', barY)
        .attr('width', x(d.total)).attr('height', y.bandwidth())
        .attr('rx', 4)
        .attr('fill', color(d.category))
        .attr('opacity', 0.75)

      g.append('text')
        .attr('x', -6).attr('y', barY + y.bandwidth() / 2)
        .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
        .attr('fill', VIZ_COLORS.text).attr('font-size', 10)
        .text(d.category)

      if (x(d.total) > 40) {
        g.append('text')
          .attr('x', x(d.total) - 6).attr('y', barY + y.bandwidth() / 2)
          .attr('text-anchor', 'end').attr('dominant-baseline', 'central')
          .attr('fill', '#fff').attr('font-size', 9).attr('font-weight', 600)
          .text(`$${d.total.toLocaleString()}`)
      }
    })

    // Total
    const total = d3.sum(aggregated, d => d.total)
    g.append('text')
      .attr('x', innerW).attr('y', innerH + 16).attr('text-anchor', 'end')
      .attr('fill', VIZ_COLORS.textMuted).attr('font-size', 10).attr('font-weight', 600)
      .text(`Total: $${total.toLocaleString()} · ${filtered.length} txns`)

  }, [width, aggregated, filtered.length])

  function toggleCat(cat: string) {
    setSelectedCats(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <VizCard title="Filter Playground" description="Dynamic interactive filters — charts animate live as you toggle">
      <div className="space-y-3 mb-4">
        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => toggleCat(cat)}
              className={`text-[10px] px-2.5 py-1 rounded-full transition-colors font-medium ${
                selectedCats.has(cat)
                  ? 'bg-brand/20 text-brand border border-brand/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {/* Sliders and toggles */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Min $:</span>
            <input
              type="range" min={0} max={500} step={50} value={minAmount}
              onChange={e => setMinAmount(parseInt(e.target.value))}
              className="w-24 accent-brand h-1.5"
            />
            <span className="text-xs font-mono text-slate-300 w-8">${minAmount}</span>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox" checked={onlyImpulse}
              onChange={e => setOnlyImpulse(e.target.checked)}
              className="accent-brand"
            />
            Impulse only
          </label>
        </div>
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
