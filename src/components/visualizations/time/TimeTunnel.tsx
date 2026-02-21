import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MONTHLY } from '../shared/mockData'

export function TimeTunnel() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const tooltip = d3.select(tooltipRef.current)

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

      // Full ring (background)
      const arc = d3.arc<unknown>()
        .innerRadius(r - thickness / 2)
        .outerRadius(r + thickness / 2)
        .startAngle(0)
        .endAngle(2 * Math.PI)

      g.append('path')
        .attr('d', arc({}) as string)
        .attr('fill', color)
        .attr('opacity', 0.15 + (i / data.length) * 0.6)

      // Expense proportion arc (filled portion)
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

      // Invisible hover ring (wider hit area)
      const hoverArc = d3.arc<unknown>()
        .innerRadius(r - thickness / 2 - 4)
        .outerRadius(r + thickness / 2 + 4)
        .startAngle(0)
        .endAngle(2 * Math.PI)

      g.append('path')
        .attr('d', hoverArc({}) as string)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          const savingsRate = ((surplus / d.income) * 100).toFixed(0)
          const expPctLabel = (expensePct * 100).toFixed(0)
          tooltip
            .style('opacity', '1')
            .style('left', `${event.offsetX + 14}px`)
            .style('top', `${event.offsetY - 10}px`)
            .html(`
              <div class="font-semibold">${d.label}</div>
              <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[11px]">
                <span class="opacity-60">Income</span><span class="text-right">$${d.income.toLocaleString()}</span>
                <span class="opacity-60">Expenses</span><span class="text-right">$${d.expenses.toLocaleString()}</span>
                <span class="opacity-60">Surplus</span><span class="text-right ${surplus >= 0 ? 'text-green-400' : 'text-red-400'}">$${surplus.toLocaleString()}</span>
                <span class="opacity-60">Exp. ratio</span><span class="text-right">${expPctLabel}%</span>
                <span class="opacity-60">Savings rate</span><span class="text-right">${savingsRate}%</span>
              </div>
            `)
        })
        .on('mousemove', (event: MouseEvent) => {
          tooltip
            .style('left', `${event.offsetX + 14}px`)
            .style('top', `${event.offsetY - 10}px`)
        })
        .on('mouseleave', () => {
          tooltip.style('opacity', '0')
        })

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
    <VizCard title="3D Time Tunnel" description="Fly through your financial history — hover any ring for details">
      <div ref={containerRef} className="w-full relative">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none opacity-0 transition-opacity duration-150 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10 z-20 whitespace-nowrap"
        />
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/50">
        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-semibold mb-2">How to read this</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-gray-500 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0 w-6 h-3 rounded-sm bg-gradient-to-r from-gray-300/40 to-gray-300/80 dark:from-slate-500/40 dark:to-slate-500/80" />
            <span><strong className="text-gray-700 dark:text-slate-300">Ring thickness</strong> = total spending. Thicker rings mean you spent more that month.</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0 flex gap-0.5">
              <div className="w-2 h-3 rounded-sm bg-green-500/70" />
              <div className="w-2 h-3 rounded-sm bg-amber-500/70" />
              <div className="w-2 h-3 rounded-sm bg-red-500/70" />
            </div>
            <span><strong className="text-gray-700 dark:text-slate-300">Colour</strong> = surplus. Green = good savings, amber = tight, red = overspent.</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0 w-6 h-3 rounded-sm overflow-hidden flex">
              <div className="w-4 h-full bg-brand/70" />
              <div className="w-2 h-full bg-brand/20" />
            </div>
            <span><strong className="text-gray-700 dark:text-slate-300">Filled arc</strong> = expense ratio. More filled = higher % of income spent.</span>
          </div>
        </div>
      </div>
    </VizCard>
  )
}
