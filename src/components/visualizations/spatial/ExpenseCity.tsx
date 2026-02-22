import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MERCHANTS } from '../shared/mockData'

export function ExpenseCity() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // Group by category
    const byCategory = d3.rollup(MOCK_MERCHANTS, v => d3.sum(v, m => m.totalSpend), m => m.category)
    const root = d3.hierarchy({ name: 'root', children: Array.from(byCategory, ([name, value]) => ({ name, value })) })
      .sum(d => (d as { value?: number }).value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    const margin = { top: 10, right: 10, bottom: 30, left: 10 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    type TreeNode = { name: string; children?: { name: string; value: number }[] }
    d3.treemap<TreeNode>()
      .size([innerW, innerH])
      .padding(3)
      .round(true)(root as d3.HierarchyNode<TreeNode>)

    const color = d3.scaleOrdinal<string>().range(VIZ_COLORS.categories)
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const leaves = root.leaves() as d3.HierarchyRectangularNode<TreeNode>[]
    leaves.forEach(leaf => {
      const x0 = leaf.x0, y0 = leaf.y0, x1 = leaf.x1, y1 = leaf.y1
      const w = x1 - x0
      const h = y1 - y0
      const name = (leaf.data as { name: string }).name
      const c = color(name)

      // Building base
      g.append('rect')
        .attr('x', x0).attr('y', y0).attr('width', w).attr('height', h)
        .attr('rx', 4)
        .attr('fill', c)
        .attr('opacity', 0.75)

      // Building "windows" pattern
      const windowSize = 4
      const windowGap = 6
      if (w > 30 && h > 30) {
        for (let wx = x0 + 8; wx < x1 - 8; wx += windowGap + windowSize) {
          for (let wy = y0 + 22; wy < y1 - 8; wy += windowGap + windowSize) {
            g.append('rect')
              .attr('x', wx).attr('y', wy)
              .attr('width', windowSize).attr('height', windowSize)
              .attr('rx', 1)
              .attr('fill', '#fff')
              .attr('opacity', 0.15 + Math.random() * 0.15)
          }
        }
      }

      // Label
      if (w > 40 && h > 20) {
        g.append('text')
          .attr('x', x0 + 6).attr('y', y0 + 14)
          .attr('fill', '#fff')
          .attr('font-size', Math.min(11, w / 6))
          .attr('font-weight', 600)
          .text(name)
      }

      // Amount
      if (w > 50 && h > 35) {
        g.append('text')
          .attr('x', x0 + 6).attr('y', y1 - 6)
          .attr('fill', '#fff')
          .attr('font-size', 9)
          .attr('opacity', 0.7)
          .text(`$${((leaf.value || 0) / 1000).toFixed(1)}k`)
      }
    })

    // Ground line
    g.append('line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', innerH + 2).attr('y2', innerH + 2)
      .attr('stroke', VIZ_COLORS.textDim)
      .attr('stroke-width', 1)
      .attr('opacity', 0.3)

    g.append('text')
      .attr('x', innerW / 2).attr('y', innerH + 18)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 9)
      .text('Expense City — larger blocks = more spend')

  }, [width])

  return (
    <VizCard title="Expense Heatmap City" description="Spending rendered as a city — taller/denser buildings mean more spend">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
