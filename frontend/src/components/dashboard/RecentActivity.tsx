import { Button } from "@/components/ui/button"
import { ActivityItem } from "./ActivityItem"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"

// Sample activity data
const activities = [
  { user: "John Doe", action: "created a new report", time: "2 minutes ago" },
  { user: "Alice Smith", action: "updated user settings", time: "1 hour ago" },
  { user: "Robert Johnson", action: "deleted a file", time: "3 hours ago" },
  { user: "Emily Wilson", action: "invited a new team member", time: "5 hours ago" },
  { user: "Michael Brown", action: "uploaded a document", time: "Yesterday" }
]

export function RecentActivity() {
  return (
    <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-6">
        <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/90 hover:bg-primary/5 rounded-lg h-9 gap-1">
          View All
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="pt-3 px-6">
        <div className="space-y-1">
          {activities.map((activity, index) => (
            <ActivityItem
              key={index}
              user={activity.user}
              action={activity.action}
              time={activity.time}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 