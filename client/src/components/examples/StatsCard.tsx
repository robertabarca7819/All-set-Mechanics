import { StatsCard } from '../StatsCard'
import { Briefcase } from 'lucide-react'

export default function StatsCardExample() {
  return (
    <div className="p-8 max-w-xs">
      <StatsCard
        title="Active Jobs"
        value={12}
        icon={Briefcase}
        trend="+3 from last week"
      />
    </div>
  )
}
