import { useState, useCallback, useEffect, useRef, RefObject } from "react";
import { PaginatedResponse } from "@/lib/api";

interface UsePaginationProps<T> {
  fetchFunction: (page: number, limit: number) => Promise<PaginatedResponse<T>>;
  itemsPerPage?: number;
  initialFetch?: boolean;
  dependencyArray?: any[];
}

interface UsePaginationReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  page: number;
  observerTarget: RefObject<HTMLDivElement | null>;
  loadMoreItems: () => Promise<void>;
  refreshItems: () => Promise<void>;
  resetItems: () => void;
}

export function usePagination<T>({
  fetchFunction,
  itemsPerPage = 10,
  initialFetch = true,
  dependencyArray = []
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Ref for intersection observer target element
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Observer for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Reset all state
  const resetItems = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setTotalCount(0);
    setError(null);
  }, []);

  // Initial fetch
  const fetchInitialItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPage(1);
      
      const response = await fetchFunction(1, itemsPerPage);
      setItems(response.data);
      setHasMore(response.hasMore);
      setTotalCount(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, itemsPerPage]);
  
  // Load more
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      const response = await fetchFunction(nextPage, itemsPerPage);
      setItems(prev => [...prev, ...response.data]);
      setHasMore(response.hasMore);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading more items:', err);
      // Don't set error state here to avoid disrupting the current view
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchFunction, page, isLoadingMore, hasMore, isLoading, itemsPerPage]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    // Create a new IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadMoreItems();
        }
      },
      { threshold: 0.5 } // Trigger when element is 50% visible
    );
    
    observerRef.current = observer;
    
    return () => {
      // Clean up the observer when component unmounts
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, loadMoreItems]);
  
  // Attach observer to the target element
  useEffect(() => {
    if (observerTarget.current && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current.observe(observerTarget.current);
    }
  }, [items]);
  
  // Initial load, if enabled
  useEffect(() => {
    if (initialFetch) {
      fetchInitialItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchInitialItems, ...dependencyArray]);

  return {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    page,
    observerTarget,
    loadMoreItems,
    refreshItems: fetchInitialItems,
    resetItems
  };
} 