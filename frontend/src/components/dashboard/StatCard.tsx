import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change.startsWith("+")
  
  return (
    <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1.5 tracking-tight">{value}</p>
            <Badge 
              variant={isPositive ? "secondary" : "destructive"} 
              className={cn(
                "mt-3 px-2.5 py-1 rounded-xl text-xs font-medium",
                isPositive 
                  ? "bg-green-100/80 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                  : "bg-red-100/80 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              {change} from last week
            </Badge>
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            isPositive ? "bg-primary/10" : "bg-destructive/10"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              isPositive ? "text-primary" : "text-destructive"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 