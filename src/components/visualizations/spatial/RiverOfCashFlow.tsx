import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_CASH_FLOW } from '../shared/mockData'

interface SankeyNode {
  id: string
  x: number
  y: number
  dy: number
  value: number
}

export function RiverOfCashFlow() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 400

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 20, left: 20 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // Build nodes from links
    const nodeIds = new Set<string>()
    MOCK_CASH_FLOW.forEach(l => { nodeIds.add(l.source); nodeIds.add(l.target) })

    // Assign columns: source nodes left, target nodes right
    const columns: Record<string, number> = {
      'Salary': 0,
      'Total Income': 1,
      'Housing': 2, 'Groceries': 2, 'Transport': 2, 'Eating Out': 2,
      'Entertainment': 2, 'Shopping': 2, 'Health': 2, 'Utilities': 2,
      'Insurance': 2, 'Subscriptions': 2, 'Savings': 2,
      'Emergency Fund': 3, 'ETF Investment': 3, 'Travel Fund': 3,
    }

    const numCols = 4
    const colWidth = innerW / numCols
    const nodeWidth = 14

    // Calculate node values
    const nodeValues: Record<string, number> = {}
    MOCK_CASH_FLOW.forEach(l => {
      nodeValues[l.source] = (nodeValues[l.source] || 0) + l.value
    })
    MOCK_CASH_FLOW.forEach(l => {
      if (!nodeValues[l.target]) nodeValues[l.target] = l.value
    })

    // Position nodes
    const nodesByCol: Record<number, string[]> = {}
    nodeIds.forEach(id => {
      const col = columns[id] ?? 2
      if (!nodesByCol[col]) nodesByCol[col] = []
      nodesByCol[col].push(id)
    })

    // Sort each column by value descending
    Object.values(nodesByCol).forEach(arr => {
      arr.sort((a, b) => (nodeValues[b] || 0) - (nodeValues[a] || 0))
    })

    const nodes: Record<string, SankeyNode> = {}
    Object.entries(nodesByCol).forEach(([colStr, ids]) => {
      const col = parseInt(colStr)
      const totalValue = ids.reduce((s, id) => s + (nodeValues[id] || 0), 0)
      const scale = innerH / (totalValue * 1.3)
      let yOffset = 0
      ids.forEach(id => {
        const dy = (nodeValues[id] || 0) * scale
        nodes[id] = { id, x: col * colWidth, y: yOffset, dy, value: nodeValues[id] || 0 }
        yOffset += dy + 8
      })
      // Center vertically
      const totalH = yOffset - 8
      const offset = (innerH - totalH) / 2
      ids.forEach(id => { nodes[id].y += offset })
    })

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)
    const color = d3.scaleOrdinal<string>().range(VIZ_COLORS.categories)

    // Track output positions for each node
    const sourceOffsets: Record<string, number> = {}
    const targetOffsets: Record<string, number> = {}

    // Draw links
    MOCK_CASH_FLOW.forEach(link => {
      const s = nodes[link.source]
      const t = nodes[link.target]
      if (!s || !t) return

      const linkThickness = (link.value / s.value) * s.dy
      const sOffset = sourceOffsets[link.source] || 0
      const tThickness = (link.value / t.value) * t.dy
      const tOffset = targetOffsets[link.target] || 0

      const x0 = s.x + nodeWidth
      const y0 = s.y + sOffset + linkThickness / 2
      const x1 = t.x
      const y1 = t.y + tOffset + tThickness / 2
      const curvature = 0.5

      const xi = d3.interpolateNumber(x0, x1)
      const path = d3.path()
      path.moveTo(x0, y0 - linkThickness / 2)
      path.bezierCurveTo(xi(curvature), y0 - linkThickness / 2, xi(1 - curvature), y1 - tThickness / 2, x1, y1 - tThickness / 2)
      path.lineTo(x1, y1 + tThickness / 2)
      path.bezierCurveTo(xi(1 - curvature), y1 + tThickness / 2, xi(curvature), y0 + linkThickness / 2, x0, y0 + linkThickness / 2)
      path.closePath()

      g.append('path')
        .attr('d', path.toString())
        .attr('fill', color(link.target))
        .attr('opacity', 0.35)

      sourceOffsets[link.source] = sOffset + linkThickness
      targetOffsets[link.target] = tOffset + tThickness
    })

    // Draw nodes
    Object.values(nodes).forEach(n => {
      g.append('rect')
        .attr('x', n.x).attr('y', n.y)
        .attr('width', nodeWidth).attr('height', n.dy)
        .attr('rx', 3)
        .attr('fill', n.id === 'Savings' || n.id === 'ETF Investment' || n.id === 'Emergency Fund' || n.id === 'Travel Fund'
          ? VIZ_COLORS.positive : color(n.id))
        .attr('opacity', 0.9)

      // Label
      const labelX = columns[n.id] === 3 ? n.x + nodeWidth + 4 : columns[n.id] === 0 ? n.x - 4 : n.x + nodeWidth + 4
      const anchor = columns[n.id] === 0 ? 'end' : 'start'

      if (n.dy > 12) {
        g.append('text')
          .attr('x', labelX).attr('y', n.y + n.dy / 2)
          .attr('text-anchor', anchor)
          .attr('dominant-baseline', 'central')
          .attr('fill', VIZ_COLORS.text)
          .attr('font-size', 9)
          .attr('font-weight', 600)
          .text(`${n.id} $${(n.value / 1000).toFixed(1)}k`)
      }
    })

  }, [width])

  return (
    <VizCard title="River of Cash Flow" description="Money flowing from income through expenses to savings — see where the river leaks" fullWidth>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
