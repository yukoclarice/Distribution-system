import { useEffect, useState, useCallback, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button" 
import { Loader2, RefreshCw } from "lucide-react"
import { UsersTbl, getUsersTblPaginated } from "@/lib/api"

// Legacy User type - keeping for reference
type User = {
  id: string
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  lastLogin: string
  avatarUrl?: string
}

type UsersTableProps = {
  users?: User[]
  showRefresh?: boolean
}

export function UsersTable({ users: propUsers, showRefresh = false }: UsersTableProps) {
  const [users, setUsers] = useState<UsersTbl[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const ITEMS_PER_PAGE = 10
  
  // Ref for intersection observer
  const observerRef = useRef<IntersectionObserver | null>(null)
  const lastUserElementRef = useRef<HTMLTableRowElement | null>(null)

  // Fetch initial users
  const fetchInitialUsers = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      setPage(1)
      
      const response = await getUsersTblPaginated(1, ITEMS_PER_PAGE)
      setUsers(response.data)
      setHasMore(response.hasMore)
      setTotalCount(response.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more users
  const loadMoreUsers = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    
    try {
      setIsLoadingMore(true)
      const nextPage = page + 1
      
      const response = await getUsersTblPaginated(nextPage, ITEMS_PER_PAGE)
      setUsers(prev => [...prev, ...response.data])
      setHasMore(response.hasMore)
      setPage(nextPage)
    } catch (err) {
      console.error('Error loading more users:', err)
      // Don't set error state here to avoid disrupting the main view
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, isLoadingMore, hasMore])
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Create a new IntersectionObserver when component mounts
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreUsers()
        }
      },
      { threshold: 0.5 } // Trigger when element is 50% visible
    )
    
    observerRef.current = observer
    
    return () => {
      // Clean up the observer when component unmounts
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoading, isLoadingMore, loadMoreUsers])
  
  // Attach observer to the last item in the list
  useEffect(() => {
    if (lastUserElementRef.current && observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current.observe(lastUserElementRef.current)
    }
  }, [users])
  
  // Initial fetch
  useEffect(() => {
    fetchInitialUsers()
  }, [fetchInitialUsers])

  // Handle refresh click
  const handleRefresh = () => {
    fetchInitialUsers()
  }

  // If users were passed as props (for testing/storybook)
  if (propUsers) {
    return renderLegacyUsers(propUsers)
  }

  return (
    <div className="w-full">
      {showRefresh && (
        <div className="flex justify-end mb-5 px-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="rounded-xl h-9 px-4 border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {isLoading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Refresh</>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="w-full p-4 mb-5 mx-6 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm">
          Error: {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            className="ml-3 rounded-lg"
          >
            Retry
          </Button>
        </div>
      )}

      <div className="overflow-auto px-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="px-4 py-3.5 text-xs font-medium text-foreground/70">User</TableHead>
              <TableHead className="hidden sm:table-cell px-4 py-3.5 text-xs font-medium text-foreground/70">Type</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-medium text-foreground/70">Status</TableHead>
              <TableHead className="hidden md:table-cell px-4 py-3.5 text-xs font-medium text-foreground/70">Contact</TableHead>
              <TableHead className="hidden lg:table-cell px-4 py-3.5 text-xs font-medium text-foreground/70">Last Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/60 mb-3" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <p className="text-muted-foreground">No users found.</p>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {users.map((user, index) => {
                  // Determine if this is the last item for observer
                  const isLastItem = index === users.length - 1
                  
                  return (
                    <TableRow 
                      key={user.user_id} 
                      className="border-0 hover:bg-secondary/40 transition-colors"
                      ref={isLastItem ? lastUserElementRef : null}
                    >
                      <TableCell className="py-4 px-4 border-b border-border/20">
                    <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/20 shadow-sm">
                        <AvatarImage 
                          src={user.imgname ? `/images/${user.imgname}` : undefined} 
                          alt={`${user.fname || ''} ${user.lname || ''}`} 
                        />
                            <AvatarFallback className="bg-primary/10 text-primary">
                          {user.fname && user.lname 
                            ? `${user.fname[0]}${user.lname[0]}` 
                            : user.username?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium leading-none truncate max-w-[120px] sm:max-w-none">
                          {`${user.fname || ''} ${user.mname ? user.mname[0] + '. ' : ''}${user.lname || ''}`}
                        </p>
                            <p className="text-sm text-muted-foreground mt-1.5 truncate max-w-[120px] sm:max-w-none">
                          {user.username || 'N/A'}
                        </p>
                            <div className="sm:hidden text-xs text-muted-foreground mt-1.5">
                          {user.user_type || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                      <TableCell className="hidden sm:table-cell px-4 border-b border-border/20">{user.user_type || 'N/A'}</TableCell>
                      <TableCell className="px-4 border-b border-border/20">
                    <Badge 
                      variant={user.status === "active" ? "secondary" : "outline"}
                      className={
                        user.status === "active" 
                              ? "bg-green-100/80 text-green-800 hover:bg-green-100/90 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-xl" 
                              : "px-2.5 py-1 rounded-xl"
                      }
                    >
                      {user.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground px-4 border-b border-border/20">
                    {user.contact_no || 'N/A'}
                  </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground px-4 border-b border-border/20">
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString() 
                      : 'Never'}
                  </TableCell>
                </TableRow>
                  )
                })}
                
                {/* Loading indicator for pagination */}
                {isLoadingMore && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center border-0">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary/60 mr-2" />
                        <p className="text-sm text-muted-foreground">Loading more users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Status info */}
                {!isLoadingMore && !hasMore && users.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-16 text-center text-xs text-muted-foreground border-0">
                      Showing all {users.length} of {totalCount} users
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Function to render legacy users (for backward compatibility)
function renderLegacyUsers(users: User[]) {
  return (
    <div className="w-full">
      <div className="overflow-auto px-6">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/40 hover:bg-transparent">
              <TableHead className="px-4 py-3.5 text-xs font-medium text-foreground/70">User</TableHead>
              <TableHead className="hidden sm:table-cell px-4 py-3.5 text-xs font-medium text-foreground/70">Role</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-medium text-foreground/70">Status</TableHead>
              <TableHead className="hidden md:table-cell px-4 py-3.5 text-xs font-medium text-foreground/70">Last login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-0 hover:bg-secondary/40 transition-colors">
                <TableCell className="py-4 px-4 border-b border-border/20">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border/20 shadow-sm">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium leading-none truncate max-w-[120px] sm:max-w-none">{user.name}</p>
                      <p className="text-sm text-muted-foreground mt-1.5 truncate max-w-[120px] sm:max-w-none">{user.email}</p>
                      <div className="sm:hidden text-xs text-muted-foreground mt-1.5">
                        {user.role}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell px-4 border-b border-border/20">{user.role}</TableCell>
                <TableCell className="px-4 border-b border-border/20">
                  <Badge 
                    variant={user.status === "active" ? "secondary" : "outline"}
                    className={
                      user.status === "active" 
                        ? "bg-green-100/80 text-green-800 hover:bg-green-100/90 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-1 rounded-xl" 
                        : "px-2.5 py-1 rounded-xl"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground px-4 border-b border-border/20">{user.lastLogin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 