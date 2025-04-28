import { Button } from "@/components/ui/button"
import { LayoutGrid, Users, Settings, Bell } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type ActionItem = {
  label: string;
  icon: typeof LayoutGrid;
  onClick: () => void;
}

export function QuickActions() {
  const actions: ActionItem[] = [
    { 
      label: "View Reports", 
      icon: LayoutGrid, 
      onClick: () => console.log("View Reports clicked") 
    },
    { 
      label: "Manage Users", 
      icon: Users, 
      onClick: () => console.log("Manage Users clicked") 
    },
    { 
      label: "System Settings", 
      icon: Settings, 
      onClick: () => console.log("System Settings clicked") 
    },
    { 
      label: "Notification Preferences", 
      icon: Bell, 
      onClick: () => console.log("Notification Preferences clicked") 
    }
  ]
  
  return (
    <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm h-full">
      <CardHeader className="pt-5 px-6">
        <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-6">
        {actions.map((action, index) => (
          <Button 
            key={index}
            className="w-full justify-start h-12 rounded-xl bg-secondary/60 hover:bg-secondary/90 text-foreground hover:text-foreground border-0 shadow-sm" 
            variant="outline"
            onClick={action.onClick}
          >
            <div className="bg-primary/10 p-1.5 rounded-lg mr-3">
              <action.icon className="h-4 w-4 text-primary" />
            </div>
            <span className="font-medium">{action.label}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
} 