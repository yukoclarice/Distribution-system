import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import { PaginatedResponse } from "@/lib/api";

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  show?: boolean | ((windowWidth: number) => boolean);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  fetchData: (page: number, limit: number) => Promise<PaginatedResponse<T>>;
  itemsPerPage?: number;
  showRefresh?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  keyField: keyof T;
  className?: string;
  dependencyArray?: any[];
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  columns,
  fetchData,
  itemsPerPage = 10,
  showRefresh = false,
  emptyMessage = "No items found.",
  loadingMessage = "Loading data...",
  errorMessage = "Error:",
  keyField,
  className = "",
  dependencyArray = [],
  rowClassName = "",
  onRowClick
}: DataTableProps<T>) {
  // Track window width for responsive columns
  const [windowWidth, setWindowWidth] = React.useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Use the pagination hook for data fetching and state management
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    observerTarget,
    refreshItems,
  } = usePagination({
    fetchFunction: fetchData,
    itemsPerPage,
    dependencyArray
  });

  // Handle refresh click
  const handleRefresh = () => {
    refreshItems();
  };

  // Filter columns based on responsive visibility
  const visibleColumns = columns.filter(column => {
    if (column.show === undefined) return true;
    return typeof column.show === "function" 
      ? column.show(windowWidth) 
      : column.show;
  });

  // Render cell content based on configuration
  const renderCell = (item: T, column: Column<T>) => {
    // Use custom cell renderer if provided
    if (column.cell) {
      return column.cell(item);
    }
    
    // Otherwise, access the data using the accessor key
    const key = column.accessorKey;
    if (typeof key === "string") {
      // Handle nested properties with dot notation
      if (key.includes(".")) {
        const keys = key.split(".");
        let value: any = item;
        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }
        return value ?? "N/A";
      }
      
      // Direct property access
      return (item as any)[key] ?? "N/A";
    }
    
    return (item as any)[key] ?? "N/A";
  };

  // Generate row className
  const getRowClassName = (item: T, index: number): string => {
    return typeof rowClassName === "function"
      ? rowClassName(item, index)
      : rowClassName;
  };

  return (
    <div className={`w-full ${className}`}>
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
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </>
            )}
          </Button>
        </div>
      )}

      {error && (
        <div className="w-full p-4 mb-5 mx-6 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-sm">
          {errorMessage} {error}
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
              {visibleColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className={`px-4 py-3.5 text-xs font-medium text-foreground/70 ${column.className || ""}`}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary/60 mb-3" />
                    <p className="text-sm text-muted-foreground">{loadingMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumns.length}
                  className="h-32 text-center"
                >
                  <p className="text-muted-foreground">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {items.map((item, index) => {
                  // Get unique key for the row
                  const key = String(item[keyField]);
                  const rowClass = getRowClassName(item, index);
                  
                  return (
                    <TableRow
                      key={key}
                      className={`border-0 hover:bg-secondary/40 transition-colors ${rowClass} ${
                        onRowClick ? "cursor-pointer" : ""
                      }`}
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                    >
                      {visibleColumns.map((column, colIndex) => (
                        <TableCell
                          key={`${key}-${colIndex}`}
                          className={`px-4 border-b border-border/20 ${column.className || ""}`}
                        >
                          {renderCell(item, column)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}

                {/* Loading indicator for pagination */}
                {isLoadingMore && (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="h-20 text-center border-0"
                    >
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin text-primary/60 mr-2" />
                        <p className="text-sm text-muted-foreground">
                          Loading more items...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Status info */}
                {!isLoadingMore && !hasMore && items.length > 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={visibleColumns.length}
                      className="h-16 text-center text-xs text-muted-foreground border-0"
                    >
                      Showing all {items.length} of {totalCount} items
                    </TableCell>
                  </TableRow>
                )}

                {/* Invisible element for intersection observer */}
                <TableRow className="h-1 p-0 border-0">
                  <TableCell
                    colSpan={visibleColumns.length}
                    className="h-1 p-0 border-0"
                  >
                    <div ref={observerTarget} className="h-1 w-full" />
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 