import { useState, useEffect, useCallback, useRef } from "react";
import { 
  WardLeadersFilterOptions, 
  getWardLeadersPaginated,
  getHouseholdDataForPrintingDirect,
  markHouseholdsAsPrinted,
  PrintHouseholdData,
  getWardLeaderDataForPrinting,
  markWardLeadersAsPrinted,
  PrintWardLeaderData,
  getBarangayCoordinatorDataForPrinting,
  markBarangayCoordinatorsAsPrinted
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Loader2, 
  Filter, 
  Printer,
  RefreshCw,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import HouseholdPrintTemplate from "@/components/print/HouseholdPrintTemplate";
import WardLeaderPrintTemplate from "@/components/print/WardLeaderPrintTemplate";
import BarangayCoordinatorPrintTemplate from "@/components/print/BarangayCoordinatorPrintTemplate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function PrintPage() {
  const { user } = useAuth();
  const [filterOptions, setFilterOptions] = useState<WardLeadersFilterOptions>({
    municipalities: [],
    barangays: [],
    puroks: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  
  // For onChange filtering, we don't need separate input and filter states
  // So we'll only use one set of states
  const [printType, setPrintType] = useState<string>("household");
  const [municipality, setMunicipality] = useState<string>("all");
  const [barangay, setBarangay] = useState<string>("all");
  const [purok, setPurok] = useState<string>("all");
  const [householdLimit, setHouseholdLimit] = useState<string>("500");
  // New state for sorting preference
  const [sortBy, setSortBy] = useState<string>("purok_lastname");
  
  // Filtered barangay options based on selected municipality
  const [filteredBarangays, setFilteredBarangays] = useState<{ barangay: string; municipality: string }[]>([]);
  // Filtered purok options based on selected barangay
  const [filteredPuroks, setFilteredPuroks] = useState<{ purok_st: string; barangay: string; municipality: string }[]>([]);
  
  // Use refs for tracking state changes without causing re-renders
  const prevMunicipalityRef = useRef<string>("all");
  const prevBarangayRef = useRef<string>("all");
  const isMountedRef = useRef<boolean>(false);

  // References to the printable components
  const householdPrintRef = useRef<HTMLDivElement>(null);
  const wardLeaderPrintRef = useRef<HTMLDivElement>(null);
  const barangayCoordinatorPrintRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold the actual data to be printed (bypasses React's state updates)
  const printHouseholdDataRef = useRef<PrintHouseholdData[]>([{
    householdId: 0,
    householdNumber: "001",
    wardLeader: "Loading...",
    members: [],
    receivedBy: {
      name: "",
      signature: "",
      position: "",
      timeSigned: ""
    }
  }]);
  
  const printWardLeaderDataRef = useRef<PrintWardLeaderData[]>([{
    leaderId: 0,
    wardLeaderNumber: "001",
    v_id: 0,
    name: "Loading...",
    precinct: "N/A",
    barangay: "N/A",
    municipality: "N/A",
    gender: "N/A",
    birthday: "N/A",
    electionYear: "2025",
    receivedBy: {
      name: "",
      signature: "",
      position: "",
      timeSigned: ""
    }
  }]);

  const printBarangayCoordinatorDataRef = useRef<PrintWardLeaderData[]>([{
    leaderId: 0,
    wardLeaderNumber: "001",
    v_id: 0,
    name: "Loading...",
    precinct: "N/A",
    barangay: "N/A",
    municipality: "N/A",
    gender: "N/A",
    birthday: "N/A",
    electionYear: "2025",
    receivedBy: {
      name: "",
      signature: "",
      position: "",
      timeSigned: ""
    }
  }]);

  // For resolving the print Promise
  const promiseResolveRef = useRef<(() => void) | null>(null);

  // Array of household data for printing
  const [printHouseholdData, setPrintHouseholdData] = useState<PrintHouseholdData[]>([]);
  // Array of ward leader data for printing
  const [printWardLeaderData, setPrintWardLeaderData] = useState<PrintWardLeaderData[]>([]);
  // Array of barangay coordinator data for printing
  const [printBarangayCoordinatorData, setPrintBarangayCoordinatorData] = useState<PrintWardLeaderData[]>([]);
  // Index of the current item being printed
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // Print confirmation dialog state
  const [showPrintConfirmDialog, setShowPrintConfirmDialog] = useState(false);
  const [markingPrinted, setMarkingPrinted] = useState(false);

  // Data for the household print template
  const [printData, setPrintData] = useState<PrintHouseholdData>({
    householdId: 0,
    householdNumber: "001",
    wardLeader: "John Doe",
    members: [
      { name: "ALCANTARA, CHRISTOPER", position: "HH Head", remarks: "STRAIGHT" },
      { name: "ALCANTARA, Dave", position: "Member", remarks: "STRAIGHT" },
      { name: "ALCANTARA, JANE", position: "Member", remarks: "RODRIGUEZ" },
    ],
    receivedBy: {
      name: "",
      signature: "",
      position: "",
      timeSigned: ""
    }
  });
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: "/print" } }} />;
  }
  
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
  
  // Filter barangays when municipality changes - using a stable callback
  useEffect(() => {
    if (!filterOptions.barangays.length) return;
    
    const municipalityChanged = prevMunicipalityRef.current !== municipality;
    
    if (municipality && municipality !== "all") {
      setFilteredBarangays(
        filterOptions.barangays.filter(b => b.municipality === municipality)
      );
      
      // Only reset barangay when municipality actually changes
      if (municipalityChanged) {
        setBarangay("all");
        setPurok("all"); // Also reset purok when municipality changes
      }
    } else {
      setFilteredBarangays(filterOptions.barangays);
    }
    
    // Update ref with current value for next render
    prevMunicipalityRef.current = municipality;
  }, [municipality, filterOptions.barangays]);
  
  // Filter puroks when barangay changes
  useEffect(() => {
    if (!filterOptions.puroks.length) return;
    
    const barangayChanged = prevBarangayRef.current !== barangay;
    
    if (barangay && barangay !== "all") {
      // For purok filtering, we need both municipality and barangay
      setFilteredPuroks(
        filterOptions.puroks.filter(p => 
          p.municipality === municipality && 
          p.barangay === barangay
        )
      );
      
      // Reset purok when barangay changes
      if (barangayChanged) {
        setPurok("all");
      }
    } else {
      // If no barangay is selected, clear puroks
      setFilteredPuroks([]);
      setPurok("all");
    }
    
    // Update ref with current value for next render
    prevBarangayRef.current = barangay;
  }, [barangay, municipality, filterOptions.puroks]);
  
  // Fetch initial filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Continue to use ward leaders API just for filter options
      // This keeps the UI working without changes to filter selection
      const response = await getWardLeadersPaginated(1, 10);
      
      setFilterOptions(response.filterOptions);
      
      // Initialize filtered barangays
      setFilteredBarangays(response.filterOptions.barangays);
      
      // Initialize filtered puroks
      setFilteredPuroks(response.filterOptions.puroks);
      
      // Mark component as mounted
      isMountedRef.current = true;
      
    } catch (err: any) {
      console.error("Error fetching filter options:", err);
      handleApiError(err);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setIsFiltering(true);
    
    // Reset all filters
    setPrintType("household");
    setMunicipality("all");
    setBarangay("all");
    setPurok("all");
    setHouseholdLimit("50");
    setSortBy("purok_lastname"); // Reset sorting preference
    
    // Small delay to show the filtering state
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  }, []);

  // Effect to resolve the printing Promise once isPrinting state changes
  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current();
    }
  }, [isPrinting]);

  // Print to PDF handler for both types
  const printToPDF = useReactToPrint({
    contentRef: printType === "household" ? householdPrintRef : 
                printType === "wardleader" ? wardLeaderPrintRef : 
                barangayCoordinatorPrintRef,
    onBeforePrint: () => {
      return new Promise<void>((resolve) => {
        promiseResolveRef.current = resolve;
      });
    },
    onAfterPrint: () => {
      promiseResolveRef.current = null;
      setIsPrinting(false);
      // Show confirmation dialog after printing completes
      setShowPrintConfirmDialog(true);
    },
    pageStyle: `
      @page {
        size: 8.5in 13in;
        margin: 0mm;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        height: 100%;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .print-page {
        page-break-after: always;
        padding: 0.5cm;
      }
    `,
    onPrintError: (errorLocation, error) => {
      console.error(`Print error at ${errorLocation}:`, error);
      setError(`Error printing: ${error.message}`);
      setIsPrinting(false);
    },
  });
  
  // Update data based on filters - used for preview and other parts of UI
  const updatePrintData = useCallback(async () => {
    try {
      setFetchingData(true);
      setError(null);
      
      // Create filter object with validated values
      const filterParams = {
        municipality: municipality !== "all" ? municipality : undefined,
        barangay: barangay !== "all" ? barangay : undefined,
        purok_st: purok !== "all" ? purok : undefined,
        limit: parseInt(householdLimit, 10),
        sortBy: sortBy // Add sorting parameter
      };
      

      
      if (printType === "household") {
        // Fetch real household data from the API
        const householdData = await getHouseholdDataForPrintingDirect(filterParams, { bypassCache: true });
        
        if (householdData.length === 0) {
          setError("No household data found with the selected filters");
          setFetchingData(false);
          return;
        }
        
        // Store the full array of household data
        setPrintHouseholdData(householdData);
        
        // Set the first household as the current print data
        setPrintData(householdData[0]);
        setCurrentItemIndex(0);
      } else if (printType === "wardleader") {
        // Fetch ward leader data from API
        const wardLeaderData = await getWardLeaderDataForPrinting(filterParams, { bypassCache: true });
        
        if (wardLeaderData.length === 0) {
          setError("No ward leader data found with the selected filters");
          setFetchingData(false);
          return;
        }
        
        // Store the full array of ward leader data
        setPrintWardLeaderData(wardLeaderData);
        setCurrentItemIndex(0);
      } else if (printType === "barangaycoordinator") {
        // Fetch barangay coordinator data from API
        const barangayCoordinatorData = await getBarangayCoordinatorDataForPrinting(filterParams, { bypassCache: true });
        
        if (barangayCoordinatorData.length === 0) {
          setError("No barangay coordinator data found with the selected filters");
          setFetchingData(false);
          return;
        }
        
        // Store data in state for future use and in the ref for immediate access
        setPrintBarangayCoordinatorData(barangayCoordinatorData);
        printBarangayCoordinatorDataRef.current = barangayCoordinatorData;
        setCurrentItemIndex(0);
      } else {
        // Handle other print types here (barangay coordinator)
        // For now, use placeholder data
        setPrintData({
          householdId: 0,
          householdNumber: "N/A",
          wardLeader: printType === "barangaycoordinator" ? "Barangay Coordinator Data" : "Unknown Data",
          members: [
            { name: "Feature coming soon", position: "", remarks: "" }
          ],
          receivedBy: {
            name: "",
            signature: "",
            position: "",
            timeSigned: ""
          }
        });
      }
    } catch (err: any) {
      console.error("Error updating print data:", err);
      setError(err.message || "Failed to fetch print data");
    } finally {
      setFetchingData(false);
    }
  }, [printType, municipality, barangay, purok, householdLimit, sortBy]);
  
  // Handle print for multiple items
  const handlePrint = useCallback(async () => {
    try {
      setError(null);
      setFetchingData(true);
      
      try {
        // Always fetch fresh data on print
        const filterParams = {
          municipality: municipality !== "all" ? municipality : undefined,
          barangay: barangay !== "all" ? barangay : undefined,
          purok_st: purok !== "all" ? purok : undefined,
          limit: parseInt(householdLimit, 10),
          sortBy: sortBy // Add sorting parameter
        };
        

        
        if (printType === "household") {

          // Get household data directly from the function result
          const fetchedData = await getHouseholdDataForPrintingDirect(filterParams, { bypassCache: true });
          
          // Log the total number of households to be printed
          console.log(`Total households to be printed: ${fetchedData?.length || 0}`);
          
          
          if (!fetchedData || fetchedData.length === 0) {
            setError("No household data found with the selected filters");
            setFetchingData(false);
            return;
          }
          
          // Store data in state for future use and in the ref for immediate access
          setPrintHouseholdData(fetchedData);
          printHouseholdDataRef.current = fetchedData;
          

          
          // Wait for state update to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          

          // Now trigger the print process
          setIsPrinting(true);
          printToPDF();
        } else if (printType === "wardleader") {

          // Get ward leader data directly from the function result
          const fetchedData = await getWardLeaderDataForPrinting(filterParams, { bypassCache: true });
          
          // Log the total number of ward leaders to be printed
          console.log(`Total ward leaders to be printed: ${fetchedData?.length || 0}`);
          
          
          if (!fetchedData || fetchedData.length === 0) {
            setError("No ward leader data found with the selected filters");
            setFetchingData(false);
            return;
          }
          
          // Store data in state for future use and in the ref for immediate access
          setPrintWardLeaderData(fetchedData);
          printWardLeaderDataRef.current = fetchedData;
          

          
          // Wait for state update to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          

          // Now trigger the print process
          setIsPrinting(true);
          printToPDF();
        } else if (printType === "barangaycoordinator") {

          // Get barangay coordinator data directly from the function result
          const fetchedData = await getBarangayCoordinatorDataForPrinting(filterParams, { bypassCache: true });
          
          // Log the total number of barangay coordinators to be printed
          console.log(`Total barangay coordinators to be printed: ${fetchedData?.length || 0}`);
          
          
          if (!fetchedData || fetchedData.length === 0) {
            setError("No barangay coordinator data found with the selected filters");
            setFetchingData(false);
            return;
          }
          
          // Store data in state for future use and in the ref for immediate access
          setPrintBarangayCoordinatorData(fetchedData);
          printBarangayCoordinatorDataRef.current = fetchedData;
          

          
          // Wait for state update to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          

          // Now trigger the print process
          setIsPrinting(true);
          printToPDF();
        } else {
          setError("This print type is not yet implemented");
          setFetchingData(false);
          return;
        }
      } catch (err: any) {
        console.error("Error fetching or printing data:", err);
        setError(err.message || "Failed to fetch or print data");
      } finally {
        setFetchingData(false);
      }
    } catch (err: any) {
      console.error("Error in print handler:", err);
      setError(err.message || "An error occurred during printing");
      setFetchingData(false);
      setIsPrinting(false);
    }
  }, [printType, municipality, barangay, purok, householdLimit, printToPDF, sortBy]);
  
  // Handle confirmation of successful printing
  const handlePrintConfirm = async () => {
    if (printType === "household" && printHouseholdData.length > 0) {
      try {
        setMarkingPrinted(true);
        
        // Extract household IDs from the printed data
        const householdIds = printHouseholdData.map(household => household.householdId);
        
        // Call API to mark these households as printed
        const result = await markHouseholdsAsPrinted(householdIds);
        
        // Show success notification
        toast.success(`Successfully marked ${result.updatedCount} households as printed`);
        
        // Close dialog and reset
        setShowPrintConfirmDialog(false);
        setMarkingPrinted(false);
      } catch (err: any) {
        console.error("Error marking households as printed:", err);
        toast.error("Failed to update printed status: " + (err.message || "Unknown error"));
        setMarkingPrinted(false);
      }
    } else if (printType === "wardleader" && printWardLeaderData.length > 0) {
      try {
        setMarkingPrinted(true);
        
        // Extract leader IDs from the printed data
        const leaderIds = printWardLeaderData.map(leader => leader.leaderId);
        
        // Call API to mark these ward leaders as printed
        const result = await markWardLeadersAsPrinted(leaderIds);
        
        // Show success notification
        toast.success(`Successfully marked ${result.updatedCount} ward leaders as printed`);
        
        // Close dialog and reset
        setShowPrintConfirmDialog(false);
        setMarkingPrinted(false);
      } catch (err: any) {
        console.error("Error marking ward leaders as printed:", err);
        toast.error("Failed to update printed status: " + (err.message || "Unknown error"));
        setMarkingPrinted(false);
      }
    } else if (printType === "barangaycoordinator" && printBarangayCoordinatorData.length > 0) {
      try {
        setMarkingPrinted(true);
        
        // Extract leader IDs from the printed data
        const leaderIds = printBarangayCoordinatorData.map(coordinator => coordinator.leaderId);
        
        // Call API to mark these barangay coordinators as printed
        const result = await markBarangayCoordinatorsAsPrinted(leaderIds);
        
        // Show success notification
        toast.success(`Successfully marked ${result?.updatedCount || leaderIds.length} barangay coordinators as printed`);
        
        // Close dialog and reset
        setShowPrintConfirmDialog(false);
        setMarkingPrinted(false);
      } catch (err: any) {
        console.error("Error marking barangay coordinators as printed:", err);
        toast.error("Failed to update printed status: " + (err.message || "Unknown error"));
        setMarkingPrinted(false);
      }
    } else {
      setShowPrintConfirmDialog(false);
    }
  };
  
  // Handle cancel/close of print confirmation
  const handlePrintCancel = () => {
    setShowPrintConfirmDialog(false);
  };
  
  // Initial fetch - Run only once on mount
  useEffect(() => {
    fetchFilterOptions();
    
    // Cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []); // Empty dependency array to run only once on mount
  
  // Render loading state for initial load
  if (loading && !isMountedRef.current) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary/60 mb-4" />
        <p className="text-muted-foreground">Loading filter options...</p>
      </div>
    );
  }
  
  // Render error state
  if (error && !isMountedRef.current) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p className="mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchFilterOptions}>
          <Loader2 className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden component that will be used for printing households */}
      <div style={{ display: "none" }}>

        <HouseholdPrintTemplate
          ref={householdPrintRef}
          households={printHouseholdDataRef.current}
          receivedBy={{
            name: "",
            signature: "",
            position: "",
            timeSigned: ""
          }}
        />
      </div>
      
      {/* Hidden component that will be used for printing ward leaders */}
      <div style={{ display: "none" }}>

        <WardLeaderPrintTemplate
          ref={wardLeaderPrintRef}
          wardLeaders={printWardLeaderDataRef.current}
          receivedBy={{
            name: "",
            signature: "",
            position: "",
            timeSigned: ""
          }}
        />
      </div>
      
      {/* Hidden component that will be used for printing barangay coordinators */}
      <div style={{ display: "none" }}>

        <BarangayCoordinatorPrintTemplate
          ref={barangayCoordinatorPrintRef}
          coordinators={printBarangayCoordinatorDataRef.current}
          receivedBy={{
            name: "",
            signature: "",
            position: "",
            timeSigned: ""
          }}
        />
      </div>
      
      {/* Print Confirmation Dialog */}
      <Dialog 
        open={showPrintConfirmDialog} 
        onOpenChange={(open) => {
          // Only allow closing through the buttons, not by clicking outside
          if (open === false) {
            // Don't allow closing via outside click
            return;
          }
          setShowPrintConfirmDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl">Did the print succeed?</DialogTitle>
            <DialogDescription className="text-muted-foreground py-2">
              Confirming will mark these {
                printType === "household" ? "households" : 
                printType === "wardleader" ? "ward leaders" : 
                "barangay coordinators"
              } as printed in the system.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="flex sm:flex-row gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl border-border/60"
              onClick={handlePrintCancel}
              disabled={markingPrinted}
            >
              <X className="mr-2 h-4 w-4" />
              No, Failed
            </Button>
            <Button 
              type="button"
              className="flex-1 rounded-xl"
              onClick={handlePrintConfirm}
              disabled={markingPrinted}
            >
              {markingPrinted ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Yes, Success
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight">Print</h1>
        <p className="text-muted-foreground mt-1">Print household data and voter lists</p>
      </div>
      
      <Card className="rounded-2xl shadow-sm border-border/40">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <CardTitle className="text-xl font-medium">Print Options</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="rounded-lg border-border/60"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reset Filters
            </Button>
          </div>
        </CardHeader>
        
        {/* Filters */}
        <CardContent className="pb-0">
          {isFiltering && (
            <div className="mb-4 p-2 border border-primary/10 bg-primary/5 rounded-lg">
              <p className="text-sm flex items-center">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                Updating filters...
              </p>
            </div>
          )}
        
          <div className="mb-6">
            <Label htmlFor="printType" className="mb-2 block">Print Type</Label>
            <Select
              value={printType}
              onValueChange={(value) => {
                setIsFiltering(true);
                setPrintType(value);
                // Reset all other filters when print type changes
                setMunicipality("all");
                setBarangay("all");
                setPurok("all");
                setHouseholdLimit("50");
                // Clear any previous errors
                setError(null);
                setTimeout(() => setIsFiltering(false), 300);
              }}
            >
              <SelectTrigger id="printType" className="w-full max-w-xs">
                <SelectValue placeholder="Select Print Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="household">Household Data</SelectItem>
                <SelectItem value="wardleader">Ward Leader Data</SelectItem>
                <SelectItem value="barangaycoordinator">Barangay Coordinator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="municipality">Municipality</Label>
              <Select
                value={municipality}
                onValueChange={(value) => {
                  setIsFiltering(true);
                  setMunicipality(value);
                  // If "all" is selected, reset barangay and purok
                  if (value === "all") {
                    setBarangay("all");
                    setPurok("all");
                  }
                  setTimeout(() => setIsFiltering(false), 300);
                }}
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
                value={barangay}
                onValueChange={(value) => {
                  setIsFiltering(true);
                  setBarangay(value);
                  // If "all" is selected, reset purok
                  if (value === "all") {
                    setPurok("all");
                  }
                  setTimeout(() => setIsFiltering(false), 300);
                }}
                disabled={municipality === "all"}
              >
                <SelectTrigger id="barangay" className="w-full">
                  <SelectValue placeholder={municipality === "all" ? "Select municipality first" : "Select Barangay"} />
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
              <Label htmlFor="purok">Purok</Label>
              <Select
                value={purok}
                onValueChange={(value) => {
                  setIsFiltering(true);
                  setPurok(value);
                  setTimeout(() => setIsFiltering(false), 300);
                }}
                disabled={barangay === "all" || filteredPuroks.length === 0}
              >
                <SelectTrigger id="purok" className="w-full">
                  <SelectValue placeholder="Select Purok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Puroks</SelectItem>
                  {filteredPuroks.map((p) => (
                    <SelectItem key={`${p.municipality}-${p.barangay}-${p.purok_st}`} value={p.purok_st}>
                      {p.purok_st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="householdLimit">
                {printType === "household" ? "Households" : printType === "wardleader" ? "Ward Leaders" : "Items"} to print
              </Label>
              <Input
                id="householdLimit"
                type="number"
                min="1"
                max="500"
                placeholder={`Maximum number of ${printType === "household" ? "households" : printType === "wardleader" ? "ward leaders" : "items"}`}
                value={householdLimit}
                onChange={(e) => {
                  setIsFiltering(true);
                  setHouseholdLimit(e.target.value);
                  setTimeout(() => setIsFiltering(false), 300);
                }}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Sorting dropdown - only show for household printing */}
          {printType === "household" && (
            <div className="mb-6">
              <Label htmlFor="sortBy" className="mb-2 block">Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setIsFiltering(true);
                  setSortBy(value);
                  setTimeout(() => setIsFiltering(false), 300);
                }}
              >
                <SelectTrigger id="sortBy" className="w-full max-w-xs">
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purok_lastname">Purok then Lastname</SelectItem>
                  <SelectItem value="lastname_purok">Lastname then Purok</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Big Print Button */}
          <div className="flex justify-center mb-6">
            <Button 
              onClick={() => handlePrint()}
              size="lg" 
              className="w-full max-w-md h-16 text-lg rounded-xl shadow-md"
              disabled={isPrinting || fetchingData}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Printing...
                </>
              ) : fetchingData ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Fetching data...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-5 w-5" />
                  Print {printType === "household" ? "Household" : printType === "wardleader" ? "Ward Leader" : "Barangay Coordinator"} Data
                </>
              )}
            </Button>
          </div>
          
          {/* Error message if any */}
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <p>{error}</p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground mb-4">
            <p className="mb-2">This will print with the selected filters:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Print type: <span className="font-medium">
                  {printType === "household" ? "Household Data" : 
                   printType === "wardleader" ? "Ward Leader Data" : 
                   "Barangay Coordinator Data"}
                </span>
              </li>
              <li>
                Municipality: <span className="font-medium">{municipality === "all" ? "All" : municipality}</span>
              </li>
              <li>
                Barangay: <span className="font-medium">{barangay === "all" ? "All" : barangay}</span>
              </li>
              <li>
                Purok: <span className="font-medium">{purok === "all" ? "All" : purok}</span>
              </li>
              <li>
                Maximum {printType === "household" ? "households" : printType === "wardleader" ? "ward leaders" : "items"}: <span className="font-medium">{householdLimit}</span>
              </li>
              {printType === "household" && (
                <li>
                  Sort by: <span className="font-medium">{sortBy === "purok_lastname" ? "Purok then Lastname" : "Lastname then Purok"}</span>
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 