import { format, startOfMonth, subMonths, eachMonthOfInterval, isSameMonth, getDaysInMonth, getDate } from 'date-fns'
import type { Transaction, Category, MonthlyBreakdown, SpendingInsight, Goal, GoalProgress } from '@/types'

// Dexie returns Date objects but they may need coercing
function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

export function getMonthlyBreakdowns(transactions: Transaction[], months = 6): MonthlyBreakdown[] {
  const now = new Date()
  const monthRange = eachMonthOfInterval({ start: subMonths(startOfMonth(now), months - 1), end: now })

  return monthRange.map(month => {
    const txs = transactions.filter(t => isSameMonth(toDate(t.date), month))
    const income = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const expenses = Math.abs(txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
    const byCategory: Record<number, number> = {}
    for (const tx of txs.filter(t => t.amount < 0)) {
      byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + Math.abs(tx.amount)
    }
    return { month: format(month, 'MMM yy'), income, expenses, net: income - expenses, byCategory }
  })
}

export function getTopMerchants(transactions: Transaction[], limit = 10) {
  const map: Record<string, number> = {}
  for (const tx of transactions.filter(t => t.amount < 0)) {
    const key = tx.description.split(/\s+/).slice(0, 3).join(' ').toUpperCase()
    map[key] = (map[key] ?? 0) + Math.abs(tx.amount)
  }
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([name, total]) => ({ name, total }))
}

