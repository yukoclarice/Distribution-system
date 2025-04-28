import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";

type DashboardLayoutProps = {
  children?: ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  useEffect(() => {
    // Function to handle window resize
    const handleResize = () => {
      // Close mobile sidebar if window width is increased above mobile breakpoint
      if (window.innerWidth >= 1024 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    
    // Function to handle custom event for closing mobile sidebar
    const handleCloseMobileSidebar = () => {
      setMobileOpen(false);
    };
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('closeMobileSidebar', handleCloseMobileSidebar);
    
    // Clean up event listeners on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('closeMobileSidebar', handleCloseMobileSidebar);
    };
  }, [mobileOpen]);
  
  // Toggle function for mobile sidebar
  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block fixed h-screen z-30">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapse={setSidebarCollapsed} 
        />
      </div>
      
      {/* Mobile Header + Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center p-3 bg-background/80 backdrop-blur-md h-14 shadow-sm">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleMobileSidebar} 
            className="mr-3 h-9 w-9 rounded-xl"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Header toggleSidebar={toggleMobileSidebar} showMenuButton={false} mobileCompact={true} />
        </div>
      </div>
      
      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 max-w-[280px] z-50 lg:hidden rounded-r-2xl shadow-lg">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">Application navigation links and options</SheetDescription>
          <Sidebar 
            collapsed={false} 
            onCollapse={() => {}} 
            className="border-none h-full"
          />
        </SheetContent>
      </Sheet>
      
      {/* Main Content Area */}
      <div className={cn(
        "pt-[56px] lg:pt-0", // Updated height for mobile header
        "lg:ml-64 transition-all duration-300 ease-out",
        sidebarCollapsed && "lg:ml-20"
      )}>
        {/* Desktop Header - hidden on mobile */}
        <div className="hidden lg:block sticky top-0 z-10">
          <Header toggleSidebar={toggleMobileSidebar} />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
} 