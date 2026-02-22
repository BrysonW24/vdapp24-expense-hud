import { useRef, useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { clsx } from 'clsx'

// Spatial
import { LogoGalaxy } from '@/components/visualizations/spatial/LogoGalaxy'
import { ExpenseCity } from '@/components/visualizations/spatial/ExpenseCity'
import { RiverOfCashFlow } from '@/components/visualizations/spatial/RiverOfCashFlow'
// Time
import { FinancialECG } from '@/components/visualizations/time/FinancialECG'
import { TimeTunnel } from '@/components/visualizations/time/TimeTunnel'
import { SubscriptionOrbit } from '@/components/visualizations/time/SubscriptionOrbit'
// Behaviour
import { LifestyleDrift } from '@/components/visualizations/behaviour/LifestyleDrift'
import { ImpulseVsIntent } from '@/components/visualizations/behaviour/ImpulseVsIntent'
import { CategoryMomentum } from '@/components/visualizations/behaviour/CategoryMomentum'
// Network
import { MerchantDependency } from '@/components/visualizations/network/MerchantDependency'
import { IncomeExpenseEnergy } from '@/components/visualizations/network/IncomeExpenseEnergy'
// Emotional
import { FinancialMoodMap } from '@/components/visualizations/emotional/FinancialMoodMap'
import { FutureYou } from '@/components/visualizations/emotional/FutureYou'
// Tables
import { MerchantLedger } from '@/components/visualizations/tables/MerchantLedger'
import { TransactionTimeline } from '@/components/visualizations/tables/TransactionTimeline'
import { FilterPlayground } from '@/components/visualizations/tables/FilterPlayground'
// Predictive
import { RunwayBurn } from '@/components/visualizations/predictive/RunwayBurn'
import { CategoryShock } from '@/components/visualizations/predictive/CategoryShock'
import { InterestSensitivity } from '@/components/visualizations/predictive/InterestSensitivity'
// Experimental
import { MoneyParticles } from '@/components/visualizations/experimental/MoneyParticles'
import { TimeLapseReplay } from '@/components/visualizations/experimental/TimeLapseReplay'
import { SpendingDNA } from '@/components/visualizations/experimental/SpendingDNA'

const SECTIONS = [
  {
    id: 'spatial',
    label: 'Spatial',
    title: 'Spatial — Make Money Physical',
    description: 'Visualise spending as physical objects, cities, and flowing rivers.',
  },
  {
    id: 'time',
    label: 'Time',
    title: 'Time-Based — Financial Heartbeat',
    description: 'See your spending pulse, orbit through subscriptions, and tunnel through history.',
  },
  {
    id: 'behaviour',
    label: 'Behaviour',
    title: 'Behaviour & Patterns',
    description: 'Detect lifestyle creep, impulse spending, and category momentum.',
  },
  {
    id: 'network',
    label: 'Network',
    title: 'Network & Relationships',
    description: 'Map merchant dependencies and energy flow between income and expenses.',
  },
  {
    id: 'emotional',
    label: 'Emotional',
    title: 'Emotional Layer',
    description: 'Financial mood tracking and future-self projections.',
  },
  {
    id: 'tables',
    label: 'Tables',
    title: 'Advanced Tables',
    description: 'Interactive ledgers, timelines, and filter playgrounds — not boring tables.',
  },
  {
    id: 'predictive',
    label: 'Predictive',
    title: 'Predictive Modelling',
    description: 'Runway simulations, category shocks, and interest sensitivity analysis.',
  },
  {
    id: 'experimental',
    label: 'Experimental',
    title: 'Experimental & Abstract',
    description: 'Particles, time-lapse replays, and spending DNA fingerprints.',
  },
] as const

export function VisualizationsPage() {
  const [activeSection, setActiveSection] = useState('spatial')
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const navRef = useRef<HTMLDivElement>(null)

  // IntersectionObserver scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 },
    )

    Object.values(sectionRefs.current).forEach(el => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8">
        {/* Decorative dots */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-brand animate-pulse"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 53) % 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
                <Eye size={16} className="text-brand" />
              </div>
              <span className="text-xs font-semibold text-brand uppercase tracking-wider">Gallery</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              22 Interactive Visualizations
            </h1>
            <p className="text-sm text-gray-400 max-w-lg leading-relaxed">
              Your finances brought to life — spatial cityscapes, heartbeat rhythms, mood maps, spending DNA, and more. Every chart is interactive and driven by your real data.
            </p>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="text-[11px] px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-brand/20 hover:text-brand hover:border-brand/30 transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky nav pills */}
      <div
        ref={navRef}
        className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-gray-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800"
      >
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={clsx(
                'text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors font-medium',
                activeSection === s.id
                  ? 'bg-brand text-white'
                  : 'text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spatial */}
      <section id="spatial" ref={el => { sectionRefs.current.spatial = el }}>
        <SectionHeader title={SECTIONS[0].title} description={SECTIONS[0].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <LogoGalaxy />
          <ExpenseCity />
          <div className="lg:col-span-2">
            <RiverOfCashFlow />
          </div>
        </div>
      </section>

      {/* Time */}
      <section id="time" ref={el => { sectionRefs.current.time = el }}>
        <SectionHeader title={SECTIONS[1].title} description={SECTIONS[1].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="lg:col-span-2">
            <FinancialECG />
          </div>
          <TimeTunnel />
          <SubscriptionOrbit />
        </div>
      </section>

      {/* Behaviour */}
      <section id="behaviour" ref={el => { sectionRefs.current.behaviour = el }}>
        <SectionHeader title={SECTIONS[2].title} description={SECTIONS[2].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <LifestyleDrift />
          <CategoryMomentum />
          <div className="lg:col-span-2">
            <ImpulseVsIntent />
          </div>
        </div>
      </section>

      {/* Network */}
      <section id="network" ref={el => { sectionRefs.current.network = el }}>
        <SectionHeader title={SECTIONS[3].title} description={SECTIONS[3].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <MerchantDependency />
          <IncomeExpenseEnergy />
        </div>
      </section>

      {/* Emotional */}
      <section id="emotional" ref={el => { sectionRefs.current.emotional = el }}>
        <SectionHeader title={SECTIONS[4].title} description={SECTIONS[4].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <FinancialMoodMap />
          <FutureYou />
        </div>
      </section>

      {/* Tables */}
      <section id="tables" ref={el => { sectionRefs.current.tables = el }}>
        <SectionHeader title={SECTIONS[5].title} description={SECTIONS[5].description} />
        <div className="grid grid-cols-1 gap-4 mt-4">
          <MerchantLedger />
          <TransactionTimeline />
          <FilterPlayground />
        </div>
      </section>

      {/* Predictive */}
      <section id="predictive" ref={el => { sectionRefs.current.predictive = el }}>
        <SectionHeader title={SECTIONS[6].title} description={SECTIONS[6].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <div className="lg:col-span-2">
            <RunwayBurn />
          </div>
          <CategoryShock />
          <InterestSensitivity />
        </div>
      </section>

      {/* Experimental */}
      <section id="experimental" ref={el => { sectionRefs.current.experimental = el }}>
        <SectionHeader title={SECTIONS[7].title} description={SECTIONS[7].description} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <MoneyParticles />
          <TimeLapseReplay />
          <div className="lg:col-span-2">
            <SpendingDNA />
          </div>
        </div>
      </section>
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pt-2">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{description}</p>
    </div>
  )
}