export function getSpendingByDayOfWeek(transactions: Transaction[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const totals = new Array(7).fill(0)
  const counts = new Array(7).fill(0)
  for (const tx of transactions.filter(t => t.amount < 0)) {
    const dow = toDate(tx.date).getDay()
    totals[dow] += Math.abs(tx.amount)
    counts[dow]++
  }
  return days.map((name, i) => ({ name, total: totals[i], avg: counts[i] > 0 ? totals[i] / counts[i] : 0 }))
}

export function detectRecurring(transactions: Transaction[], categories: Category[]) {
  const map: Record<string, Transaction[]> = {}
  for (const tx of transactions.filter(t => t.amount < 0)) {
    const key = tx.description.trim().toUpperCase().slice(0, 20)
    if (!map[key]) map[key] = []
    map[key].push(tx)
  }
  return Object.entries(map)
    .filter(([, txs]) => txs.length >= 2)
    .map(([name, txs]) => {
      const avg = txs.reduce((s, t) => s + Math.abs(t.amount), 0) / txs.length
      const cat = categories.find(c => c.id === txs[0].categoryId)
      return { name, count: txs.length, avgAmount: avg, categoryName: cat?.name ?? 'Unknown', annualCost: avg * 12 }
    })
    .sort((a, b) => b.avgAmount - a.avgAmount)
    .slice(0, 20)
}

export function generateInsights(transactions: Transaction[], categories: Category[]): SpendingInsight[] {
  const insights: SpendingInsight[] = []
  if (transactions.length === 0) return [{ type: 'info', title: 'Import data to get started', description: 'Upload a bank statement CSV to see personalised spending insights.', headline: '—', headlineSub: 'no data yet' }]

  const now = new Date()
  const daysInMonth = getDaysInMonth(now)
  const dayOfMonth = getDate(now)

  const thisMonth = transactions.filter(t => isSameMonth(toDate(t.date), now))
  const lastMonth = transactions.filter(t => isSameMonth(toDate(t.date), subMonths(now, 1)))
  const twoMonthsAgo = transactions.filter(t => isSameMonth(toDate(t.date), subMonths(now, 2)))

  const thisIncome = thisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const thisExpenses = Math.abs(thisMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const lastExpenses = Math.abs(lastMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const lastIncome = lastMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savings = thisIncome - thisExpenses
  const savingsRate = thisIncome > 0 ? (savings / thisIncome) * 100 : 0

  // 1. Savings rate
  if (thisIncome > 0) {
    const isGood = savingsRate >= 20
    insights.push({
      type: isGood ? 'positive' : savingsRate >= 0 ? 'info' : 'warning',
      title: isGood ? 'Strong savings rate' : savingsRate >= 0 ? 'Savings rate' : 'Spending exceeds income',
      description: isGood
        ? `You're saving ${savingsRate.toFixed(0)}% of income this month. At this rate you'll save $${Math.round(savings * 12).toLocaleString()} this year.`
        : savingsRate >= 0
        ? `Saving ${savingsRate.toFixed(0)}% of income. Cutting just $${Math.round((thisExpenses * 0.1)).toLocaleString()} more would get you to the 20% benchmark.`
        : `Spending $${Math.abs(savings).toFixed(0)} more than you earn. This is unsustainable — find the biggest line item and cut it first.`,
      headline: `${savingsRate >= 0 ? '' : '-'}${Math.abs(savingsRate).toFixed(0)}%`,
      headlineSub: 'savings rate',
    })
  }

  // 2. Daily spend rate & cash buffer
  if (dayOfMonth > 3 && thisExpenses > 0) {
    const dailyRate = thisExpenses / dayOfMonth
    const projected = dailyRate * daysInMonth
    const daysLeft = daysInMonth - dayOfMonth
    const remaining = thisIncome - thisExpenses
    const bufferDays = dailyRate > 0 ? Math.floor(remaining / dailyRate) : 999

    insights.push({
      type: remaining > 0 ? 'info' : 'warning',
      title: 'Daily spend rate',
      description: remaining > 0
        ? `Spending $${dailyRate.toFixed(0)}/day. Projected month total: $${Math.round(projected).toLocaleString()}. ${bufferDays < daysLeft ? `Budget runs out in ~${bufferDays} days.` : `You have ${daysLeft} days of runway left.`}`
        : `Already over income for this month by $${Math.abs(remaining).toFixed(0)}. Spending $${dailyRate.toFixed(0)}/day.`,
      headline: `$${dailyRate.toFixed(0)}`,
      headlineSub: 'per day',
    })
  }

  // 3. Month-on-month spending change
  if (lastExpenses > 0 && thisExpenses > lastExpenses * 1.1) {
    const pct = Math.round(((thisExpenses - lastExpenses) / lastExpenses) * 100)
    const extra = thisExpenses - lastExpenses
    insights.push({
      type: 'warning',
      title: 'Spending up this month',
      description: `$${extra.toFixed(0)} more than last month. Check transactions to find what spiked — often one or two categories drive most of the increase.`,
      headline: `+${pct}%`,
      headlineSub: 'vs last month',
      value: extra,
    })
  } else if (lastExpenses > 0 && thisExpenses < lastExpenses * 0.9) {
    const pct = Math.round(((lastExpenses - thisExpenses) / lastExpenses) * 100)
    insights.push({
      type: 'positive',
      title: 'Spending down!',
      description: `$${(lastExpenses - thisExpenses).toFixed(0)} less than last month — a ${pct}% drop. If you can hold this through next month, that's $${Math.round((lastExpenses - thisExpenses) * 12).toLocaleString()}/year saved.`,
      headline: `-${pct}%`,
      headlineSub: 'vs last month',
    })
  }

  // 4. Income change MoM
  if (lastIncome > 0 && thisIncome > lastIncome * 1.1) {
    const extra = thisIncome - lastIncome
    insights.push({
      type: 'positive',
      title: 'Income up',
      description: `$${extra.toFixed(0)} more income than last month. Consider directing the extra straight to savings before lifestyle inflation kicks in.`,
      headline: `+$${Math.round(extra).toLocaleString()}`,
      headlineSub: 'vs last month',
    })
  }

  // 5. Budget overruns
  for (const cat of categories.filter(c => c.type === 'expense')) {
    if (!cat.budget || !cat.id) continue
    const spent = Math.abs(thisMonth.filter(t => t.amount < 0 && t.categoryId === cat.id).reduce((s, t) => s + t.amount, 0))
    if (spent > cat.budget) {
      const over = spent - cat.budget
      const pct = Math.round((over / cat.budget) * 100)
      insights.push({
        type: 'warning',
        title: `Over budget: ${cat.name}`,
        description: `$${spent.toFixed(0)} spent vs $${cat.budget} budget — ${pct}% over. At month end that's $${Math.round(over * 12).toLocaleString()}/year in overruns if this continues.`,
        headline: `+$${over.toFixed(0)}`,
        headlineSub: 'over budget',
        value: over,
        categoryId: cat.id,
      })
    }
  }

  // 6. Biggest spending category
  const catSpend: Record<number, number> = {}
  for (const tx of thisMonth.filter(t => t.amount < 0)) {
    catSpend[tx.categoryId] = (catSpend[tx.categoryId] ?? 0) + Math.abs(tx.amount)
  }
  const topCatEntry = Object.entries(catSpend).sort(([, a], [, b]) => b - a)[0]
  if (topCatEntry && thisExpenses > 0) {
    const topCatId = Number(topCatEntry[0])
    const topCatAmount = topCatEntry[1]
    const topCat = categories.find(c => c.id === topCatId)
    const pct = Math.round((topCatAmount / thisExpenses) * 100)
    if (topCat && pct > 25 && topCat.name !== 'Transfer' && topCat.name !== 'Uncategorised') {
      insights.push({
        type: pct > 50 ? 'warning' : 'info',
        title: `${topCat.name} dominates`,
        description: `${pct}% of your spending this month ($${Math.round(topCatAmount).toLocaleString()}) is in ${topCat.name}. ${pct > 50 ? 'This single category is your biggest lever for change.' : 'Worth keeping an eye on.'}`,
        headline: `${pct}%`,
        headlineSub: 'of spending',
        categoryId: topCatId,
      })
    }
  }

  // 7. Top single merchant
  const merchantMap: Record<string, number> = {}
  for (const tx of thisMonth.filter(t => t.amount < 0)) {
    const key = tx.description.split(/\s+/).slice(0, 3).join(' ').toUpperCase()
    merchantMap[key] = (merchantMap[key] ?? 0) + Math.abs(tx.amount)
  }
  const topMerchant = Object.entries(merchantMap).sort(([, a], [, b]) => b - a)[0]
  if (topMerchant && topMerchant[1] > 100) {
    const [name, total] = topMerchant
    insights.push({
      type: 'info',
      title: 'Top merchant',
      description: `You've spent $${total.toFixed(0)} at ${name} this month — $${Math.round(total * 12).toLocaleString()}/year if consistent. Is this intentional?`,
      headline: `$${Math.round(total).toLocaleString()}`,
      headlineSub: name.slice(0, 16),
    })
  }

  // 8. Dining & takeaway
  const diningCat = categories.find(c => c.name === 'Dining & Takeaway')
  if (diningCat?.id) {
    const diningSpend = Math.abs(thisMonth.filter(t => t.amount < 0 && t.categoryId === diningCat.id).reduce((s, t) => s + t.amount, 0))
    const lastDining = Math.abs(lastMonth.filter(t => t.amount < 0 && t.categoryId === diningCat.id).reduce((s, t) => s + t.amount, 0))
    if (diningSpend > 150) {
      const trend = lastDining > 0 ? (diningSpend > lastDining * 1.1 ? ' ↑ trending up.' : diningSpend < lastDining * 0.9 ? ' ↓ trending down — nice.' : '') : ''
      insights.push({
        type: diningSpend > 400 ? 'warning' : 'info',
        title: 'Dining & takeaway',
        description: `$${diningSpend.toFixed(0)} this month on food out.${trend} Swapping 2 takeaways/week for home cooking saves ~$${Math.round(diningSpend * 0.3)}/mo ($${Math.round(diningSpend * 0.3 * 12).toLocaleString()}/yr).`,
        headline: `$${Math.round(diningSpend).toLocaleString()}`,
        headlineSub: 'dining this month',
        categoryId: diningCat.id,
      })
    }
  }

  // 9. Subscriptions with annualised view
  const subsCat = categories.find(c => c.name === 'Subscriptions')
  if (subsCat?.id) {
    const totalSubs = Math.abs(thisMonth.filter(t => t.amount < 0 && t.categoryId === subsCat.id).reduce((s, t) => s + t.amount, 0))
    if (totalSubs > 20) {
      insights.push({
        type: 'info',
        title: 'Subscription stack',
        description: `$${totalSubs.toFixed(0)}/month on subscriptions = $${Math.round(totalSubs * 12).toLocaleString()}/year. List them out — most people find 1-2 they've forgotten about.`,
        headline: `$${Math.round(totalSubs * 12).toLocaleString()}`,
        headlineSub: 'per year',
      })
    }
  }

  // 10. Transport
  const transportCat = categories.find(c => c.name === 'Transport')
  if (transportCat?.id) {
    const transportSpend = Math.abs(thisMonth.filter(t => t.amount < 0 && t.categoryId === transportCat.id).reduce((s, t) => s + t.amount, 0))
    if (transportSpend > 200) {
      insights.push({
        type: 'info',
        title: 'Transport costs',
        description: `$${transportSpend.toFixed(0)} on transport this month ($${Math.round(transportSpend * 12).toLocaleString()}/yr). If you drive, that's worth tracking against public transport options.`,
        headline: `$${Math.round(transportSpend).toLocaleString()}`,
        headlineSub: 'transport',
        categoryId: transportCat.id,
      })
    }
  }

  // 11. Small purchases frequency (transactions under $20)
  const smallTxs = thisMonth.filter(t => t.amount < 0 && Math.abs(t.amount) < 20)
  if (smallTxs.length > 15) {
    const smallTotal = smallTxs.reduce((s, t) => s + Math.abs(t.amount), 0)
    insights.push({
      type: 'info',
      title: 'Death by a thousand cuts',
      description: `${smallTxs.length} transactions under $20 this month totalling $${smallTotal.toFixed(0)}. Each feels small but adds up — coffees, snacks, and apps are the usual suspects.`,
      headline: `${smallTxs.length}x`,
      headlineSub: 'small purchases',
    })
  }

  // 12. Weekend vs weekday
  const weekendSpend = transactions.filter(t => t.amount < 0 && [0, 6].includes(toDate(t.date).getDay())).reduce((s, t) => s + Math.abs(t.amount), 0)
  const weekdaySpend = transactions.filter(t => t.amount < 0 && ![0, 6].includes(toDate(t.date).getDay())).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalDaySpend = weekendSpend + weekdaySpend
  if (totalDaySpend > 0) {
    const weekendPct = Math.round((weekendSpend / totalDaySpend) * 100)
    if (weekendPct > 45) {
      insights.push({
        type: 'info',
        title: 'Weekend heavy',
        description: `${weekendPct}% of all spending happens on weekends. Weekend social plans are fine, but having a weekend budget cap can prevent the Sunday scaries.`,
        headline: `${weekendPct}%`,
        headlineSub: 'on weekends',
      })
    }
  }

  // 13. 3-month spend trend (accelerating or decelerating)
  const twoMonthsExpenses = Math.abs(twoMonthsAgo.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  if (twoMonthsExpenses > 0 && lastExpenses > 0 && thisExpenses > 0) {
    const growthRate1 = (lastExpenses - twoMonthsExpenses) / twoMonthsExpenses
    const growthRate2 = (thisExpenses - lastExpenses) / lastExpenses
    if (growthRate1 > 0.05 && growthRate2 > 0.05) {
      insights.push({
        type: 'warning',
        title: 'Spending accelerating',
        description: `Spending has grown 3 months in a row: $${Math.round(twoMonthsExpenses).toLocaleString()} → $${Math.round(lastExpenses).toLocaleString()} → $${Math.round(thisExpenses).toLocaleString()}. This trajectory adds up fast.`,
        headline: '3 mo ↑',
        headlineSub: 'trend',
      })
    } else if (growthRate1 < -0.05 && growthRate2 < -0.05) {
      insights.push({
        type: 'positive',
        title: 'Spending trending down',
        description: `Three months of falling spend: $${Math.round(twoMonthsExpenses).toLocaleString()} → $${Math.round(lastExpenses).toLocaleString()} → $${Math.round(thisExpenses).toLocaleString()}. Excellent discipline.`,
        headline: '3 mo ↓',
        headlineSub: 'trend',
      })
    }
  }

  // 14. No income detected this month
  if (thisIncome === 0 && thisExpenses > 0) {
    insights.push({
      type: 'warning',
      title: 'No income recorded',
      description: `No income transactions detected this month yet — either it hasn't landed yet or it's being categorised differently. Double-check your income category.`,
      headline: '$0',
      headlineSub: 'income this month',
    })
  }

  return insights
}

export function getGoalProgress(goal: Goal, transactions: Transaction[]): GoalProgress {
  const now = new Date()
  const thisMonth = transactions.filter(t => isSameMonth(toDate(t.date), now))
  const target = goal.targetAmount
  let current = 0
  let coaching = ''

  if (goal.type === 'save') {
    const income = thisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const expenses = Math.abs(thisMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
    current = Math.max(0, income - expenses)
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
    const pace = getDate(now) / getDaysInMonth(now)
    const onTrack = current >= target * pace
    if (current >= target) coaching = `Goal reached! Saved $${current.toFixed(0)} this month.`
    else if (onTrack) coaching = `On track — $${(target - current).toFixed(0)} more to go.`
    else coaching = `Behind pace. Need $${(target - current).toFixed(0)} more by month end.`
    return { current, target, pct, onTrack, coaching }
  }

  if (goal.type === 'spend_limit') {
    current = Math.abs(thisMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
    const onTrack = current <= target
    const remaining = target - current
    if (remaining < 0) coaching = `$${Math.abs(remaining).toFixed(0)} over your limit this month.`
    else coaching = `$${remaining.toFixed(0)} left for ${getDaysInMonth(now) - getDate(now)} more days.`
    return { current, target, pct, onTrack, coaching }
  }

  if (goal.type === 'category_limit' && goal.categoryId) {
    current = Math.abs(thisMonth.filter(t => t.amount < 0 && t.categoryId === goal.categoryId).reduce((s, t) => s + t.amount, 0))
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
    const onTrack = current <= target
    const remaining = target - current
    if (remaining < 0) coaching = `$${Math.abs(remaining).toFixed(0)} over your category limit.`
    else coaching = `$${remaining.toFixed(0)} remaining in this category.`
    return { current, target, pct, onTrack, coaching }
  }

  if (goal.type === 'income_target') {
    current = thisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0
    const pace = getDate(now) / getDaysInMonth(now)
    const onTrack = current >= target * pace
    if (current >= target) coaching = `Income goal hit! $${current.toFixed(0)} earned.`
    else coaching = `$${(target - current).toFixed(0)} to go to hit your income target.`
    return { current, target, pct, onTrack, coaching }
  }

  return { current: 0, target, pct: 0, onTrack: false, coaching: '' }
}

export function getCashFlowScore(transactions: Transaction[]): number {
  if (transactions.length === 0) return 0
  const now = new Date()
  const recent = transactions.filter(t => toDate(t.date) >= subMonths(now, 3))
  if (recent.length === 0) return 50
  const income = recent.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const expenses = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  if (income === 0) return 10
  const savingsRate = (income - expenses) / income
  return Math.max(0, Math.min(100, Math.round(50 + savingsRate * 125)))
}
