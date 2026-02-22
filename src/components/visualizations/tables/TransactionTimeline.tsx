import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_TRANSACTIONS } from '../shared/mockData'

export function TransactionTimeline() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)

  // Take last 60 transactions sorted by date
  const txns = MOCK_TRANSACTIONS.slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60)

  const height = Math.max(400, txns.length * 14 + 40)

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 15, right: 15, bottom: 15, left: 70 }

    const maxAmount = d3.max(txns, t => t.amount)!
    const radiusScale = d3.scaleSqrt().domain([0, maxAmount]).range([3, 16])
    const color = d3.scaleOrdinal<string>().range(VIZ_COLORS.categories)

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Timeline line
    g.append('line')
      .attr('x1', 0).attr('x2', 0)
      .attr('y1', 0).attr('y2', txns.length * 14)
      .attr('stroke', VIZ_COLORS.surfaceLight)
      .attr('stroke-width', 2)

    let lastDate = ''
    txns.forEach((tx, i) => {
      const y = i * 14
      const r = radiusScale(tx.amount)

      // Date label (only on date change)
      if (tx.date !== lastDate) {
        g.append('text')
          .attr('x', -8).attr('y', y + 4)
          .attr('text-anchor', 'end')
          .attr('fill', VIZ_COLORS.textDim)
          .attr('font-size', 8)
          .text(tx.date.slice(5)) // MM-DD
        lastDate = tx.date
      }

      // Circle on timeline
      g.append('circle')
        .attr('cx', 0).attr('cy', y)
        .attr('r', r)
        .attr('fill', color(tx.category))
        .attr('opacity', 0.7)

      // Merchant + amount
      g.append('text')
        .attr('x', r + 8).attr('y', y + 3)
        .attr('fill', VIZ_COLORS.text)
        .attr('font-size', 9)
        .text(`${tx.merchant} — $${tx.amount}`)
    })

  }, [width])

  return (
    <VizCard title="Transaction Timeline" description="Scroll through transactions like a memory — big purchases enlarge, small ones shrink">
      <div ref={containerRef} className="w-full overflow-y-auto max-h-[500px]">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
