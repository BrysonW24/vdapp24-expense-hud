// finance.ts — Pure math functions for wealth calculations

// ─── Mortgage ────────────────────────────────────────────────────────────────

/** Monthly P&I repayment */
export function monthlyRepayment(principal: number, annualRate: number, termYears: number): number {
  if (annualRate === 0) return principal / (termYears * 12)
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

/** Monthly interest-only repayment */
export function monthlyIORepayment(principal: number, annualRate: number): number {
  return (principal * (annualRate / 100)) / 12
}

/** Effective loan balance = loanAmount - offsetBalance */
export function effectiveLoan(loanAmount: number, offsetBalance: number): number {
  return Math.max(0, loanAmount - offsetBalance)
}

/** LVR as a percentage */
export function lvr(loanAmount: number, propertyValue: number): number {
  if (propertyValue === 0) return 0
  return (loanAmount / propertyValue) * 100
}

/** Equity */
export function equity(propertyValue: number, loanAmount: number): number {
  return propertyValue - loanAmount
}

/** Gross rental yield % */
export function grossYield(weeklyRent: number, propertyValue: number): number {
  if (propertyValue === 0) return 0
  return ((weeklyRent * 52) / propertyValue) * 100
}

/** Net rental yield % */
export function netYield(weeklyRent: number, vacancyRate: number, monthlyRunningCosts: number, propertyValue: number): number {
  if (propertyValue === 0) return 0
  const annualIncome = weeklyRent * 52 * (1 - vacancyRate / 100)
  const annualCosts = monthlyRunningCosts * 12
  return ((annualIncome - annualCosts) / propertyValue) * 100
}

/** Monthly cash flow (positive = surplus) */
export function monthlyCashFlow(weeklyRent: number, vacancyRate: number, monthlyRepaymentAmt: number, monthlyRunningCosts: number): number {
  const monthlyRent = (weeklyRent * 52 / 12) * (1 - vacancyRate / 100)
  return monthlyRent - monthlyRepaymentAmt - monthlyRunningCosts
}

// ─── FIRE ────────────────────────────────────────────────────────────────────

/** FIRE number using the 4% rule */
export function fireNumber(annualExpenses: number): number {
  return annualExpenses * 25
}

/** Fat FIRE number (2× expenses rule) */
export function fatFireNumber(annualExpenses: number): number {
  return annualExpenses * 50
}

/**
 * Coast FIRE number: how much you need NOW for it to compound to FIRE number
 * without further contributions.
 */
export function coastFireNumber(
  fireNum: number,
  annualReturn: number,
  yearsToPreservationAge: number,
): number {
  const r = annualReturn / 100
  return fireNum / Math.pow(1 + r, yearsToPreservationAge)
}

/**
 * Returns fractional years until net worth compounds to target,
 * given monthly savings added to existing net worth.
 * Returns Infinity if it can never be reached.
 */
export function yearsToTarget(
  currentNetWorth: number,
  targetNetWorth: number,
  annualReturn: number,
  monthlySavings: number,
): number {
  if (currentNetWorth >= targetNetWorth) return 0
  const r = annualReturn / 100 / 12
  if (r === 0) {
    if (monthlySavings <= 0) return Infinity
    return (targetNetWorth - currentNetWorth) / monthlySavings / 12
  }
  // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r  — solve for n numerically
  let lo = 0, hi = 1200, mid = 0 // up to 100 years
  for (let i = 0; i < 100; i++) {
    mid = (lo + hi) / 2
    const fv = currentNetWorth * Math.pow(1 + r, mid) + monthlySavings * (Math.pow(1 + r, mid) - 1) / r
    if (fv < targetNetWorth) lo = mid; else hi = mid
    if (hi - lo < 0.01) break
  }
  return mid > 1190 ? Infinity : mid / 12
}

/** Monthly savings needed to hit FIRE number in `years` years */
export function monthlySavingsNeeded(
  currentNetWorth: number,
  targetNetWorth: number,
  annualReturn: number,
  years: number,
): number {
  const n = years * 12
  const r = annualReturn / 100 / 12
  if (r === 0) return (targetNetWorth - currentNetWorth) / n
  const fvFactor = Math.pow(1 + r, n)
  const remaining = targetNetWorth - currentNetWorth * fvFactor
  if (remaining <= 0) return 0
  return remaining / ((fvFactor - 1) / r)
}

/** Net worth projection array (monthly points) for `months` months */
export function netWorthProjection(
  startNetWorth: number,
  annualReturn: number,
  monthlySavings: number,
  months: number,
): Array<{ month: number; value: number }> {
  const r = annualReturn / 100 / 12
  const points: Array<{ month: number; value: number }> = []
  let nw = startNetWorth
  for (let m = 0; m <= months; m++) {
    points.push({ month: m, value: Math.round(nw) })
    nw = nw * (1 + r) + monthlySavings
  }
  return points
}

// ─── Debt strategies ─────────────────────────────────────────────────────────

export interface DebtItem {
  id: string
  name: string
  balance: number
  annualRate: number   // %
  minPayment: number   // monthly
}

export interface DebtPayoffResult {
  order: string[]     // debt names in payoff order
  totalInterest: number
  monthsToPayoff: number
  payoffDate: Date
  schedule: Array<{ month: number; balances: Record<string, number> }>
}

function runDebtStrategy(
  debts: DebtItem[],
  extraMonthly: number,
  sortFn: (a: DebtItem, b: DebtItem) => number,
): DebtPayoffResult {
  if (debts.length === 0) {
    return { order: [], totalInterest: 0, monthsToPayoff: 0, payoffDate: new Date(), schedule: [] }
  }

  const balances: Record<string, number> = {}
  debts.forEach(d => { balances[d.id] = d.balance })

  const order: string[] = []
  let totalInterest = 0
  let month = 0
  const schedule: Array<{ month: number; balances: Record<string, number> }> = []
  const maxMonths = 600 // 50 years cap

  while (month < maxMonths) {
    const active = debts.filter(d => balances[d.id] > 0).sort(sortFn)
    if (active.length === 0) break

    month++
    let snowball = extraMonthly

    for (const debt of active) {
      const monthlyRate = debt.annualRate / 100 / 12
      const interest = balances[debt.id] * monthlyRate
      totalInterest += interest
      balances[debt.id] += interest

      let payment = debt.minPayment
      // Concentrate extra on priority debt
      if (debt.id === active[0].id) {
        payment += snowball
      }
      payment = Math.min(payment, balances[debt.id])
      balances[debt.id] -= payment

      if (balances[debt.id] < 0.01) {
        balances[debt.id] = 0
        if (!order.includes(debt.name)) {
          order.push(debt.name)
          // freed minimum rolls into snowball for next priority
          snowball += debt.minPayment
        }
      }
    }

    if (month % 3 === 0 || active.length === 1) {
      schedule.push({ month, balances: { ...balances } })
    }
  }

  const payoffDate = new Date()
  payoffDate.setMonth(payoffDate.getMonth() + month)

  return { order, totalInterest: Math.round(totalInterest), monthsToPayoff: month, payoffDate, schedule }
}

export function snowballStrategy(debts: DebtItem[], extraMonthly: number): DebtPayoffResult {
  return runDebtStrategy(debts, extraMonthly, (a, b) => a.balance - b.balance)
}

export function avalancheStrategy(debts: DebtItem[], extraMonthly: number): DebtPayoffResult {
  return runDebtStrategy(debts, extraMonthly, (a, b) => b.annualRate - a.annualRate)
}

// ─── Forecast ────────────────────────────────────────────────────────────────

export interface ForecastMonth {
  label: string       // e.g. "Mar 2026"
  income: number
  expenses: number
  net: number
  cumulative: number  // running balance from start
}

export interface ForecastScenario {
  name: 'Base' | 'Optimistic' | 'Pessimistic'
  months: ForecastMonth[]
  runway: number      // months of expenses in current savings
}

export function buildForecast(
  baseMonthlyIncome: number,
  baseMonthlyExpenses: number,
  currentSavings: number,
  propertyCashFlow: number,
  incomeMultiplier: number,    // e.g. 1.0, 1.1, 0.85
  expenseMultiplier: number,   // e.g. 1.0, 0.95, 1.1
  horizonMonths = 12,
): ForecastScenario {
  const income = baseMonthlyIncome * incomeMultiplier + propertyCashFlow
  const expenses = baseMonthlyExpenses * expenseMultiplier
  const months: ForecastMonth[] = []
  let cumulative = currentSavings
  const now = new Date()

  for (let i = 0; i < horizonMonths; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1)
    const label = d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    const net = income - expenses
    cumulative += net
    months.push({ label, income, expenses, net, cumulative })
  }

  const runway = expenses > 0 ? Math.max(0, currentSavings / expenses) : Infinity

  const nameMap: Record<string, ForecastScenario['name']> = {
    '1,1': 'Base',
    '1.1,0.95': 'Optimistic',
    '0.85,1.1': 'Pessimistic',
  }
  const key = `${incomeMultiplier},${expenseMultiplier}`
  const name = nameMap[key] ?? 'Base'

  return { name, months, runway }
}

