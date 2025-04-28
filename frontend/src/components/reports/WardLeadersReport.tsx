import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  WardLeader, 
  WardLeadersFilterOptions, 
  HouseholdHead, 
  HouseholdMember, 
  getWardLeadersPaginated, 
  getHouseholdHeads, 
  getHouseholdMembers 
} from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  FileDown, 
  Loader2, 
  RefreshCw, 
  ChevronRight, 
  Users, 
  Home, 
  Map, 
  User,
  Filter 
} from "lucide-react";

export function WardLeadersReport() {
  const [wardLeaders, setWardLeaders] = useState<WardLeader[]>([]);
  const [filterOptions, setFilterOptions] = useState<WardLeadersFilterOptions>({
    municipalities: [],
    barangays: [],
    puroks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Form input states (separate from filter states applied to API)
  const [municipalityInput, setMunicipalityInput] = useState<string>("all"); 
  const [barangayInput, setBarangayInput] = useState<string>("all");
  const [nameInput, setNameInput] = useState<string>("");
  
  // Filter states used for API calls
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all");
  const [barangayFilter, setBarangayFilter] = useState<string>("all");
  const [nameFilter, setNameFilter] = useState<string>("");
  
  // Filtered barangay options based on selected municipality
  const [filteredBarangays, setFilteredBarangays] = useState<{ barangay: string; municipality: string }[]>([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // State for expansions and nested data
  const [expandedLeaders, setExpandedLeaders] = useState<Record<number, boolean>>({});
  const [expandedHouseholds, setExpandedHouseholds] = useState<Record<number, boolean>>({});
  const [householdsByLeader, setHouseholdsByLeader] = useState<Record<number, HouseholdHead[]>>({});
  const [membersByHousehold, setMembersByHousehold] = useState<Record<number, HouseholdMember[]>>({});
  const [loadingHouseholds, setLoadingHouseholds] = useState<Record<number, boolean>>({});
  const [loadingMembers, setLoadingMembers] = useState<Record<number, boolean>>({});
  
  // Use refs for tracking state changes without causing re-renders
  const prevMunicipalityRef = useRef<string>("all");
  const prevBarangayRef = useRef<string>("all");
  const prevNameFilterRef = useRef<string>("");
  const prevPageRef = useRef<number>(1);
  const isMountedRef = useRef<boolean>(false);
  const filterStateRef = useRef({
    municipality: "all",
    barangay: "all",
    name: "",
    page: 1
  });
  
  // Handle API errors
  const handleApiError = useCallback((err: any) => {
    if (err.response) {
      // Server responded with an error status
      console.error("Server error response:", err.response.data);
      
      if (err.response.status === 401) {
        setError('Authentication error. Please log in again.');
      } else if (err.response.status === 403) {
        setError('You do not have permission to access this data.');
      } else if (err.response.status >= 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.response.data?.message || 'Error fetching data from server');
      }
    } else if (err.request) {
      // Request was made but no response received
      console.error("No response received:", err.request);
      setError('No response from server. Check your network connection.');
    } else {
      // Something else went wrong
      setError(err.message || 'Error fetching data from server');
    }
  }, []);
  
  // Filter barangays when municipality input changes - using a stable callback
  useEffect(() => {
    if (!filterOptions.barangays.length) return;
    
    const municipalityChanged = prevMunicipalityRef.current !== municipalityInput;
    
    if (municipalityInput && municipalityInput !== "all") {
      setFilteredBarangays(
        filterOptions.barangays.filter(b => b.municipality === municipalityInput)
      );
      
      // Only reset barangay input when municipality actually changes
      if (municipalityChanged) {
        setBarangayInput("all");
      }
    } else {
      setFilteredBarangays(filterOptions.barangays);
    }
    
    // Update ref with current value for next render
    prevMunicipalityRef.current = municipalityInput;
  }, [municipalityInput, filterOptions.barangays]);
  
  // Fetch ward leaders data with a stable implementation
  const fetchWardLeadersData = useCallback(async (pageNumber: number, isFilterOperation = false) => {
    try {
      // Check if we're making a duplicate request with the same parameters
      const currentFilters = {
        municipality: municipalityFilter,
        barangay: barangayFilter,
        name: nameFilter,
        page: pageNumber
      };
      
      const prevFilters = filterStateRef.current;
      const isIdenticalRequest = 
        prevFilters.municipality === currentFilters.municipality &&
        prevFilters.barangay === currentFilters.barangay &&
        prevFilters.name === currentFilters.name &&
        prevFilters.page === currentFilters.page;
      
      // Skip if this is the same request we just made
      if (isIdenticalRequest && isMountedRef.current) {
        console.log('Skipping duplicate request with identical parameters');
        return;
      }
      
      // Update the filter state ref
      filterStateRef.current = { ...currentFilters };
      
      setLoading(true);
      if (isFilterOperation) {
        setIsFiltering(true);
      }
      setError(null);
      
      // Validate if the selected barangay belongs to the selected municipality
      let validBarangay = barangayFilter;
      if (municipalityFilter !== "all" && barangayFilter !== "all") {
        const barangayExists = filteredBarangays.some(
          b => b.barangay === barangayFilter && b.municipality === municipalityFilter
        );
        
        if (!barangayExists) {
          console.warn(`Selected barangay "${barangayFilter}" does not belong to municipality "${municipalityFilter}"`);
          // Reset to "all" if invalid combination
          validBarangay = "all";
        }
      }
      
      // Create filter object with validated values
      const filterParams = {
        municipality: municipalityFilter !== "all" ? municipalityFilter : undefined,
        barangay: validBarangay !== "all" ? validBarangay : undefined,
        name: nameFilter || undefined
      };
      
      console.log(`Fetching ward leaders (page ${pageNumber}) with filters:`, filterParams);
      
      const response = await getWardLeadersPaginated(pageNumber, ITEMS_PER_PAGE, filterParams);
      
      console.log("Ward leaders response:", {
        leaders: response.data.length,
        total: response.total,
        filterOptions: {
          municipalities: response.filterOptions.municipalities.length,
          barangays: response.filterOptions.barangays.length
        }
      });
      
      setWardLeaders(response.data);
      setFilterOptions(response.filterOptions);
      setTotalCount(response.total);
      setTotalPages(Math.ceil(response.total / ITEMS_PER_PAGE));
      
      // Initialize filtered barangays if municipality filter is not set
      if (!municipalityFilter || municipalityFilter === "all") {
        setFilteredBarangays(response.filterOptions.barangays);
      }
      
      // Reset expansion states when page changes
      setExpandedLeaders({});
      setExpandedHouseholds({});
      setHouseholdsByLeader({});
      setMembersByHousehold({});
      
      // Set refs to track current state
      prevPageRef.current = pageNumber;
      prevMunicipalityRef.current = municipalityFilter;
      prevBarangayRef.current = barangayFilter;
      prevNameFilterRef.current = nameFilter;
      isMountedRef.current = true;
      
    } catch (err: any) {
      console.error("Error fetching ward leaders data:", err);
      handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsFiltering(false);
    }
  }, [municipalityFilter, barangayFilter, nameFilter, filteredBarangays, handleApiError]);
  
  // Stable version of fetchWardLeadersData that doesn't depend on state variables
  const fetchWardLeadersStable = useRef((pageNumber: number, isFilterOperation = false) => {
    fetchWardLeadersData(pageNumber, isFilterOperation);
  });
  
  // Update the stable ref when the callback changes
  useEffect(() => {
    fetchWardLeadersStable.current = (pageNumber: number, isFilterOperation = false) => {
      fetchWardLeadersData(pageNumber, isFilterOperation);
    };
  }, [fetchWardLeadersData]);
  
  // Handle page change with the stable fetch function
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    fetchWardLeadersStable.current(newPage);
  }, []);
  
  // Apply filters - simplified to only trigger on button click
  const applyFilters = useCallback(() => {
    // Set the actual filter values from input states
    setMunicipalityFilter(municipalityInput);
    setBarangayFilter(barangayInput);
    setNameFilter(nameInput);
    
    // Reset to page 1 whenever filters change
    setPage(1);
    setIsFiltering(true);
    
    // Fetch with the new filters
    fetchWardLeadersStable.current(1, true);
  }, [municipalityInput, barangayInput, nameInput]);
  
  // Reset filters - simplified
  const resetFilters = useCallback(() => {
    // Only show filtering indicator if filters are not already at defaults
    const isAlreadyReset = 
      municipalityFilter === "all" && 
      barangayFilter === "all" && 
      nameFilter === "" &&
      municipalityInput === "all" && 
      barangayInput === "all" && 
      nameInput === "";
    
    if (!isAlreadyReset) {
      // Reset all input states
      setMunicipalityInput("all");
      setBarangayInput("all");
      setNameInput("");
      
      // Reset the actual filter states
      setMunicipalityFilter("all");
      setBarangayFilter("all");
      setNameFilter("");
      
      // Reset to page 1
      setPage(1);
      setIsFiltering(true);
      
      // Fetch with reset filters
      setTimeout(() => {
        fetchWardLeadersStable.current(1, true);
      }, 10);
    }
  }, [municipalityFilter, barangayFilter, nameFilter, municipalityInput, barangayInput, nameInput]);
  
  // Refresh data - using stable fetch function
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    fetchWardLeadersStable.current(page);
  }, [page]);
  
  // Export to CSV - no changes needed
  const exportToCSV = useCallback(() => {
    const headers = ["ID", "Name", "Barangay", "Municipality", "Households"];
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    
    wardLeaders.forEach(leader => {
      const row = [
        leader.v_id,
        `"${leader.full_name}"`, // Wrap in quotes to handle commas in names
        `"${leader.barangay}"`,
        `"${leader.municipality}"`,
        leader.household_count
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'ward_leaders_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [wardLeaders]);
  
  // Toggle leader expansion and fetch households if needed - unchanged
  const toggleLeaderExpansion = useCallback(async (leaderId: number) => {
    // If we're already loading data for this leader, prevent toggling
    if (loadingHouseholds[leaderId]) return;
    
    // If expanding and we don't have households data, fetch it first
    if (!expandedLeaders[leaderId] && !householdsByLeader[leaderId]) {
      try {
        setLoadingHouseholds(prev => ({ ...prev, [leaderId]: true }));
        
        console.log(`Fetching households for leader ${leaderId}`);
        const households = await getHouseholdHeads(leaderId);
        console.log(`Received ${households.length} households for leader ${leaderId}`);
        
        // Apply municipality and barangay filters on the client side if needed
        let filteredHouseholds = [...households];
        
        // Only filter on the client side if filters are applied
        if (municipalityFilter !== "all" || barangayFilter !== "all") {
          filteredHouseholds = households.filter(household => {
            // Apply municipality filter if set
            if (municipalityFilter !== "all" && household.municipality !== municipalityFilter) {
              return false;
            }
            
            // Apply barangay filter if set
            if (barangayFilter !== "all" && household.location !== barangayFilter) {
              return false;
            }
            
            return true;
          });
          
          console.log(`Filtered to ${filteredHouseholds.length} households based on current filters`);
        }
        
        setHouseholdsByLeader(prev => ({
          ...prev,
          [leaderId]: filteredHouseholds
        }));
        
        // IMPORTANT: Only toggle expansion AFTER data is loaded
        setExpandedLeaders(prev => ({
          ...prev,
          [leaderId]: true
        }));
      } catch (err) {
        console.error(`Error fetching households for leader ${leaderId}:`, err);
        // Set empty array to avoid repeated failed requests
        setHouseholdsByLeader(prev => ({
          ...prev,
          [leaderId]: []
        }));
      } finally {
        setLoadingHouseholds(prev => ({ ...prev, [leaderId]: false }));
      }
    } else {
      // If we already have data or we're collapsing, simply toggle
      setExpandedLeaders(prev => ({
        ...prev,
        [leaderId]: !prev[leaderId]
      }));
    }
  }, [expandedLeaders, householdsByLeader, loadingHouseholds, municipalityFilter, barangayFilter]);
  
  // Toggle household expansion and fetch members if needed
  const toggleHouseholdExpansion = useCallback(async (householdId: number) => {
    // Toggle household expansion state
    setExpandedHouseholds(prev => ({
      ...prev,
      [householdId]: !prev[householdId]
    }));
    
    // If expanding and we don't have members data, fetch it
    if (!expandedHouseholds[householdId] && !membersByHousehold[householdId]) {
      try {
        setLoadingMembers(prev => ({ ...prev, [householdId]: true }));
        
        const members = await getHouseholdMembers(householdId);
        console.log('Raw household members data:', members);
        
        // Make sure household head is ALWAYS first by manipulating the array order
        // The backend already includes a CASE statement that identifies the head with 'Head of Household' role
        // The query also includes ORDER BY household_role DESC, but we'll enforce it here too
        
        // First, create a custom sort function that ensures head is always first
        const sortedMembers = [...members].sort((a, b) => {
          // If one is head and the other is not, head comes first
          if (a.household_role === 'Head of Household' && b.household_role !== 'Head of Household') return -1;
          if (a.household_role !== 'Head of Household' && b.household_role === 'Head of Household') return 1;
          
          // If neither or both are heads (shouldn't happen), sort by name
          return a.member_name.localeCompare(b.member_name);
        });
        
        console.log('Sorted household members:', sortedMembers);
        
        // Safeguard: Check if any member is the head of household
        const hasHeadOfHousehold = sortedMembers.some(m => m.household_role === 'Head of Household');
        
        // If no head was found in the members (unusual case), try to find the household data and add it
        if (!hasHeadOfHousehold && sortedMembers.length > 0) {
          // We can use the household_head_name from any member as they all have it
          console.warn(`No head of household found among members for household ${householdId}`);
          
          // Log the issue for debugging
          console.log('Members without head:', sortedMembers);
        }
        
        setMembersByHousehold(prev => ({
          ...prev,
          [householdId]: sortedMembers
        }));
      } catch (err) {
        console.error(`Error fetching members for household ${householdId}:`, err);
        // Set empty array to avoid repeated failed requests
        setMembersByHousehold(prev => ({
          ...prev,
          [householdId]: []
        }));
      } finally {
        setLoadingMembers(prev => ({ ...prev, [householdId]: false }));
      }
    }
  }, [expandedHouseholds, membersByHousehold]);

  // Component for ward leader row - unchanged
  const LeaderRow = useCallback(({ leader }: { leader: WardLeader }) => {
    return (
      <TableRow 
        key={`leader-${leader.v_id}`}
        className="border-t border-b-0 border-border/10 hover:bg-secondary/20 cursor-pointer"
        onClick={() => toggleLeaderExpansion(leader.v_id)}
      >
        <TableCell className="py-3">
          <div className="flex items-center">
            <ChevronRight 
              className={`mr-2 h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                expandedLeaders[leader.v_id] ? 'rotate-90' : ''
              }`} 
            />
            <Avatar className="h-8 w-8 mr-2 border border-border/20 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {leader.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{leader.full_name}</div>
              <Badge variant="outline" className="mt-1 rounded-xl bg-primary/5 text-xs">Ward Leader</Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center text-sm">
            <Map className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            {leader.barangay}, {leader.municipality}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            <span>{leader.household_count} households</span>
          </div>
        </TableCell>
        <TableCell className="py-3 text-right">
          {leader.is_printed === 1 ? (
            <div className="flex justify-end">
              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50">
                Printed
              </Badge>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50">
                Not Printed
              </Badge>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }, [expandedLeaders, toggleLeaderExpansion]);
  
  // Add this component for the household head row with the updated badge styling
  const HouseholdHeadRow = useCallback(({ household }: { household: HouseholdHead }) => {
    return (
      <TableRow 
        className="border-0 hover:bg-secondary/20 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          toggleHouseholdExpansion(household.household_id);
        }}
      >
        <TableCell className="py-2.5 pl-12 w-[40%]">
          <div className="flex items-center">
            <ChevronRight 
              className={`mr-2 h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                expandedHouseholds[household.household_id] ? 'rotate-90' : ''
              }`} 
            />
            <div>
              <div className="font-medium">{household.household_head_name}</div>
              <Badge variant="outline" className="mt-0.5 rounded-xl text-xs bg-primary/10 text-primary border-primary/20 font-medium">
                Head of Household
              </Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-2.5 w-[30%]">
          <div className="flex items-center text-sm">
            <Home className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            {household.location}, {household.municipality}
          </div>
          {household.street_address && (
            <div className="text-xs text-muted-foreground mt-0.5 pl-5">
              {household.street_address}
            </div>
          )}
        </TableCell>
        <TableCell className="py-2.5 w-[15%]">
          <div className="flex items-center text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            <span>{household.household_members_count} members</span>
          </div>
        </TableCell>
        <TableCell className="py-2.5 w-[15%] text-right">
          {household.is_printed === 1 ? (
            <div className="flex justify-end">
              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50">
                Printed
              </Badge>
            </div>
          ) : (
            <div className="flex justify-end">
              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50">
                Not Printed
              </Badge>
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  }, [expandedHouseholds, toggleHouseholdExpansion]);
  
  // Generate pagination items with memoization to prevent unnecessary recalculation
  const generatePaginationItems = useCallback(() => {
    const items: React.ReactNode[] = [];
    
    // More stable approach for responsive check using state instead of direct window access
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    
    if (isMobile) {
      return (
        <>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handlePageChange(page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink isActive>{page}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext 
              onClick={() => handlePageChange(page + 1)}
              className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </>
      );
    }
    
    // Previous button
    items.push(
      <PaginationItem key="prev">
        <PaginationPrevious 
          onClick={() => handlePageChange(page - 1)}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    // First page
    items.push(
      <PaginationItem key="page-1">
        <PaginationLink 
          onClick={() => handlePageChange(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Ellipsis after first page
    if (page > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last page as they're handled separately
      
      items.push(
        <PaginationItem key={`page-${i}`}>
          <PaginationLink 
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Ellipsis before last page
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Last page (if more than 1 page)
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Next button
    items.push(
      <PaginationItem key="next">
        <PaginationNext 
          onClick={() => handlePageChange(page + 1)}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        />
      </PaginationItem>
    );
    
    return items;
  }, [page, totalPages, handlePageChange]);
  
  // Initial fetch - Run only once on mount
  useEffect(() => {
    fetchWardLeadersStable.current(1);
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array to run only once on mount
  
  // Render loading state for initial load
  if (loading && wardLeaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60 mb-4" />
        <p className="text-muted-foreground">Loading ward leaders data...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && wardLeaders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={refreshData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }
  
  // Memoized pagination element to prevent unnecessary recreation
  const paginationElement = totalPages > 0 ? (
    <div className="mt-4 flex justify-center">
      <Pagination>
        <PaginationContent>
          {generatePaginationItems()}
        </PaginationContent>
      </Pagination>
    </div>
  ) : null;
  
  return (
    <Card className="rounded-2xl shadow-sm border-border/40">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <CardTitle className="text-xl font-medium">Ward Leaders Report</CardTitle>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing || loading}
              className="rounded-lg border-border/60"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={loading || isRefreshing}
              className="rounded-lg border-border/60"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {/* Filters */}
      <CardContent className="pb-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="municipality">Municipality</Label>
            <Select
              value={municipalityInput}
              onValueChange={setMunicipalityInput}
            >
              <SelectTrigger id="municipality" className="w-full">
                <SelectValue placeholder="Select Municipality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Municipalities</SelectItem>
                {filterOptions.municipalities.map((m) => (
                  <SelectItem key={m.municipality} value={m.municipality}>
                    {m.municipality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay</Label>
            <Select
              value={barangayInput}
              onValueChange={setBarangayInput}
              disabled={filteredBarangays.length === 0}
            >
              <SelectTrigger id="barangay" className="w-full">
                <SelectValue placeholder="Select Barangay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {filteredBarangays.map((b) => (
                  <SelectItem key={`${b.municipality}-${b.barangay}`} value={b.barangay}>
                    {b.barangay}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Name Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Search by name..."
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="flex items-end space-x-2">
            <Button 
              onClick={applyFilters} 
              variant="default" 
              className="flex-1"
              disabled={isFiltering}
            >
              {isFiltering ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Filter className="h-4 w-4 mr-1" />
              )}
              {isFiltering ? "Filtering..." : "Apply Filters"}
            </Button>
            <Button 
              onClick={resetFilters} 
              variant="outline" 
              className="flex-1"
              disabled={isFiltering}
            >
              Reset
            </Button>
          </div>
        </div>
        
        {/* Results count */}
        <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
          <span>
            {wardLeaders.length > 0 
              ? `Showing ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount} ward leaders` 
              : "No ward leaders found"}
          </span>
          {(loading || isFiltering) && (
            <span className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              {isFiltering ? "Filtering data..." : "Loading data..."}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardContent>
        <div className="overflow-x-auto relative">
          {/* Loading overlay - show for both initial load and when filtering with existing data */}
          {(loading || isFiltering) && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <div className="bg-background/90 p-4 rounded-xl shadow-md flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>{isFiltering ? "Applying filters..." : "Loading ward leaders..."}</span>
              </div>
            </div>
          )}
          
          <Table className="rounded-md border shadow-sm">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40%]">Ward Leader</TableHead>
                <TableHead className="w-[30%]">Location</TableHead>
                <TableHead className="w-[15%]">Details</TableHead>
                <TableHead className="w-[15%] text-right">Print Status</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading && wardLeaders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      <p className="text-muted-foreground">Loading ward leaders...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : wardLeaders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">No ward leaders found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                wardLeaders.map((leader) => (
                  <React.Fragment key={leader.v_id}>
                    {/* Ward Leader Row */}
                    <LeaderRow leader={leader} />
                    
                    {/* Household Heads (when expanded) */}
                    {expandedLeaders[leader.v_id] && (
                      <TableRow className="border-0">
                        <TableCell colSpan={4} className="p-0 border-0">
                          {loadingHouseholds[leader.v_id] ? (
                            <div className="flex justify-center items-center py-4 bg-muted/5">
                              <Loader2 className="h-5 w-5 animate-spin text-primary/60 mr-2" />
                              <p className="text-sm text-muted-foreground">Loading household heads...</p>
                            </div>
                          ) : householdsByLeader[leader.v_id]?.length ? (
                            <div className="bg-muted/5 py-2">
                              <Table>
                                <TableBody>
                                  {householdsByLeader[leader.v_id].map((household) => (
                                    <React.Fragment key={`household-${household.household_id}`}>
                                      {/* Use the new HouseholdHeadRow component */}
                                      <HouseholdHeadRow household={household} />
                                      
                                      {/* Household Members (when expanded) */}
                                      {expandedHouseholds[household.household_id] && (
                                        <TableRow className="border-0">
                                          <TableCell colSpan={4} className="p-0 border-0 bg-muted/10">
                                            {loadingMembers[household.household_id] ? (
                                              <div className="flex justify-center items-center py-3">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary/60 mr-2" />
                                                <p className="text-sm text-muted-foreground">Loading members...</p>
                                              </div>
                                            ) : membersByHousehold[household.household_id]?.length ? (
                                              <div className="pl-16 pr-4 py-2">
                                                <Table>
                                                  <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                      <TableHead className="text-xs font-medium">Member</TableHead>
                                                      <TableHead className="text-xs font-medium">Details</TableHead>
                                                      <TableHead className="text-xs font-medium">Precinct</TableHead>
                                                      <TableHead className="text-xs font-medium text-right">Status</TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {membersByHousehold[household.household_id].map((member) => (
                                                      <TableRow 
                                                        key={`member-${member.member_id}`}
                                                        className={`border-0 hover:bg-muted/20 ${member.household_role === 'Head of Household' ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}
                                                      >
                                                        <TableCell className="py-2 w-[40%]">
                                                          <div className="flex items-center pl-2">
                                                            <User className={`h-3.5 w-3.5 mr-1.5 ${member.household_role === 'Head of Household' ? 'text-primary' : 'text-muted-foreground'}`} />
                                                            <div>
                                                              <div className={member.household_role === 'Head of Household' ? 'font-semibold text-sm' : 'font-medium text-sm'}>
                                                                {member.member_name} 
                                                                {member.household_role === 'Head of Household' && (
                                                                  <Badge variant="outline" className="ml-2 rounded-xl bg-primary/20 text-xs text-primary border-primary/30">
                                                                    Head
                                                                  </Badge>
                                                                )}
                                                              </div>
                                                              <div className="text-xs text-muted-foreground">
                                                                {member.household_role === 'Head of Household' ? 
                                                                  'Head of Household' : 'Household Member'}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </TableCell>
                                                        <TableCell className="py-2 w-[30%]">
                                                          <div className="flex flex-col">
                                                            <div className="text-xs text-muted-foreground">
                                                              {member.gender}, {member.age} years old
                                                            </div>
                                                            {member.birthdate && (
                                                              <div className="text-xs text-muted-foreground">
                                                                Born: {new Date(member.birthdate).toLocaleDateString()}
                                                              </div>
                                                            )}
                                                          </div>
                                                        </TableCell>
                                                        <TableCell className="py-2 w-[15%]">
                                                          {member.precinct_no ? (
                                                            <Badge variant="outline" className="rounded-xl text-xs font-normal">
                                                              Precinct: {member.precinct_no}
                                                            </Badge>
                                                          ) : (
                                                            <span className="text-xs text-muted-foreground">No precinct</span>
                                                          )}
                                                        </TableCell>
                                                        <TableCell className="py-2 w-[15%] text-right">
                                                          {household.is_printed === 1 ? (
                                                            <div className="flex justify-end">
                                                              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50">
                                                                Printed
                                                              </Badge>
                                                            </div>
                                                          ) : (
                                                            <div className="flex justify-end">
                                                              <Badge variant="outline" className="rounded-xl text-xs font-normal bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50">
                                                                Not Printed
                                                              </Badge>
                                                            </div>
                                                          )}
                                                        </TableCell>
                                                      </TableRow>
                                                    ))}
                                                  </TableBody>
                                                </Table>
                                              </div>
                                            ) : (
                                              <div className="text-center py-2">
                                                <p className="text-xs text-muted-foreground">No household members found.</p>
                                              </div>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </React.Fragment>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="bg-muted/5 text-center py-4">
                              <p className="text-sm text-muted-foreground">No households found for this ward leader.</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination - use memoized element and disable during loading */}
        {paginationElement && (
          <div className={`mt-4 flex justify-center ${(loading || isFiltering) ? "opacity-70 pointer-events-none" : ""}`}>
            <Pagination>
              <PaginationContent>
                {generatePaginationItems()}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 