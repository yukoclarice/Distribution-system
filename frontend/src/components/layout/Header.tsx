import { Search, Settings, LogOut, User, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useNavigate } from "react-router-dom"

type HeaderProps = {
  toggleSidebar: () => void;
  showMenuButton?: boolean;
  mobileCompact?: boolean;
}

export function Header({ toggleSidebar, showMenuButton = true, mobileCompact = false }: HeaderProps) {
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const toggleMobileSearch = () => {
    setSearchActive(!searchActive);
    
    // Focus the input when search becomes active
    if (!searchActive) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Handle clicks outside the search input and container to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchActive && 
          searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target as Node) &&
          event.target !== searchInputRef.current) {
        setSearchActive(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchActive]);
  
  // Handle the escape key to close search
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (searchActive && event.key === 'Escape') {
        setSearchActive(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [searchActive]);
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get user initials for avatar
  const getInitials = (): string => {
    if (!user) return 'U';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`;
    }
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    return 'U';
  };

  return (
    <header className="flex items-center justify-between h-full w-full lg:border-b lg:border-border/40 relative py-3 bg-background/90 backdrop-blur-sm lg:px-4">
      {/* Left section - Title and mobile menu */}
      <div className="flex items-center gap-3 px-3 sm:px-4 md:px-6 h-full flex-shrink-0">
        {/* Mobile menu toggle */}
        {showMenuButton && (
          <Button 
            variant="ghost" 
            size={mobileCompact ? "sm" : "icon"} 
            onClick={toggleSidebar} 
            className={cn(
              "lg:hidden shrink-0 text-primary hover:text-primary hover:bg-primary/10 rounded-xl",
              mobileCompact ? "h-8 w-8" : "h-10 w-10"
            )}
          >
            <Menu className={cn(
              mobileCompact ? "h-4 w-4" : "h-5 w-5",
              "text-primary"
            )} />
          </Button>
        )}
        
        {/* Title - always visible on mobile when search is inactive */}
        <div className={cn(
          "transition-all duration-300 ease-in-out flex items-center",
          searchActive && "hidden md:flex"
        )}>
          <h1 className={cn(
            "font-semibold text-primary whitespace-nowrap lg:hidden",
            mobileCompact ? "text-base" : "text-lg"
          )}>Dashboard</h1>
        </div>
      </div>
      
      {/* Mobile search input - absolute positioned for mobile, shown when search is active */}
      <div 
        ref={searchContainerRef}
        className={cn(
          "absolute left-0 right-0 md:hidden transition-all duration-300 ease-in-out z-20 px-3 sm:px-4",
          searchActive 
            ? "opacity-100 visible" 
            : "opacity-0 invisible pointer-events-none"
        )}
        style={{
          top: mobileCompact ? "10px" : "14px",
        }}
      >
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none z-10" />
          <Input 
            ref={searchInputRef}
            placeholder="Search..." 
            className={cn(
              "pl-10 pr-10 w-full border-transparent",
              "bg-secondary/80 backdrop-blur-sm rounded-full",
              "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/20 focus-visible:outline-none",
              "placeholder:text-primary/50",
              mobileCompact ? "h-8 text-sm" : "h-9"
            )}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-transparent text-primary hover:bg-primary/10 hover:text-primary",
              mobileCompact ? "h-6 w-6" : "h-7 w-7"
            )}
            onClick={() => setSearchActive(false)}
          >
            <X className={cn(
              mobileCompact ? "h-3 w-3" : "h-4 w-4"
            )} />
          </Button>
        </div>
      </div>
      
      {/* Center/Flex spacer */}
      <div className="flex-grow"></div>
      
      {/* Desktop search */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60 pointer-events-none z-10">
            <Search className="h-4 w-4" />
          </div>
          <Input 
            placeholder="Search dashboard..." 
            className={cn(
              "pl-11 h-10 w-[220px] lg:w-64",
              "bg-secondary/60 backdrop-blur-sm rounded-full",
              "border-transparent",
              "focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/20 focus-visible:outline-none",
              "placeholder:text-primary/40"
            )}
          />
        </div>
      </div>
      
      {/* Right section - Icons */}
      <div className="flex items-center gap-3 md:gap-5 shrink-0 px-3 sm:px-4 md:px-6 h-full">
        {/* Mobile search button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "md:hidden rounded-xl text-primary hover:text-primary hover:bg-primary/10",
            mobileCompact ? "h-8 w-8" : "h-9 w-9"
          )}
          onClick={toggleMobileSearch}
        >
          <Search className={mobileCompact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
        
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer transition-transform hover:scale-105">
              <Avatar className={cn(
                "border border-primary/20 shadow-sm",
                mobileCompact ? "h-8 w-8" : "h-9 w-9 md:h-10 md:w-10"
              )}>
                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 z-50 rounded-xl p-2">
            <DropdownMenuLabel className="px-4 py-2.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Guest'}
                </p>
                <p className="text-xs text-muted-foreground">{user?.username || ''}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem 
              className="cursor-pointer rounded-lg px-4 py-2 hover:bg-primary/5"
              onClick={() => navigate('/profile')}
            >
              <User className="mr-3 h-4 w-4 text-primary" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer rounded-lg px-4 py-2 hover:bg-primary/5"
              onClick={() => navigate('/settings')}
            >
              <Settings className="mr-3 h-4 w-4 text-primary" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive rounded-lg px-4 py-2 hover:bg-destructive/5"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 