// ─── Property portfolio helpers ──────────────────────────────────────────────

export interface PropertyMetrics {
  equity: number
  lvr: number
  monthlyCashFlow: number
  grossYield: number
  netYield: number
  monthlyRepayment: number
}

export function calcPropertyMetrics(p: {
  currentValue: number
  loanAmount: number
  offsetBalance: number
  interestRate: number
  loanType: 'io' | 'p&i'
  weeklyRent: number
  vacancyRate: number
  monthlyRunningCosts: number
}): PropertyMetrics {
  const effective = effectiveLoan(p.loanAmount, p.offsetBalance)
  const repayment = p.loanType === 'io'
    ? monthlyIORepayment(effective, p.interestRate)
    : monthlyRepayment(effective, p.interestRate, 30)
  return {
    equity: equity(p.currentValue, p.loanAmount),
    lvr: lvr(p.loanAmount, p.currentValue),
    monthlyCashFlow: monthlyCashFlow(p.weeklyRent, p.vacancyRate, repayment, p.monthlyRunningCosts),
    grossYield: grossYield(p.weeklyRent, p.currentValue),
    netYield: netYield(p.weeklyRent, p.vacancyRate, p.monthlyRunningCosts, p.currentValue),
    monthlyRepayment: repayment,
  }
}

