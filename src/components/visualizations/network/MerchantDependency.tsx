import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_NETWORK_NODES, MOCK_NETWORK_LINKS } from '../shared/mockData'

interface ForceNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  group: string
  value: number
  r: number
}

interface ForceLink extends d3.SimulationLinkDatum<ForceNode> {
  value: number
}

export function MerchantDependency() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 400

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const cx = width / 2
    const cy = height / 2

    const groupColors: Record<string, string> = {
      you: VIZ_COLORS.brand,
      merchant: VIZ_COLORS.info,
      category: VIZ_COLORS.warning,
      location: VIZ_COLORS.positive,
    }

    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(MOCK_NETWORK_NODES, d => d.value)!])
      .range([6, 30])

    const nodes: ForceNode[] = MOCK_NETWORK_NODES.map(n => ({
      ...n,
      r: radiusScale(n.value),
    }))

    const nodeMap = new Map(nodes.map(n => [n.id, n]))

    const links: ForceLink[] = MOCK_NETWORK_LINKS.map(l => ({
      source: nodeMap.get(l.source)!,
      target: nodeMap.get(l.target)!,
      value: l.value,
    }))

    const linkScale = d3.scaleLinear()
      .domain([0, d3.max(MOCK_NETWORK_LINKS, l => l.value)!])
      .range([0.5, 3])

    const g = svg.append('g')

    // Links
    const linkEls = g.selectAll('.link')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', VIZ_COLORS.surfaceLight)
      .attr('stroke-width', d => linkScale(d.value))
      .attr('opacity', 0.4)

    // Node groups
    const nodeG = g.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')

    nodeG.append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => groupColors[d.group] || VIZ_COLORS.textDim)
      .attr('opacity', 0.7)
      .attr('stroke', d => groupColors[d.group] || VIZ_COLORS.textDim)
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.4)

    nodeG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.r + 12)
      .attr('fill', VIZ_COLORS.textMuted)
      .attr('font-size', d => d.group === 'you' ? 10 : 8)
      .attr('font-weight', d => d.group === 'you' ? 700 : 400)
      .text(d => d.label)

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<ForceNode, ForceLink>(links).id(d => d.id).distance(80))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(cx, cy))
      .force('collision', d3.forceCollide<ForceNode>().radius(d => d.r + 8))

    simulation.on('tick', () => {
      linkEls
        .attr('x1', d => (d.source as ForceNode).x!)
        .attr('y1', d => (d.source as ForceNode).y!)
        .attr('x2', d => (d.target as ForceNode).x!)
        .attr('y2', d => (d.target as ForceNode).y!)

      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Legend
    const legendData = [
      { label: 'You', color: groupColors.you },
      { label: 'Merchant', color: groupColors.merchant },
      { label: 'Category', color: groupColors.category },
      { label: 'Location', color: groupColors.location },
    ]
    legendData.forEach((l, i) => {
      svg.append('circle').attr('cx', 14).attr('cy', 14 + i * 16).attr('r', 4).attr('fill', l.color)
      svg.append('text').attr('x', 22).attr('y', 17 + i * 16)
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8).text(l.label)
    })

    return () => { simulation.stop() }
  }, [width])

  return (
    <VizCard title="Merchant Dependency Network" description="Force-directed graph — You → Merchant → Category → Location">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
