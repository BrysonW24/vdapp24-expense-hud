import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { ImportPage } from '@/pages/ImportPage'
import { InsightsPage } from '@/pages/InsightsPage'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NetWorthPage } from '@/pages/NetWorthPage'
import { PropertiesPage } from '@/pages/PropertiesPage'
import { ForecastPage } from '@/pages/ForecastPage'
import { FirePage } from '@/pages/FirePage'
import { DebtPage } from '@/pages/DebtPage'
import { SimulatePage } from '@/pages/SimulatePage'
import { VisualizationsPage } from '@/pages/VisualizationsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/networth" element={<NetWorthPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/forecast" element={<ForecastPage />} />
        <Route path="/fire" element={<FirePage />} />
        <Route path="/debt" element={<DebtPage />} />
        <Route path="/simulate" element={<SimulatePage />} />
        <Route path="/visualizations" element={<VisualizationsPage />} />
      </Route>
    </Routes>
  )
}