// ─── Decision simulator helpers ──────────────────────────────────────────────

export interface BuyPropertyImpact {
  newEquity: number
  newLVR: number
  newMonthlyCashFlow: number   // for this property
  netWorthChange: number       // deposit used = immediate net worth hit, equity gained = offset
  fireImpact: number           // years added/removed from FIRE date
}

export function simulateBuyProperty(params: {
  price: number
  deposit: number
  rate: number
  weeklyRent: number
  loanTermYears?: number
  annualExpenses: number
  currentNetWorth: number
  annualReturn: number
  monthlySavings: number
}): BuyPropertyImpact {
  const loanAmt = params.price - params.deposit
  const repayment = monthlyRepayment(loanAmt, params.rate, params.loanTermYears ?? 30)
  const cashFlow = monthlyCashFlow(params.weeklyRent, 4, repayment, 500)
  const newEquity = equity(params.price, loanAmt)
  const newLVR = lvr(loanAmt, params.price)

  // Net worth impact: spend deposit but gain equity
  const netWorthChange = newEquity - params.deposit

  // FIRE impact
  const fireNum = fireNumber(params.annualExpenses)
  const yearsBefore = yearsToTarget(params.currentNetWorth, fireNum, params.annualReturn, params.monthlySavings)
  const netWorthAfter = params.currentNetWorth + netWorthChange
  const savingsAfter = params.monthlySavings + cashFlow
  const yearsAfter = yearsToTarget(netWorthAfter, fireNum, params.annualReturn, savingsAfter)
  const fireImpact = yearsAfter - yearsBefore

  return { newEquity, newLVR, newMonthlyCashFlow: cashFlow, netWorthChange, fireImpact }
}

export function simulateRateRise(
  properties: Array<{ loanAmount: number; offsetBalance: number; interestRate: number; loanType: 'io' | 'p&i' }>,
  risePercent: number,
): Array<{ before: number; after: number; delta: number }> {
  return properties.map(p => {
    const effective = effectiveLoan(p.loanAmount, p.offsetBalance)
    const before = p.loanType === 'io'
      ? monthlyIORepayment(effective, p.interestRate)
      : monthlyRepayment(effective, p.interestRate, 30)
    const after = p.loanType === 'io'
      ? monthlyIORepayment(effective, p.interestRate + risePercent)
      : monthlyRepayment(effective, p.interestRate + risePercent, 30)
    return { before: Math.round(before), after: Math.round(after), delta: Math.round(after - before) }
  })
}

export function simulateLumpSum(amount: number, annualReturn: number, years: number): number {
  return amount * Math.pow(1 + annualReturn / 100, years)
}
