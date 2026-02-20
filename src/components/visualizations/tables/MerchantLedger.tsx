import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'
import { VizCard } from '../shared/VizCard'
import { MOCK_MERCHANTS } from '../shared/mockData'

function Sparkline({ data, color, width = 80, height = 24 }: { data: number[]; color: string; width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const x = d3.scaleLinear().domain([0, data.length - 1]).range([2, width - 2])
    const y = d3.scaleLinear().domain([0, d3.max(data)! * 1.1]).range([height - 2, 2])

    const line = d3.line<number>()
      .x((_, i) => x(i))
      .y(d => y(d))
      .curve(d3.curveMonotoneX)

    svg.append('path')
      .datum(data)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5)

  }, [data, color, width, height])

  return <svg ref={svgRef} width={width} height={height} />
}

export function MerchantLedger() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const merchants = MOCK_MERCHANTS.slice().sort((a, b) => b.totalSpend - a.totalSpend)
  const income = 7800 * 12

  return (
    <VizCard title="Expandable Merchant Ledger" description="Click a merchant to reveal analytics — seasonality, frequency, % of income">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              <th className="text-left py-2 pl-2 font-medium">Merchant</th>
              <th className="text-left py-2 font-medium">Category</th>
              <th className="text-right py-2 font-medium">Total</th>
              <th className="text-right py-2 font-medium">Txns</th>
              <th className="text-center py-2 pr-2 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map(m => {
              const isExpanded = expanded === m.name
              const pctOfIncome = ((m.totalSpend / income) * 100).toFixed(1)
              const avgTx = m.totalSpend / m.txCount
              // Opportunity cost: if invested in ETF at 10% p.a. over 1 year
              const opportunityCost = m.totalSpend * 0.10

              return (
                <tr key={m.name} className="group">
                  <td colSpan={5} className="p-0">
                    <div
                      className="flex items-center gap-2 px-2 py-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors rounded-lg"
                      onClick={() => setExpanded(isExpanded ? null : m.name)}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: m.color }} />
                      <span className="text-slate-200 font-medium flex-1">{m.name}</span>
                      <span className="text-slate-400 w-20">{m.category}</span>
                      <span className="text-slate-200 font-mono w-16 text-right">${m.totalSpend.toLocaleString()}</span>
                      <span className="text-slate-400 font-mono w-10 text-right">{m.txCount}</span>
                      <div className="w-20 flex justify-center">
                        <Sparkline data={m.monthlySpend} color={m.color} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-6 pb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-800/60 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-500 mb-0.5">% of Income</p>
                          <p className="text-sm font-bold text-slate-200">{pctOfIncome}%</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-500 mb-0.5">Avg Transaction</p>
                          <p className="text-sm font-bold text-slate-200">${avgTx.toFixed(0)}</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-500 mb-0.5">Frequency</p>
                          <p className="text-sm font-bold text-slate-200">{(m.txCount / 12).toFixed(1)}/mo</p>
                        </div>
                        <div className="bg-slate-800/60 rounded-xl p-2.5">
                          <p className="text-[10px] text-slate-500 mb-0.5">ETF Opportunity Cost</p>
                          <p className="text-sm font-bold text-emerald-400">${opportunityCost.toFixed(0)}/yr</p>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </VizCard>
  )
}
