import { BarChart3, LayoutGrid, PieChart, Users } from "lucide-react"
import { StatCard } from "./StatCard"

const stats = [
  { 
    title: "Total Users", 
    value: "5,257", 
    change: "+12.5%", 
    icon: Users 
  },
  { 
    title: "Active Sessions", 
    value: "423", 
    change: "+8.2%", 
    icon: LayoutGrid 
  },
  { 
    title: "Conversion Rate", 
    value: "3.42%", 
    change: "-1.8%", 
    icon: PieChart 
  },
  { 
    title: "Avg. Session", 
    value: "2m 32s", 
    change: "+12.5%", 
    icon: BarChart3 
  }
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          icon={stat.icon}
        />
      ))}
    </div>
  )
} 