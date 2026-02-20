import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'

const ENERGY_NODES = [
  { id: 'salary', label: 'Salary', col: 0, value: 7800 },
  { id: 'housing', label: 'Housing', col: 1, value: 1800 },
  { id: 'groceries', label: 'Groceries', col: 1, value: 1100 },
  { id: 'transport', label: 'Transport', col: 1, value: 450 },
  { id: 'eating-out', label: 'Eating Out', col: 1, value: 380 },
  { id: 'other-exp', label: 'Other Exp', col: 1, value: 1135 },
  { id: 'savings', label: 'Savings', col: 2, value: 2935 },
]

const ENERGY_LINKS = [
  { source: 'salary', target: 'housing', value: 1800 },
  { source: 'salary', target: 'groceries', value: 1100 },
  { source: 'salary', target: 'transport', value: 450 },
  { source: 'salary', target: 'eating-out', value: 380 },
  { source: 'salary', target: 'other-exp', value: 1135 },
  { source: 'salary', target: 'savings', value: 2935 },
]

export function IncomeExpenseEnergy() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 80, bottom: 20, left: 80 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Position nodes by column
    const cols: Record<number, typeof ENERGY_NODES> = {}
    ENERGY_NODES.forEach(n => {
      if (!cols[n.col]) cols[n.col] = []
      cols[n.col].push(n)
    })

    const nodePositions: Record<string, { x: number; y: number; h: number }> = {}
    const maxVal = 7800
    const colX = [0, innerW / 2, innerW]

    Object.entries(cols).forEach(([colStr, nodes]) => {
      const col = parseInt(colStr)
      const totalH = nodes.reduce((s, n) => s + (n.value / maxVal) * innerH, 0) + (nodes.length - 1) * 8
      let yOff = (innerH - totalH) / 2

      nodes.forEach(n => {
        const h = (n.value / maxVal) * innerH
        nodePositions[n.id] = { x: colX[col], y: yOff, h }
        yOff += h + 8
      })
    })

    const color = d3.scaleOrdinal<string>().range(VIZ_COLORS.categories)
    const nodeW = 16

    // Draw links
    let sourceYOff = nodePositions['salary'].y
    ENERGY_LINKS.forEach(link => {
      const s = nodePositions[link.source]
      const t = nodePositions[link.target]
      const thickness = (link.value / maxVal) * innerH

      const x0 = s.x + nodeW
      const y0 = sourceYOff + thickness / 2
      const x1 = t.x
      const y1 = t.y + t.h / 2

      const xi = d3.interpolateNumber(x0, x1)
      const path = d3.path()
      path.moveTo(x0, y0 - thickness / 2)
      path.bezierCurveTo(xi(0.5), y0 - thickness / 2, xi(0.5), y1 - t.h / 2, x1, y1 - t.h / 2)
      path.lineTo(x1, y1 + t.h / 2)
      path.bezierCurveTo(xi(0.5), y1 + t.h / 2, xi(0.5), y0 + thickness / 2, x0, y0 + thickness / 2)
      path.closePath()

      const isGreen = link.target === 'savings'
      g.append('path')
        .attr('d', path.toString())
        .attr('fill', isGreen ? VIZ_COLORS.positive : color(link.target))
        .attr('opacity', 0.3)

      sourceYOff += thickness
    })

    // Draw nodes
    ENERGY_NODES.forEach(n => {
      const pos = nodePositions[n.id]
      const isGreen = n.id === 'savings'
      const c = isGreen ? VIZ_COLORS.positive : n.id === 'salary' ? VIZ_COLORS.brand : color(n.id)

      g.append('rect')
        .attr('x', pos.x).attr('y', pos.y).attr('width', nodeW).attr('height', pos.h)
        .attr('rx', 4).attr('fill', c).attr('opacity', 0.9)

      // Label
      const anchor = n.col === 0 ? 'end' : 'start'
      const lx = n.col === 0 ? pos.x - 6 : pos.x + nodeW + 6

      g.append('text')
        .attr('x', lx).attr('y', pos.y + pos.h / 2 - 6)
        .attr('text-anchor', anchor)
        .attr('fill', VIZ_COLORS.text)
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .text(n.label)

      g.append('text')
        .attr('x', lx).attr('y', pos.y + pos.h / 2 + 8)
        .attr('text-anchor', anchor)
        .attr('fill', VIZ_COLORS.textDim)
        .attr('font-size', 9)
        .text(`$${(n.value / 1000).toFixed(1)}k`)
    })

  }, [width])

  return (
    <VizCard title="Income-to-Expense Energy Map" description="Energy flow from income through expenses to savings — thickness = money volume">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
