import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { 
  HouseholdHead, 
  HouseholdsFilterOptions, 
  HouseholdMember, 
  getHouseholdsPaginated, 
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

export function HouseholdsReport() {
  const [households, setHouseholds] = useState<HouseholdHead[]>([]);
  const [filterOptions, setFilterOptions] = useState<HouseholdsFilterOptions>({
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
  const [expandedHouseholds, setExpandedHouseholds] = useState<Record<number, boolean>>({});
  const [membersByHousehold, setMembersByHousehold] = useState<Record<number, HouseholdMember[]>>({});
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
    console.error("API Error:", err);
    setError(err.message || "An error occurred while fetching data");
    setLoading(false);
    setIsFiltering(false);
    setIsRefreshing(false);
  }, []);
  
  // Create a stable fetch function that can be referenced in useEffect
  const fetchHouseholdsStable = useRef(async (pageToFetch = page, isFilterChange = false) => {
    try {
      // Set loading state based on context
      if (isFilterChange) {
        setIsFiltering(true);
      } else if (!isRefreshing) {
        setLoading(true);
      }
      
      // Clear any previous errors
      setError(null);
      
      // Update filter state ref to track current state
      filterStateRef.current = {
        municipality: municipalityFilter,
        barangay: barangayFilter,
        name: nameFilter,
        page: pageToFetch
      };
      
      // Fetch households with current filters
      const response = await getHouseholdsPaginated(
        pageToFetch,
        ITEMS_PER_PAGE,
        municipalityFilter,
        barangayFilter,
        nameFilter,
        { bypassCache: isRefreshing }
      );
      
      // Update state with response data
      setHouseholds(response.households);
      setFilterOptions(response.filterOptions);
      setTotalCount(response.meta.total);
      setTotalPages(response.meta.totalPages);
      
      // Update filtered barangays based on selected municipality
      if (municipalityFilter !== 'all') {
        setFilteredBarangays(
          response.filterOptions.barangays.filter(
            b => b.municipality === municipalityFilter
          )
        );
      } else {
        setFilteredBarangays(response.filterOptions.barangays);
      }
      
      // Update page if different from current
      if (pageToFetch !== page) {
        setPage(pageToFetch);
      }
      
      // Reset loading states
      setLoading(false);
      setIsFiltering(false);
      setIsRefreshing(false);
      
      // Update refs for tracking previous state
      prevMunicipalityRef.current = municipalityFilter;
      prevBarangayRef.current = barangayFilter;
      prevNameFilterRef.current = nameFilter;
      prevPageRef.current = pageToFetch;
      
    } catch (err) {
      handleApiError(err);
    }
  });
  
  // Update the stable fetch function when dependencies change
  useEffect(() => {
    fetchHouseholdsStable.current = async (pageToFetch = page, isFilterChange = false) => {
      try {
        // Set loading state based on context
        if (isFilterChange) {
          setIsFiltering(true);
        } else if (!isRefreshing) {
          setLoading(true);
        }
        
        // Clear any previous errors
        setError(null);
        
        // Update filter state ref to track current state
        filterStateRef.current = {
          municipality: municipalityFilter,
          barangay: barangayFilter,
          name: nameFilter,
          page: pageToFetch
        };
        
        // Fetch households with current filters
        const response = await getHouseholdsPaginated(
          pageToFetch,
          ITEMS_PER_PAGE,
          municipalityFilter,
          barangayFilter,
          nameFilter,
          { bypassCache: isRefreshing }
        );
        
        // Update state with response data
        setHouseholds(response.households);
        setFilterOptions(response.filterOptions);
        setTotalCount(response.meta.total);
        setTotalPages(response.meta.totalPages);
        
        // Update filtered barangays based on selected municipality
        if (municipalityFilter !== 'all') {
          setFilteredBarangays(
            response.filterOptions.barangays.filter(
              b => b.municipality === municipalityFilter
            )
          );
        } else {
          setFilteredBarangays(response.filterOptions.barangays);
        }
        
        // Update page if different from current
        if (pageToFetch !== page) {
          setPage(pageToFetch);
        }
        
        // Reset loading states
        setLoading(false);
        setIsFiltering(false);
        setIsRefreshing(false);
        
        // Update refs for tracking previous state
        prevMunicipalityRef.current = municipalityFilter;
        prevBarangayRef.current = barangayFilter;
        prevNameFilterRef.current = nameFilter;
        prevPageRef.current = pageToFetch;
        
      } catch (err) {
        handleApiError(err);
      }
    };
  }, [handleApiError, municipalityFilter, barangayFilter, nameFilter, page, isRefreshing]);
  
  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    fetchHouseholdsStable.current(newPage);
  }, [page, totalPages]);
  
  // Apply filters from input fields
  const applyFilters = useCallback(() => {
    // Only apply filters if they have changed
    if (
      municipalityInput === municipalityFilter &&
      barangayInput === barangayFilter &&
      nameInput === nameFilter
    ) {
      return;
    }
    
    // Update filter states
    setMunicipalityFilter(municipalityInput);
    setBarangayFilter(barangayInput);
    setNameFilter(nameInput);
    
    // Reset to page 1
    setPage(1);
    setIsFiltering(true);
    
    // Fetch with new filters
    setTimeout(() => {
      fetchHouseholdsStable.current(1, true);
    }, 10);
  }, [municipalityInput, barangayInput, nameInput, municipalityFilter, barangayFilter, nameFilter]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    // Only reset if filters are not already at defaults
    if (
      municipalityFilter === 'all' &&
      barangayFilter === 'all' &&
      nameFilter === ''
    ) {
      return;
    }
    
    // Reset input fields
    setMunicipalityInput('all');
    setBarangayInput('all');
    setNameInput('');
    
    // Reset filter states
    setMunicipalityFilter('all');
    setBarangayFilter('all');
    setNameFilter('');
    
    // Reset to page 1
    setPage(1);
    setIsFiltering(true);
    
    // Fetch with reset filters
    setTimeout(() => {
      fetchHouseholdsStable.current(1, true);
    }, 10);
  }, [municipalityFilter, barangayFilter, nameFilter]);
  
  // Refresh data
  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    fetchHouseholdsStable.current(page);
  }, [page]);
  
  // Export to CSV
  const exportToCSV = useCallback(() => {
    const headers = ["ID", "Household Head", "Location", "Municipality", "Members"];
    
    // Create CSV content
    let csvContent = headers.join(",") + "\n";
    
    households.forEach(household => {
      const row = [
        household.household_id,
        `"${household.household_head_name}"`,
        `"${household.location}"`,
        `"${household.municipality}"`,
        household.household_members_count
      ];
      
      csvContent += row.join(",") + "\n";
    });
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'households_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [households]);
  
  // Toggle household expansion and fetch members if needed
  const toggleHouseholdExpansion = useCallback(async (householdId: number) => {
    // If we're already loading data for this household, prevent toggling
    if (loadingMembers[householdId]) return;
    
    // If expanding and we don't have members data, fetch it first
    if (!expandedHouseholds[householdId] && !membersByHousehold[householdId]) {
      try {
        setLoadingMembers(prev => ({ ...prev, [householdId]: true }));
        
        console.log(`Fetching members for household ${householdId}`);
        const members = await getHouseholdMembers(householdId);
        console.log(`Received ${members.length} members for household ${householdId}`);
        
        // Apply municipality and barangay filters on the client side if needed
        let filteredMembers = [...members];
        
        // Only filter on the client side if filters are applied
        if (municipalityFilter !== "all" || barangayFilter !== "all") {
          filteredMembers = members.filter(member => {
            // Apply municipality filter if set
            if (municipalityFilter !== "all" && member.municipality !== municipalityFilter) {
              return false;
            }
            
            // Apply barangay filter if set
            if (barangayFilter !== "all" && member.barangay !== barangayFilter) {
              return false;
            }
            
            return true;
          });
          
          console.log(`Filtered to ${filteredMembers.length} members based on current filters`);
        }
        
        setMembersByHousehold(prev => ({
          ...prev,
          [householdId]: filteredMembers
        }));
        
        // IMPORTANT: Only toggle expansion AFTER data is loaded
        setExpandedHouseholds(prev => ({
          ...prev,
          [householdId]: true
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
    } else {
      // If we already have data or we're collapsing, simply toggle
      setExpandedHouseholds(prev => ({
        ...prev,
        [householdId]: !prev[householdId]
      }));
    }
  }, [expandedHouseholds, membersByHousehold, loadingMembers, municipalityFilter, barangayFilter]);
  
  // Component for household row
  const HouseholdRow = useCallback(({ household }: { household: HouseholdHead }) => {
    return (
      <TableRow 
        key={`household-${household.household_id}`}
        className="border-t border-b-0 border-border/10 hover:bg-secondary/20 cursor-pointer"
        onClick={() => toggleHouseholdExpansion(household.household_id)}
      >
        <TableCell className="py-3">
          <div className="flex items-center">
            <ChevronRight 
              className={`mr-2 h-4 w-4 transition-transform duration-200 text-muted-foreground ${
                expandedHouseholds[household.household_id] ? 'rotate-90' : ''
              }`} 
            />
            <Avatar className="h-8 w-8 mr-2 border border-border/20 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {household.household_head_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{household.household_head_name}</div>
              <Badge variant="outline" className="mt-1 rounded-xl bg-primary/5 text-xs">Head of Household</Badge>
            </div>
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center text-sm">
            <Map className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            {household.barangay}, {household.municipality}
          </div>
        </TableCell>
        <TableCell className="py-3">
          <div className="flex items-center text-sm">
            <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" /> 
            <span>{household.household_members_count} members</span>
          </div>
        </TableCell>
        <TableCell className="py-3 text-right">
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
  
  // Generate pagination items
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
    fetchHouseholdsStable.current(1);
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Update filtered barangays when municipality changes
  useEffect(() => {
    if (municipalityInput === 'all') {
      setFilteredBarangays(filterOptions.barangays);
    } else {
      setFilteredBarangays(
        filterOptions.barangays.filter(b => b.municipality === municipalityInput)
      );
    }
    
    // Reset barangay selection when municipality changes
    if (prevMunicipalityRef.current !== municipalityInput) {
      setBarangayInput('all');
    }
  }, [municipalityInput, filterOptions.barangays]);
  
  // Memoize pagination element to prevent unnecessary recalculation
  const paginationElement = useMemo(() => {
    return generatePaginationItems();
  }, [generatePaginationItems]);
  
  return (
    <Card className="rounded-2xl shadow-sm border-border/40 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>Households Report</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={isRefreshing || loading}
              className="h-9"
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
              disabled={loading || households.length === 0}
              className="h-9"
            >
              <FileDown className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {totalCount > 0 && `${totalCount} households found`}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
            {households.length > 0 
              ? `Showing ${(page - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(page * ITEMS_PER_PAGE, totalCount)} of ${totalCount} households` 
              : "No households found"}
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
                <span>{isFiltering ? "Applying filters..." : "Loading households..."}</span>
              </div>
            </div>
          )}
          
          <Table className="rounded-md border shadow-sm">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[40%]">Household Head</TableHead>
                <TableHead className="w-[30%]">Location</TableHead>
                <TableHead className="w-[15%]">Members</TableHead>
                <TableHead className="w-[15%] text-right">Print Status</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading && households.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
                      <p className="text-muted-foreground">Loading households...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : households.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <p className="text-muted-foreground">No households found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                households.map((household) => (
                  <React.Fragment key={household.household_id}>
                    {/* Household Row */}
                    <HouseholdRow household={household} />
                    
                    {/* Household Members (when expanded) */}
                    {expandedHouseholds[household.household_id] && (
                      <TableRow className="border-0">
                        <TableCell colSpan={4} className="p-0 border-0">
                          {loadingMembers[household.household_id] ? (
                            <div className="flex justify-center items-center py-4 bg-muted/5">
                              <Loader2 className="h-5 w-5 animate-spin text-primary/60 mr-2" />
                              <p className="text-sm text-muted-foreground">Loading household members...</p>
                            </div>
                          ) : membersByHousehold[household.household_id]?.length ? (
                            <div className="bg-muted/5 py-2">
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
                            <div className="flex justify-center items-center py-4 bg-muted/5">
                              <p className="text-sm text-muted-foreground">No household members found.</p>
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