import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { QuickActions } from "./QuickActions"
import { RecentActivity } from "./RecentActivity"
import { StatsGrid } from "./StatsGrid"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, ListTodo, Plus, Users, ChevronRight } from "lucide-react"
import { UsersTable } from "./UsersTable"
import { cn } from "@/lib/utils"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  
  // Check if tabs are overflowing and show scroll indicator on mobile
  useEffect(() => {
    const checkOverflow = () => {
      const container = tabsContainerRef.current
      if (!container) return
      
      // Check if content is wider than container AND viewport is mobile sized
      const isOverflowing = container.scrollWidth > container.clientWidth
      const isMobile = window.innerWidth < 768 // md breakpoint
      
      setShowScrollIndicator(isOverflowing && isMobile)
    }
    
    // Initial check
    checkOverflow()
    
    // Check on resize
    window.addEventListener('resize', checkOverflow)
    
    // Hide indicator when user scrolls the tabs
    const handleScroll = () => {
      setShowScrollIndicator(false)
    }
    
    const tabsContainer = tabsContainerRef.current
    if (tabsContainer) {
      tabsContainer.addEventListener('scroll', handleScroll)
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkOverflow)
      if (tabsContainer) {
        tabsContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])
  
  return (
    <main className="space-y-8">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard Overview</h1>
        <Button size="sm" className="sm:self-end rounded-xl h-10 px-4 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          <span className="whitespace-nowrap">New Report</span>
        </Button>
      </div>
      
      {/* Stats */}
      <StatsGrid />
      
      {/* Tabs */}
      <div className="space-y-6">
        <Tabs defaultValue="overview" onValueChange={setActiveTab} value={activeTab}>
          <div className="border-b border-border/30 rounded-lg relative">
            <div 
              ref={tabsContainerRef}
              className="flex overflow-x-auto no-scrollbar relative"
            >
              <TabsList className="flex h-12 items-center justify-start bg-transparent p-0 w-full">
                {[
                  { id: "overview", label: "Overview", icon: BarChart3 },
                  { id: "users", label: "Users", icon: Users },
                  { id: "reports", label: "Reports", icon: FileText },
                  { id: "tasks", label: "Tasks", icon: ListTodo }
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id} 
                      className={cn(
                        "flex items-center gap-2 h-12 px-4 rounded-md data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary",
                        "border-transparent text-muted-foreground bg-transparent hover:text-foreground",
                        "transition-colors duration-200 relative whitespace-nowrap"
                      )}
                    >
                      <tab.icon className={cn(
                        "h-4 w-4 transition-all",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="font-medium">{tab.label}</span>
            </TabsTrigger>
                  );
                })}
          </TabsList>
          
              {/* Scroll indicator - shows on mobile until user scrolls */}
              {showScrollIndicator && (
                <div className="absolute right-0 top-0 bottom-0 flex items-center md:hidden pointer-events-none">
                  <div className="h-full flex items-center justify-center px-2 bg-gradient-to-l from-background/90 to-transparent">
                    <div className="flex items-center justify-center bg-primary/10 rounded-full p-1.5 animate-pulse">
                      <ChevronRight className="h-4 w-4 text-primary animate-bounce-x" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <RecentActivity />
              </div>
              <div>
                <QuickActions />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-6">
                <CardTitle className="text-lg font-medium">System Users</CardTitle>
                <Button size="sm" className="rounded-xl shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Add User</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <UsersTable />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-10 md:py-14">
                  <div className="p-4 rounded-2xl bg-primary/5 mb-5">
                    <FileText className="h-10 w-10 md:h-12 md:w-12 text-primary/70" />
                  </div>
                  <h3 className="text-lg font-medium mb-2.5">No reports available</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-6">
                    You don't have any reports yet. Create your first report to view it here.
                  </p>
                  <Button className="rounded-xl px-6 shadow-sm">Create Report</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tasks" className="mt-6">
            <Card className="overflow-hidden border-border/40 rounded-2xl shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-10 md:py-14">
                  <div className="p-4 rounded-2xl bg-primary/5 mb-5">
                    <ListTodo className="h-10 w-10 md:h-12 md:w-12 text-primary/70" />
                  </div>
                  <h3 className="text-lg font-medium mb-2.5">Task list empty</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-6">
                    No tasks assigned to you at the moment.
                  </p>
                  <Button className="rounded-xl px-6 shadow-sm">Create Task</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
} 