import { LayoutGrid, BarChart3, Users, Settings, Home, ChevronLeft, ChevronRight, FileBarChart, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

type SidebarProps = {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  className?: string;
}

export function Sidebar({ collapsed, onCollapse, className }: SidebarProps) {
  const location = useLocation()
  const currentPath = location.pathname
  const { user } = useAuth()

  // Function to handle navigation on mobile
  const handleNavigation = (_event: React.MouseEvent<HTMLAnchorElement>) => {
    // Check if we're on mobile by testing for viewport width
    if (window.innerWidth < 1024) {
      // Dispatch a custom event that will be caught by the DashboardLayout
      const customEvent = new CustomEvent('closeMobileSidebar');
      window.dispatchEvent(customEvent);
    }
  };

  // Get navigation items based on user role
  const getNavItems = () => {
    const items = []
    
    // Regular users can only see Reports
    if (user?.userType === "user") {
      items.push({ id: "reports", label: "Reports", icon: FileBarChart, path: "/reports" })
      items.push({ id: "print", label: "Print", icon: Printer, path: "/print" })
      return items
    }
    
    // Administrator gets full access
    if (user?.userType === "Administrator") {
      items.push({ id: "dashboard", label: "Dashboard", icon: Home, path: "/" })
      items.push({ id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics" })
      items.push({ id: "reports", label: "Reports", icon: FileBarChart, path: "/reports" })
      items.push({ id: "print", label: "Print", icon: Printer, path: "/print" })
      items.push({ id: "users", label: "Users", icon: Users, path: "/users" })
      items.push({ id: "settings", label: "Settings", icon: Settings, path: "/settings" })
    } else {
      // Fallback for any other user type - at least show reports
      items.push({ id: "reports", label: "Reports", icon: FileBarChart, path: "/reports" })
      items.push({ id: "print", label: "Print", icon: Printer, path: "/print" })
    }
    
    return items
  }

  const navItems = getNavItems()

  return (
    <div className={cn(
      "bg-card/95 backdrop-blur-sm border-r border-border/40 h-full lg:h-screen flex flex-col transition-all duration-300 ease-in-out relative",
      "p-5 max-w-[280px]",
      collapsed ? "w-20" : "w-64",
      className
    )}>
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <LayoutGrid className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && <h1 className="text-xl font-semibold text-primary tracking-tight">Dashboard</h1>}
        </div>
      </div>
      
      {/* Toggle button - hidden on small screens */}
      <Button 
        variant="outline" 
        size="icon" 
        onClick={() => onCollapse(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 h-6 w-6 rounded-full border border-border/60 bg-background shadow-md",
          "flex items-center justify-center p-0 transition-transform hover:scale-110 hover:bg-primary/5",
          "focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0",
          "hidden lg:flex"
        )}
      >
        {collapsed ? 
          <ChevronRight className="h-3 w-3 text-primary" /> : 
          <ChevronLeft className="h-3 w-3 text-primary" />}
      </Button>
      
      <nav className="mt-6 lg:mt-8 flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = item.path === '/' 
              ? currentPath === item.path 
              : currentPath.startsWith(item.path)
            
            return (
              <li key={item.id}>
                <Link 
                  to={item.path}
                  onClick={handleNavigation}
                  className={cn(
                    "flex items-center gap-3 rounded-xl transition-all duration-150 cursor-pointer w-full",
                    collapsed ? "justify-center px-2 py-3" : "px-4 py-3",
                    isActive 
                      ? "bg-primary/10 text-primary font-medium shadow-sm" 
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground/90"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "transition-transform",
                    isActive ? "h-5 w-5 scale-105" : "h-5 w-5"
                  )} />
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
} 