"use client"

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  TableData,
  ColumnDef,
  TableState,
  TableInstance,
  UseTableReturn,
  SortConfig,
  SortDirection,
  FilterConfig,
  FilterOperator,
  GlobalSearchConfig,
  PaginationConfig,
  SelectionConfig,
  TableViewMode,
  ExportFormat,
  ExportConfig,
} from '@/types/table';

interface UseTableOptions<T extends TableData> {
  data: T[];
  columns: ColumnDef<T>[];
  initialSorting?: SortConfig[];
  initialFilters?: FilterConfig[];
  initialGlobalSearch?: string;
  initialViewMode?: TableViewMode;
  pagination?: Partial<PaginationConfig>;
  selection?: Partial<SelectionConfig<T>>;
  serverSide?: boolean;
  onDataChange?: (data: T[]) => void;
  onStateChange?: (state: TableState<T>) => void;
}

/**
 * Comprehensive table hook that manages all table state and operations
 * - Sorting (single and multi-column)
 * - Filtering (column and global search)
 * - Pagination (client-side and server-side)
 * - Selection (single and multi-row)
 * - View modes (table, cards, list, compact)
 * - Export functionality
 * - Column management (show/hide, reorder, resize)
 */
export function useTable<T extends TableData>({
  data = [],
  columns = [],
  initialSorting = [],
  initialFilters = [],
  initialGlobalSearch = '',
  initialViewMode = 'table',
  pagination: paginationConfig = {},
  selection: selectionConfig = {},
  serverSide = false,
  onDataChange,
  onStateChange,
}: UseTableOptions<T>): UseTableReturn<T> {
  
  // =============================================================================
  // Initial State
  // =============================================================================
  
  const [state, setState] = useState<TableState<T>>(() => ({
    data: [...data],
    originalData: [...data],
    columns: [...columns],
    visibleColumns: columns.filter(col => !col.hidden),
    sorting: [...initialSorting],
    filters: [...initialFilters],
    globalSearch: {
      query: initialGlobalSearch,
      columns: [],
      caseSensitive: false,
      useRegex: false,
      minQueryLength: 1,
      debounceMs: 300,
    },
    pagination: {
      page: 0,
      pageSize: 10,
      totalItems: data.length,
      totalPages: Math.ceil(data.length / 10),
      hasNextPage: data.length > 10,
      hasPreviousPage: false,
      pageSizeOptions: [10, 25, 50, 100],
      serverSide: false,
      ...paginationConfig,
    },
    selection: {
      mode: 'none',
      selectedRowIds: new Set(),
      selectAll: false,
      preserveSelectionAcrossPages: false,
      ...selectionConfig,
    },
    viewMode: initialViewMode,
    loading: false,
    error: undefined,
    isEditing: false,
    editingCell: undefined,
  }));

  // =============================================================================
  // Data Processing
  // =============================================================================
  
  // Apply global search
  const searchFilteredData = useMemo(() => {
    if (!state.globalSearch.query || state.globalSearch.query.length < state.globalSearch.minQueryLength) {
      return state.data;
    }

    const query = state.globalSearch.caseSensitive 
      ? state.globalSearch.query 
      : state.globalSearch.query.toLowerCase();

    const searchColumns = state.globalSearch.columns.length > 0
      ? state.globalSearch.columns
      : state.visibleColumns
          .filter(col => col.filterable !== false && col.dataType !== 'actions')
          .map(col => col.id);

    return state.data.filter(row => {
      return searchColumns.some(columnId => {
        const column = state.columns.find(col => col.id === columnId);
        if (!column) return false;

        const value = typeof column.accessor === 'function'
          ? column.accessor(row)
          : row[column.accessor as keyof T];

        const searchValue = state.globalSearch.caseSensitive 
          ? String(value || '') 
          : String(value || '').toLowerCase();

        if (state.globalSearch.useRegex) {
          try {
            const regex = new RegExp(query, state.globalSearch.caseSensitive ? 'g' : 'gi');
            return regex.test(searchValue);
          } catch {
            return false;
          }
        }

        return searchValue.includes(query);
      });
    });
  }, [state.data, state.globalSearch, state.visibleColumns, state.columns]);

  // Apply column filters
  const columnFilteredData = useMemo(() => {
    if (state.filters.length === 0) {
      return searchFilteredData;
    }

    return searchFilteredData.filter(row => {
      return state.filters.every(filter => {
        if (!filter.enabled) return true;

        const column = state.columns.find(col => col.id === filter.columnId);
        if (!column) return true;

        const value = typeof column.accessor === 'function'
          ? column.accessor(row)
          : row[column.accessor as keyof T];

        return applyFilter(value, filter.operator, filter.value);
      });
    });
  }, [searchFilteredData, state.filters, state.columns]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (state.sorting.length === 0) {
      return columnFilteredData;
    }

    return [...columnFilteredData].sort((a, b) => {
      for (const sort of state.sorting) {
        const column = state.columns.find(col => col.id === sort.columnId);
        if (!column) continue;

        let result = 0;

        if (column.sortFn) {
          result = column.sortFn(a, b, sort.direction);
        } else {
          const aValue = typeof column.accessor === 'function'
            ? column.accessor(a)
            : a[column.accessor as keyof T];
          const bValue = typeof column.accessor === 'function'
            ? column.accessor(b)
            : b[column.accessor as keyof T];

          result = compareValues(aValue, bValue, column.dataType);
        }

        if (result !== 0) {
          return sort.direction === 'asc' ? result : -result;
        }
      }
      return 0;
    });
  }, [columnFilteredData, state.sorting, state.columns]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (serverSide) {
      return sortedData; // Server handles pagination
    }

    const startIndex = state.pagination.page * state.pagination.pageSize;
    const endIndex = startIndex + state.pagination.pageSize;
    
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, state.pagination.page, state.pagination.pageSize, serverSide]);

  // Update pagination info when data changes
  useEffect(() => {
    if (!serverSide) {
      const totalItems = sortedData.length;
      const totalPages = Math.ceil(totalItems / state.pagination.pageSize);
      const currentPage = Math.min(state.pagination.page, Math.max(0, totalPages - 1));

      setState(prev => ({
        ...prev,
        pagination: {
          ...prev.pagination,
          page: currentPage,
          totalItems,
          totalPages,
          hasNextPage: currentPage < totalPages - 1,
          hasPreviousPage: currentPage > 0,
        },
      }));
    }
  }, [sortedData.length, state.pagination.pageSize, serverSide]);

  // =============================================================================
  // Data Methods
  // =============================================================================
  
  const setData = useCallback((newData: T[]) => {
    setState(prev => ({
      ...prev,
      data: [...newData],
      originalData: [...newData],
    }));
  }, []);

  const addRow = useCallback((row: T, index?: number) => {
    setState(prev => {
      const newData = [...prev.data];
      if (typeof index === 'number' && index >= 0 && index <= newData.length) {
        newData.splice(index, 0, row);
      } else {
        newData.push(row);
      }
      return {
        ...prev,
        data: newData,
      };
    });
  }, []);

  const updateRow = useCallback((rowId: string, updates: Partial<T>) => {
    setState(prev => ({
      ...prev,
      data: prev.data.map(row => 
        row.id === rowId ? { ...row, ...updates } : row
      ),
    }));
  }, []);

  const deleteRow = useCallback((rowId: string) => {
    setState(prev => ({
      ...prev,
      data: prev.data.filter(row => row.id !== rowId),
      selection: {
        ...prev.selection,
        selectedRowIds: new Set(
          Array.from(prev.selection.selectedRowIds).filter(id => id !== rowId)
        ),
      },
    }));
  }, []);

  const getRow = useCallback((rowId: string) => {
    return state.data.find(row => row.id === rowId);
  }, [state.data]);

  // =============================================================================
  // Column Methods
  // =============================================================================
  
  const setColumns = useCallback((newColumns: ColumnDef<T>[]) => {
    setState(prev => ({
      ...prev,
      columns: [...newColumns],
      visibleColumns: newColumns.filter(col => !col.hidden),
    }));
  }, []);

  const toggleColumn = useCallback((columnId: string, visible?: boolean) => {
    setState(prev => {
      const newColumns = prev.columns.map(col => 
        col.id === columnId 
          ? { ...col, hidden: visible !== undefined ? !visible : !col.hidden }
          : col
      );
      return {
        ...prev,
        columns: newColumns,
        visibleColumns: newColumns.filter(col => !col.hidden),
      };
    });
  }, []);

  const reorderColumns = useCallback((columnIds: string[]) => {
    setState(prev => {
      const columnMap = new Map(prev.columns.map(col => [col.id, col]));
      const newColumns = columnIds
        .map(id => columnMap.get(id))
        .filter((col): col is ColumnDef<T> => col !== undefined);
      
      return {
        ...prev,
        columns: newColumns,
        visibleColumns: newColumns.filter(col => !col.hidden),
      };
    });
  }, []);

  const resizeColumn = useCallback((columnId: string, width: number) => {
    setState(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === columnId ? { ...col, width } : col
      ),
    }));
  }, []);

  // =============================================================================
  // Sorting Methods
  // =============================================================================
  
  const sortBy = useCallback((columnId: string, direction?: SortDirection) => {
    setState(prev => {
      const existingSort = prev.sorting.find(sort => sort.columnId === columnId);
      const newDirection = direction || (existingSort?.direction === 'asc' ? 'desc' : 'asc');

      return {
        ...prev,
        sorting: [{ columnId, direction: newDirection }],
      };
    });
  }, []);

  const addSort = useCallback((columnId: string, direction: SortDirection) => {
    setState(prev => {
      const existingSortIndex = prev.sorting.findIndex(sort => sort.columnId === columnId);
      const newSorting = [...prev.sorting];
      
      if (existingSortIndex >= 0) {
        newSorting[existingSortIndex] = { columnId, direction };
      } else {
        newSorting.push({ columnId, direction });
      }

      return {
        ...prev,
        sorting: newSorting,
      };
    });
  }, []);

  const removeSort = useCallback((columnId: string) => {
    setState(prev => ({
      ...prev,
      sorting: prev.sorting.filter(sort => sort.columnId !== columnId),
    }));
  }, []);

  const clearSorting = useCallback(() => {
    setState(prev => ({
      ...prev,
      sorting: [],
    }));
  }, []);

  const getColumnSort = useCallback((columnId: string) => {
    return state.sorting.find(sort => sort.columnId === columnId);
  }, [state.sorting]);

  const isColumnSorted = useCallback((columnId: string) => {
    return state.sorting.some(sort => sort.columnId === columnId);
  }, [state.sorting]);

  // =============================================================================
  // Filtering Methods
  // =============================================================================
  
  const setFilter = useCallback((columnId: string, operator: FilterOperator, value: any) => {
    setState(prev => {
      const existingFilterIndex = prev.filters.findIndex(filter => filter.columnId === columnId);
      const newFilters = [...prev.filters];
      
      const newFilter: FilterConfig = {
        columnId,
        operator,
        value,
        enabled: true,
      };

      if (existingFilterIndex >= 0) {
        newFilters[existingFilterIndex] = newFilter;
      } else {
        newFilters.push(newFilter);
      }

      return {
        ...prev,
        filters: newFilters,
      };
    });
  }, []);

  const removeFilter = useCallback((columnId: string) => {
    setState(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.columnId !== columnId),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: [],
    }));
  }, []);

  const setGlobalSearch = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      globalSearch: {
        ...prev.globalSearch,
        query,
      },
      pagination: {
        ...prev.pagination,
        page: 0, // Reset to first page when searching
      },
    }));
  }, []);

  const clearGlobalSearch = useCallback(() => {
    setState(prev => ({
      ...prev,
      globalSearch: {
        ...prev.globalSearch,
        query: '',
      },
    }));
  }, []);

  const getColumnFilter = useCallback((columnId: string) => {
    return state.filters.find(filter => filter.columnId === columnId);
  }, [state.filters]);

  // =============================================================================
  // Pagination Methods
  // =============================================================================
  
  const goToPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: Math.max(0, Math.min(page, (prev.pagination.totalPages || 1) - 1)),
      },
    }));
  }, []);

  const goToFirstPage = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: Math.max(0, (prev.pagination.totalPages || 1) - 1),
      },
    }));
  }, []);

  const goToNextPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: Math.min(prev.pagination.page + 1, (prev.pagination.totalPages || 1) - 1),
      },
    }));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setState(prev => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        page: Math.max(0, prev.pagination.page - 1),
      },
    }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setState(prev => {
      const currentFirstItemIndex = prev.pagination.page * prev.pagination.pageSize;
      const newPage = Math.floor(currentFirstItemIndex / pageSize);
      
      return {
        ...prev,
        pagination: {
          ...prev.pagination,
          pageSize,
          page: newPage,
        },
      };
    });
  }, []);

  // =============================================================================
  // Selection Methods
  // =============================================================================
  
  const selectRow = useCallback((rowId: string, selected = true) => {
    setState(prev => {
      const newSelectedRowIds = new Set(prev.selection.selectedRowIds);
      
      if (selected) {
        if (prev.selection.mode === 'single') {
          newSelectedRowIds.clear();
        }
        newSelectedRowIds.add(rowId);
      } else {
        newSelectedRowIds.delete(rowId);
      }

      const selectAll = newSelectedRowIds.size === sortedData.length ? true : 
                       newSelectedRowIds.size === 0 ? false : 'indeterminate';

      return {
        ...prev,
        selection: {
          ...prev.selection,
          selectedRowIds: newSelectedRowIds,
          selectAll,
        },
      };
    });
  }, [sortedData.length]);

  const selectRows = useCallback((rowIds: string[], selected = true) => {
    setState(prev => {
      const newSelectedRowIds = new Set(prev.selection.selectedRowIds);
      
      rowIds.forEach(rowId => {
        if (selected) {
          newSelectedRowIds.add(rowId);
        } else {
          newSelectedRowIds.delete(rowId);
        }
      });

      const selectAll = newSelectedRowIds.size === sortedData.length ? true : 
                       newSelectedRowIds.size === 0 ? false : 'indeterminate';

      return {
        ...prev,
        selection: {
          ...prev.selection,
          selectedRowIds: newSelectedRowIds,
          selectAll,
        },
      };
    });
  }, [sortedData.length]);

  const selectAllRows = useCallback((selected = true) => {
    setState(prev => {
      const availableRowIds = sortedData.map(row => row.id);
      const newSelectedRowIds = selected ? new Set(availableRowIds) : new Set<string>();

      return {
        ...prev,
        selection: {
          ...prev.selection,
          selectedRowIds: newSelectedRowIds,
          selectAll: selected,
        },
      };
    });
  }, [sortedData]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selection: {
        ...prev.selection,
        selectedRowIds: new Set(),
        selectAll: false,
      },
    }));
  }, []);

  const getSelectedRows = useCallback(() => {
    return state.data.filter(row => state.selection.selectedRowIds.has(row.id));
  }, [state.data, state.selection.selectedRowIds]);

  const isRowSelected = useCallback((rowId: string) => {
    return state.selection.selectedRowIds.has(rowId);
  }, [state.selection.selectedRowIds]);

  const isRowSelectable = useCallback((row: T) => {
    return state.selection.isRowSelectable ? state.selection.isRowSelectable(row) : true;
  }, [state.selection.isRowSelectable]);

  // =============================================================================
  // View Methods
  // =============================================================================
  
  const setViewMode = useCallback((mode: TableViewMode) => {
    setState(prev => ({
      ...prev,
      viewMode: mode,
    }));
  }, []);

  // =============================================================================
  // Export Methods
  // =============================================================================
  
  const exportData = useCallback((format: ExportFormat, config?: Partial<ExportConfig<T>>) => {
    const exportConfig: ExportConfig<T> = {
      formats: [format],
      filename: `table-export-${new Date().toISOString().split('T')[0]}`,
      columns: state.visibleColumns.map(col => col.id),
      selectedRowsOnly: false,
      exportAllData: true,
      ...config,
    };

    const dataToExport = exportConfig.selectedRowsOnly 
      ? getSelectedRows()
      : exportConfig.exportAllData 
        ? sortedData 
        : paginatedData;

    const columnsToExport = state.visibleColumns.filter(col => 
      exportConfig.columns?.includes(col.id) ?? true
    );

    const transformedData = exportConfig.transformData 
      ? exportConfig.transformData(dataToExport)
      : dataToExport.map(row => {
          const exportRow: any = {};
          columnsToExport.forEach(col => {
            const value = typeof col.accessor === 'function'
              ? col.accessor(row)
              : row[col.accessor as keyof T];
            exportRow[col.header as string] = value;
          });
          return exportRow;
        });

    switch (format) {
      case 'csv':
        exportToCSV(transformedData, exportConfig.filename, exportConfig.csvOptions);
        break;
      case 'json':
        exportToJSON(transformedData, exportConfig.filename);
        break;
      case 'xlsx':
        // TODO: Implement XLSX export
        console.log('XLSX export not implemented yet');
        break;
      case 'pdf':
        // TODO: Implement PDF export
        console.log('PDF export not implemented yet');
        break;
    }
  }, [state.visibleColumns, getSelectedRows, sortedData, paginatedData]);

  // =============================================================================
  // Utility Methods
  // =============================================================================
  
  const refresh = useCallback(() => {
    // Trigger data refresh - this would typically refetch from server
    setState(prev => ({ ...prev, loading: true }));
    // In a real implementation, this would make an API call
    setTimeout(() => {
      setState(prev => ({ ...prev, loading: false }));
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      sorting: [],
      filters: [],
      globalSearch: {
        ...prev.globalSearch,
        query: '',
      },
      pagination: {
        ...prev.pagination,
        page: 0,
      },
      selection: {
        ...prev.selection,
        selectedRowIds: new Set(),
        selectAll: false,
      },
    }));
  }, []);

  const getFilteredData = useCallback(() => {
    return columnFilteredData;
  }, [columnFilteredData]);

  const getSortedData = useCallback(() => {
    return sortedData;
  }, [sortedData]);

  const getPaginatedData = useCallback(() => {
    return paginatedData;
  }, [paginatedData]);

  // =============================================================================
  // Table Instance
  // =============================================================================
  
  const tableInstance: TableInstance<T> = {
    state,
    setState: (updater) => {
      if (typeof updater === 'function') {
        setState(prev => ({ ...prev, ...updater(prev) }));
      } else {
        setState(prev => ({ ...prev, ...updater }));
      }
    },
    setData,
    addRow,
    updateRow,
    deleteRow,
    getRow,
    setColumns,
    toggleColumn,
    reorderColumns,
    resizeColumn,
    sortBy,
    addSort,
    removeSort,
    clearSorting,
    setFilter,
    removeFilter,
    clearFilters,
    setGlobalSearch,
    clearGlobalSearch,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    selectRow,
    selectRows,
    selectAllRows,
    clearSelection,
    getSelectedRows,
    isRowSelected,
    isRowSelectable,
    setViewMode,
    exportData,
    refresh,
    reset,
    getFilteredData,
    getSortedData,
    getPaginatedData,
  };

  // Call state change handler
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Call data change handler
  useEffect(() => {
    if (onDataChange) {
      onDataChange(state.data);
    }
  }, [state.data, onDataChange]);

  return {
    table: tableInstance,
    processedData: sortedData,
    pageData: paginatedData,
    state,
    loading: state.loading,
    error: state.error,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function applyFilter(value: any, operator: FilterOperator, filterValue: any): boolean {
  const strValue = String(value || '').toLowerCase();
  const strFilterValue = String(filterValue || '').toLowerCase();

  switch (operator) {
    case 'equals':
      return value === filterValue;
    case 'contains':
      return strValue.includes(strFilterValue);
    case 'startsWith':
      return strValue.startsWith(strFilterValue);
    case 'endsWith':
      return strValue.endsWith(strFilterValue);
    case 'greaterThan':
      return Number(value) > Number(filterValue);
    case 'lessThan':
      return Number(value) < Number(filterValue);
    case 'greaterThanOrEqual':
      return Number(value) >= Number(filterValue);
    case 'lessThanOrEqual':
      return Number(value) <= Number(filterValue);
    case 'between':
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const numValue = Number(value);
        return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
      }
      return false;
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    case 'notIn':
      return Array.isArray(filterValue) && !filterValue.includes(value);
    case 'isEmpty':
      return !value || value === '';
    case 'isNotEmpty':
      return value && value !== '';
    default:
      return true;
  }
}

function compareValues(a: any, b: any, dataType?: string): number {
  // Handle null/undefined values
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  switch (dataType) {
    case 'number':
    case 'currency':
    case 'percentage':
      return Number(a) - Number(b);
    
    case 'date':
    case 'datetime':
      return new Date(a).getTime() - new Date(b).getTime();
    
    case 'boolean':
      return Number(a) - Number(b);
    
    default:
      return String(a).localeCompare(String(b));
  }
}

function exportToCSV(data: any[], filename: string, options?: { delimiter?: string; includeHeaders?: boolean }) {
  const delimiter = options?.delimiter || ',';
  const includeHeaders = options?.includeHeaders ?? true;

  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    ...(includeHeaders ? [headers.join(delimiter)] : []),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        const stringValue = String(value || '');
        // Escape quotes and wrap in quotes if contains delimiter or quotes
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(delimiter)
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}