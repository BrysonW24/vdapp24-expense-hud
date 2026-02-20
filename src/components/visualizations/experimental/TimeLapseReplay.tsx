import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useContainerSize } from '../shared/useContainerSize'
import { VizCard } from '../shared/VizCard'
import { VIZ_COLORS } from '../shared/theme'
import { MOCK_MONTHLY } from '../shared/mockData'

export function TimeLapseReplay() {
  const { containerRef, width } = useContainerSize()
  const svgRef = useRef<SVGSVGElement>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const height = 350

  const play = useCallback(() => {
    setPlaying(true)
    setCurrentIdx(0)
    let idx = 0
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      idx++
      if (idx >= MOCK_MONTHLY.length) {
        clearInterval(timerRef.current!)
        setPlaying(false)
        return
      }
      setCurrentIdx(idx)
    }, 600)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (!svgRef.current || width === 0) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const data = MOCK_MONTHLY.slice(0, currentIdx + 1)
    const margin = { top: 30, right: 15, bottom: 30, left: 50 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    const x = d3.scaleBand()
      .domain(MOCK_MONTHLY.map(d => d.label))
      .range([0, innerW])
      .padding(0.2)

    const maxExpense = d3.max(MOCK_MONTHLY, d => d.expenses)!
    const y = d3.scaleLinear().domain([0, maxExpense * 1.1]).range([innerH, 0])

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // All bar slots (dimmed)
    MOCK_MONTHLY.forEach(d => {
      g.append('rect')
        .attr('x', x(d.label)!).attr('y', 0)
        .attr('width', x.bandwidth()).attr('height', innerH)
        .attr('rx', 4)
        .attr('fill', VIZ_COLORS.surfaceLight)
        .attr('opacity', 0.3)
    })

    // Active bars
    data.forEach((d, i) => {
      const surplus = d.income - d.expenses
      const color = surplus > 2500 ? VIZ_COLORS.positive : surplus > 1500 ? VIZ_COLORS.warning : VIZ_COLORS.negative
      const isLatest = i === data.length - 1

      g.append('rect')
        .attr('x', x(d.label)!).attr('y', y(d.expenses))
        .attr('width', x.bandwidth()).attr('height', innerH - y(d.expenses))
        .attr('rx', 4)
        .attr('fill', color)
        .attr('opacity', isLatest ? 0.9 : 0.6)

      // Amount on top
      if (isLatest) {
        g.append('text')
          .attr('x', x(d.label)! + x.bandwidth() / 2).attr('y', y(d.expenses) - 8)
          .attr('text-anchor', 'middle')
          .attr('fill', VIZ_COLORS.text).attr('font-size', 11).attr('font-weight', 700)
          .text(`$${(d.expenses / 1000).toFixed(1)}k`)
      }
    })

    // Month labels
    MOCK_MONTHLY.forEach(d => {
      g.append('text')
        .attr('x', x(d.label)! + x.bandwidth() / 2)
        .attr('y', innerH + 16)
        .attr('text-anchor', 'middle')
        .attr('fill', VIZ_COLORS.textDim).attr('font-size', 8)
        .text(d.label)
    })

    // Y axis
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat(d => `$${(d as number) / 1000}k`)
    g.append('g').call(yAxis)
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text').attr('fill', VIZ_COLORS.textDim).attr('font-size', 9))
      .call(g => g.selectAll('.tick line').attr('stroke', VIZ_COLORS.surfaceLight))

    // Current month header
    const current = data[data.length - 1]
    svg.append('text')
      .attr('x', margin.left).attr('y', 18)
      .attr('fill', VIZ_COLORS.text).attr('font-size', 13).attr('font-weight', 700)
      .text(current.label)

    svg.append('text')
      .attr('x', margin.left + 60).attr('y', 18)
      .attr('fill', VIZ_COLORS.textDim).attr('font-size', 10)
      .text(`Saved $${(current.savings / 1000).toFixed(1)}k`)

  }, [width, currentIdx])

  return (
    <VizCard title="Time-Lapse Replay" description="Replay last year's spending in 7 seconds — like Spotify Wrapped for your money">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={play}
          disabled={playing}
          className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white font-medium disabled:opacity-50 transition-opacity"
        >
          {playing ? 'Playing...' : 'Replay'}
        </button>
        <input
          type="range" min={0} max={MOCK_MONTHLY.length - 1} value={currentIdx}
          onChange={e => { if (!playing) setCurrentIdx(parseInt(e.target.value)) }}
          className="flex-1 accent-brand h-1.5"
          disabled={playing}
        />
        <span className="text-xs text-slate-400 w-14 text-right">
          {MOCK_MONTHLY[currentIdx]?.label}
        </span>
      </div>
      <div ref={containerRef} className="w-full">
        <svg ref={svgRef} width={width} height={height} className="overflow-visible" />
      </div>
    </VizCard>
  )
}
