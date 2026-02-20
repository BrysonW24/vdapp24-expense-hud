import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_TRANSACTIONS } from '../shared/mockData'

export function ImpulseVsIntent() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 350

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 30, right: 20, bottom: 30, left: 20 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    // Aggregate by type
    type TxType = 'planned' | 'necessary' | 'emotional' | 'opportunistic'
    const byType = d3.rollup(
      MOCK_TRANSACTIONS,
      v => ({ total: d3.sum(v, t => t.amount), count: v.length }),
      t => t.type,
    )

    const typeConfig: Record<TxType, { label: string; x: number; y: number; color: string }> = {
      planned:       { label: 'Planned',       x: 0.25, y: 0.25, color: VIZ_COLORS.positive },
      necessary:     { label: 'Necessary',     x: 0.75, y: 0.25, color: VIZ_COLORS.info },
      emotional:     { label: 'Emotional',     x: 0.25, y: 0.75, color: VIZ_COLORS.negative },
      opportunistic: { label: 'Opportunistic', x: 0.75, y: 0.75, color: VIZ_COLORS.warning },
    }

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Quadrant grid
    g.append('line').attr('x1', innerW / 2).attr('x2', innerW / 2).attr('y1', 0).attr('y2', innerH)
      .attr('stroke', VIZ_COLORS.surfaceLight).attr('stroke-width', 1)
    g.append('line').attr('x1', 0).attr('x2', innerW).attr('y1', innerH / 2).attr('y2', innerH / 2)
      .attr('stroke', VIZ_COLORS.surfaceLight).attr('stroke-width', 1)

    // Axis labels
    g.append('text').attr('x', innerW / 2).attr('y', -10).attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 9).text('← Intentional vs Reactive →')
    g.append('text').attr('x', -10).attr('y', innerH / 2).attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 9)
      .attr('transform', `rotate(-90, -10, ${innerH / 2})`)
      .text('← Essential vs Discretionary →')

    const maxTotal = d3.max(Array.from(byType.values()), d => d.total) || 1

    // Bubbles
    const bubbleData = Array.from(byType.entries()).map(([type, data]) => {
      const cfg = typeConfig[type as TxType]
      const r = 20 + (data.total / maxTotal) * 40
      return {
        type: type as TxType,
        total: data.total,
        count: data.count,
        x: cfg.x * innerW,
        y: cfg.y * innerH,
        r,
      }
    })

    // Draw bubbles (no simulation needed — fixed positions)
    bubbleData.forEach(b => {
      const cfg = typeConfig[b.type]

      g.append('circle')
        .attr('cx', b.x).attr('cy', b.y).attr('r', b.r)
        .attr('fill', cfg.color).attr('opacity', 0.2)

      g.append('circle')
        .attr('cx', b.x).attr('cy', b.y).attr('r', b.r * 0.7)
        .attr('fill', cfg.color).attr('opacity', 0.3)

      g.append('text')
        .attr('x', b.x).attr('y', b.y - 8).attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.text).attr('font-size', 11).attr('font-weight', 700)
        .text(cfg.label)

      g.append('text')
        .attr('x', b.x).attr('y', b.y + 8).attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textMuted).attr('font-size', 10)
        .text(`$${(b.total / 1000).toFixed(1)}k`)

      g.append('text')
        .attr('x', b.x).attr('y', b.y + 20).attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8)
        .text(`${b.count} txns`)
    })

  }, [width])

  return (
    <VizCard title="Impulse vs Intent" description="Spending psychology — planned, necessary, emotional, and opportunistic purchases" fullWidth>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
