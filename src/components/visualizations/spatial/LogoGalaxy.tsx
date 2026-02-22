import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { MOCK_MERCHANTS } from '../shared/mockData'

interface MerchantNode extends d3.SimulationNodeDatum {
  name: string
  category: string
  totalSpend: number
  txCount: number
  color: string
  r: number
}

export function LogoGalaxy() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 400

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const cx = width / 2
    const cy = height / 2

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(MOCK_MERCHANTS, d => d.totalSpend)!])
      .range([12, 45])

    const nodes: MerchantNode[] = MOCK_MERCHANTS.map(m => ({
      ...m,
      r: radiusScale(m.totalSpend),
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
    }))

    const g = svg.append('g')

    // Glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')
    const merge = filter.append('feMerge')
    merge.append('feMergeNode').attr('in', 'blur')
    merge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Node groups
    const nodeG = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')

    // Outer glow
    nodeG.append('circle')
      .attr('r', d => d.r + 4)
      .attr('fill', d => d.color)
      .attr('opacity', d => {
        const recentSpend = d.totalSpend / 12
        return recentSpend > 400 ? 0.2 : 0.08
      })
      .attr('filter', 'url(#glow)')

    // Main orb
    nodeG.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => d.color)
      .attr('opacity', 0.7)
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)

    // Inner highlight
    nodeG.append('circle')
      .attr('r', d => d.r * 0.6)
      .attr('fill', d => d.color)
      .attr('opacity', 0.3)

    // Label
    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -3)
      .attr('fill', '#fff')
      .attr('font-size', d => Math.max(7, Math.min(10, d.r / 3)))
      .attr('font-weight', 600)
      .text(d => d.name.length > 10 ? d.name.slice(0, 9) + '…' : d.name)

    // Amount
    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 9)
      .attr('fill', '#fff')
      .attr('font-size', d => Math.max(7, Math.min(9, d.r / 3.5)))
      .attr('opacity', 0.7)
      .text(d => `$${(d.totalSpend / 1000).toFixed(1)}k`)

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('center', d3.forceCenter(cx, cy))
      .force('charge', d3.forceManyBody().strength(-5))
      .force('collision', d3.forceCollide<MerchantNode>().radius(d => d.r + 4))
      .force('x', d3.forceX(cx).strength(0.05))
      .force('y', d3.forceY(cy).strength(0.05))

    simulation.on('tick', () => {
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    return () => { simulation.stop() }
  }, [width])

  return (
    <VizCard title="Logo Galaxy" description="Each merchant is a floating orb — size = total spend, glow = recent activity">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
