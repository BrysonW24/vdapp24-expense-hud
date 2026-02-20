import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_LIFESTYLE_DRIFT } from '../shared/mockData'

export function LifestyleDrift() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const height = 200

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_LIFESTYLE_DRIFT
    const cx = width / 2
    const cy = height - 20
    const radius = Math.min(width, height * 2) * 0.4

    // Scale: baseline of earliest year = 0°, max actual = 180°
    const maxVal = d3.max(data, d => Math.max(d.baseline, d.actual))!
    const minVal = d3.min(data, d => d.baseline)! * 0.9
    const angleScale = d3.scaleLinear().domain([minVal, maxVal]).range([-Math.PI / 2, Math.PI / 2])

    // Background arc
    const arcBg = d3.arc<unknown>()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2)

    const g = svg.append('g').attr('transform', `translate(${cx},${cy})`)

    g.append('path')
      .attr('d', arcBg({}) as string)
      .attr('fill', VIZ_COLORS.surfaceLight)

    // Baseline arc (green zone)
    const latestBaseline = data[data.length - 1].baseline
    const baselineArc = d3.arc<unknown>()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(angleScale(latestBaseline))

    g.append('path')
      .attr('d', baselineArc({}) as string)
      .attr('fill', VIZ_COLORS.positive)
      .attr('opacity', 0.3)

    // Actual arc (orange/red if drifting)
    const latestActual = data[data.length - 1].actual
    const drift = ((latestActual - latestBaseline) / latestBaseline) * 100
    const driftColor = drift > 15 ? VIZ_COLORS.negative : drift > 5 ? VIZ_COLORS.warning : VIZ_COLORS.positive

    const actualArc = d3.arc<unknown>()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(angleScale(latestActual))

    g.append('path')
      .attr('d', actualArc({}) as string)
      .attr('fill', driftColor)
      .attr('opacity', 0.8)

    // Needle for current actual
    const needleAngle = angleScale(latestActual) - Math.PI / 2
    const needleLen = radius - 30
    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', Math.cos(needleAngle) * needleLen)
      .attr('y2', Math.sin(needleAngle) * needleLen)
      .attr('stroke', driftColor)
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')

    // Center dot
    g.append('circle').attr('r', 4).attr('fill', driftColor)

    // Center text
    g.append('text')
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.text)
      .attr('font-size', 20)
      .attr('font-weight', 700)
      .text(`+${drift.toFixed(1)}%`)

    g.append('text')
      .attr('y', -8)
      .attr('text-anchor', 'middle')
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 10)
      .text('lifestyle drift')

    // Labels
    g.append('text')
      .attr('x', -radius + 5)
      .attr('y', 14)
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 9)
      .text(`$${(minVal / 1000).toFixed(1)}k`)

    g.append('text')
      .attr('x', radius - 5)
      .attr('y', 14)
      .attr('text-anchor', 'end')
      .attr('fill', VIZ_COLORS.textDim)
      .attr('font-size', 9)
      .text(`$${(maxVal! / 1000).toFixed(1)}k`)

  }, [width])

  return (
    <VizCard title="Lifestyle Drift Meter" description="Detecting lifestyle creep — baseline vs actual monthly spend">
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
