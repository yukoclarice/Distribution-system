# Data Table System with Pagination

This document explains how to use the DataTable component system with the pagination hook for efficient table rendering with lazy loading.

## Overview

The system consists of:

1. **usePagination Hook** - Handles data fetching, pagination, and infinite scrolling
2. **DataTable Component** - Flexible, reusable table component with pagination support
3. **API Patterns** - Standard structure for paginated API endpoints

## Quick Start

Here's a minimal example of using the DataTable component:

```tsx
import { DataTable, Column } from "@/components/ui/data-table";
import { getItemsPaginated } from "@/lib/api";

interface Item {
  id: number;
  name: string;
  // ... other properties
}

export function ItemsTable() {
  const columns: Column<Item>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    // Add more columns as needed
  ];

  return (
    <DataTable<Item>
      columns={columns}
      fetchData={getItemsPaginated}
      keyField="id"
    />
  );
}
```

## How to Create a New Table

### 1. Define Data Types

Define the type for your table data:

```tsx
interface Item {
  id: number;
  name: string;
  description: string;
  // Add all properties needed for your table
}
```

### 2. Create the API Function

Add a paginated API function in `api.ts` or a dedicated file:

```tsx
// In api.ts or a dedicated file
export async function getItemsPaginated(
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedResponse<Item>> {
  try {
    // Client-side pagination until backend supports it
    const response = await apiClient.get('/items');
    const allData: Item[] = response.data;
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedData = allData.slice(startIndex, endIndex);
    const total = allData.length;
    const hasMore = endIndex < total;
    
    return {
      data: paginatedData,
      total,
      page,
      limit,
      hasMore
    };
    
    // When backend supports pagination:
    // const response = await apiClient.get('/items/paginated', {
    //   params: { page, limit }
    // });
    // return response.data;
  } catch (error) {
    console.error('Error fetching paginated items:', error);
    throw handleApiError(error, 'Failed to fetch items');
  }
}
```

### 3. Define Columns

Define the columns configuration for your table:

```tsx
const columns: Column<Item>[] = [
  {
    header: "Name",
    accessorKey: "name",
    // Optional custom cell renderer
    cell: (item) => <div className="font-medium">{item.name}</div>
  },
  {
    header: "Description",
    accessorKey: "description",
    // Responsive visibility (only show on larger screens)
    show: (width) => width >= 768
  },
  // Add more columns as needed
];
```

### 4. Create and Use Your Table Component

```tsx
export function ItemsTable() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Items</h2>
      
      <DataTable<Item>
        columns={columns}
        fetchData={getItemsPaginated}
        itemsPerPage={10}
        showRefresh={true}
        keyField="id"
        onRowClick={(item) => console.log('Item clicked:', item)}
        className="rounded-xl shadow-sm"
      />
    </div>
  );
}
```

## Advanced Usage

### Responsive Columns

The DataTable component supports responsive columns that show/hide based on screen width:

```tsx
{
  header: "Status",
  accessorKey: "status",
  // Only show on screens >= 640px (sm breakpoint)
  show: (width) => width >= 640
}
```

### Custom Cell Renderers

Use custom cell renderers for rich cell content:

```tsx
{
  header: "Status",
  accessorKey: "status",
  cell: (item) => {
    const statusColors = {
      active: "text-green-600 bg-green-100",
      pending: "text-amber-600 bg-amber-100",
      inactive: "text-red-600 bg-red-100"
    };
    
    return (
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
        {item.status}
      </div>
    );
  }
}
```

### Deep Property Access

Access nested properties using dot notation:

```tsx
{
  header: "Category",
  accessorKey: "category.name"
}
```

### Custom Row Styling

Apply custom styles to rows:

```tsx
<DataTable<Item>
  columns={columns}
  fetchData={getItemsPaginated}
  keyField="id"
  rowClassName={(item, index) => 
    item.status === 'critical' ? 'bg-red-50' : ''
  }
/>
```

### Manual Pagination Control

For more control, use the `usePagination` hook directly:

```tsx
function CustomTable() {
  const {
    items,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    observerTarget,
    loadMoreItems,
    refreshItems,
    resetItems
  } = usePagination({
    fetchFunction: getItemsPaginated,
    itemsPerPage: 20
  });

  // Custom table implementation...
}
```

## DataTable Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `columns` | `Column<T>[]` | Column definitions | Required |
| `fetchData` | `Function` | Data fetching function | Required |
| `itemsPerPage` | `number` | Items per page | `10` |
| `showRefresh` | `boolean` | Show refresh button | `false` |
| `emptyMessage` | `string` | Message when no data | `"No items found."` |
| `loadingMessage` | `string` | Loading message | `"Loading data..."` |
| `errorMessage` | `string` | Error prefix | `"Error:"` |
| `keyField` | `keyof T` | Unique ID field | Required |
| `className` | `string` | Container class | `""` |
| `dependencyArray` | `any[]` | Additional dependencies | `[]` |
| `rowClassName` | `string \| Function` | Row class | `""` |
| `onRowClick` | `Function` | Row click handler | `undefined` |

## API Response Structure

Ensure your API returns data in this format:

```typescript
interface PaginatedResponse<T> {
  data: T[];        // The current page of items
  total: number;    // Total count of all items
  page: number;     // Current page number
  limit: number;    // Items per page
  hasMore: boolean; // Whether more pages exist
}
``` 