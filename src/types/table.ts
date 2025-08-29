/**
 * Comprehensive TypeScript interfaces for BaseTable component
 * Supporting advanced table features with ADHD-friendly design patterns
 */

import { ReactNode, CSSProperties, MouseEvent, KeyboardEvent } from 'react';

// =============================================================================
// Core Table Types
// =============================================================================

/**
 * Generic table data type with required id field
 */
export interface TableData extends Record<string, any> {
  id: string;
}

/**
 * Column data types for proper rendering and sorting
 */
export type ColumnDataType = 
  | 'string' 
  | 'number' 
  | 'date' 
  | 'datetime'
  | 'boolean' 
  | 'currency'
  | 'percentage'
  | 'badge'
  | 'progress'
  | 'actions'
  | 'custom';

/**
 * Column alignment options
 */
export type ColumnAlignment = 'left' | 'center' | 'right';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Filter operators for column filtering
 */
export type FilterOperator = 
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

/**
 * Selection mode for table rows
 */
export type SelectionMode = 'none' | 'single' | 'multiple';

/**
 * Table view modes for responsive design
 */
export type TableViewMode = 'table' | 'cards' | 'list' | 'compact';

/**
 * Export formats
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx' | 'pdf';

// =============================================================================
// Column Definition
// =============================================================================

/**
 * Column definition interface with comprehensive configuration options
 */
export interface ColumnDef<T extends TableData = TableData> {
  /** Unique column identifier */
  id: string;
  
  /** Column header display text */
  header: string | ReactNode;
  
  /** Data accessor - can be string path or function */
  accessor: keyof T | ((row: T) => any);
  
  /** Column data type for proper rendering and sorting */
  dataType?: ColumnDataType;
  
  /** Column alignment */
  align?: ColumnAlignment;
  
  /** Column width (CSS value or pixel number) */
  width?: string | number;
  
  /** Minimum column width */
  minWidth?: string | number;
  
  /** Maximum column width */
  maxWidth?: string | number;
  
  /** Whether column can be sorted */
  sortable?: boolean;
  
  /** Custom sort function */
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  
  /** Whether column can be filtered */
  filterable?: boolean;
  
  /** Available filter operators for this column */
  filterOperators?: FilterOperator[];
  
  /** Custom filter component */
  FilterComponent?: React.ComponentType<ColumnFilterProps<T>>;
  
  /** Whether column can be resized */
  resizable?: boolean;
  
  /** Whether column can be reordered */
  reorderable?: boolean;
  
  /** Whether column is pinned (left/right) */
  pinned?: 'left' | 'right';
  
  /** Whether column is initially hidden */
  hidden?: boolean;
  
  /** Custom cell renderer */
  Cell?: React.ComponentType<CellProps<T>>;
  
  /** Custom header renderer */
  Header?: React.ComponentType<HeaderProps<T>>;
  
  /** Custom footer renderer */
  Footer?: React.ComponentType<FooterProps<T>>;
  
  /** Column description for accessibility */
  description?: string;
  
  /** Mobile display priority (1-5, 1 = always show) */
  mobilePriority?: 1 | 2 | 3 | 4 | 5;
  
  /** Whether column is sticky on mobile */
  stickyOnMobile?: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Custom styles */
  style?: CSSProperties;
  
  /** Meta data for additional configuration */
  meta?: Record<string, any>;
}

// =============================================================================
// Cell and Header Component Props
// =============================================================================

/**
 * Props for custom cell components
 */
export interface CellProps<T extends TableData = TableData> {
  /** Row data */
  row: T;
  
  /** Cell value */
  value: any;
  
  /** Column definition */
  column: ColumnDef<T>;
  
  /** Row index */
  rowIndex: number;
  
  /** Column index */
  columnIndex: number;
  
  /** Whether row is selected */
  isSelected: boolean;
  
  /** Whether row is being edited */
  isEditing: boolean;
  
  /** Cell update function for inline editing */
  updateCell?: (value: any) => void;
  
  /** Table instance methods */
  table: TableInstance<T>;
}

/**
 * Props for custom header components
 */
export interface HeaderProps<T extends TableData = TableData> {
  /** Column definition */
  column: ColumnDef<T>;
  
  /** Current sort state for this column */
  sortDirection?: SortDirection;
  
  /** Whether column is currently sorted */
  isSorted: boolean;
  
  /** Sort handler */
  onSort?: (direction: SortDirection) => void;
  
  /** Filter value for this column */
  filterValue?: any;
  
  /** Filter change handler */
  onFilterChange?: (value: any) => void;
  
  /** Table instance methods */
  table: TableInstance<T>;
  
  /** Column index */
  columnIndex: number;
  
  /** Whether column can be resized */
  canResize: boolean;
  
  /** Whether column is being resized */
  isResizing: boolean;
}

/**
 * Props for custom footer components
 */
export interface FooterProps<T extends TableData = TableData> {
  /** Column definition */
  column: ColumnDef<T>;
  
  /** All table data for aggregation */
  data: T[];
  
  /** Filtered data */
  filteredData: T[];
  
  /** Selected rows */
  selectedRows: T[];
  
  /** Table instance methods */
  table: TableInstance<T>;
}

/**
 * Props for column filter components
 */
export interface ColumnFilterProps<T extends TableData = TableData> {
  /** Column definition */
  column: ColumnDef<T>;
  
  /** Current filter value */
  value?: any;
  
  /** Filter change handler */
  onChange: (value: any) => void;
  
  /** Available filter operators */
  operators: FilterOperator[];
  
  /** Current filter operator */
  operator?: FilterOperator;
  
  /** Operator change handler */
  onOperatorChange?: (operator: FilterOperator) => void;
  
  /** All unique values for this column */
  uniqueValues?: any[];
}

// =============================================================================
// Sorting and Filtering
// =============================================================================

/**
 * Sort configuration
 */
export interface SortConfig {
  /** Column ID to sort by */
  columnId: string;
  
  /** Sort direction */
  direction: SortDirection;
  
  /** Priority for multi-column sorting */
  priority?: number;
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Column ID to filter */
  columnId: string;
  
  /** Filter operator */
  operator: FilterOperator;
  
  /** Filter value(s) */
  value: any;
  
  /** Whether filter is enabled */
  enabled?: boolean;
}

/**
 * Global search configuration
 */
export interface GlobalSearchConfig {
  /** Search query */
  query: string;
  
  /** Columns to search (if not provided, searches all searchable columns) */
  columns?: string[];
  
  /** Whether search is case sensitive */
  caseSensitive?: boolean;
  
  /** Whether to use regex */
  useRegex?: boolean;
  
  /** Minimum query length to trigger search */
  minQueryLength?: number;
  
  /** Search debounce delay in ms */
  debounceMs?: number;
}

// =============================================================================
// Pagination
// =============================================================================

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Current page (0-indexed) */
  page: number;
  
  /** Items per page */
  pageSize: number;
  
  /** Total number of items */
  totalItems?: number;
  
  /** Total number of pages */
  totalPages?: number;
  
  /** Whether there are more pages */
  hasNextPage?: boolean;
  
  /** Whether there are previous pages */
  hasPreviousPage?: boolean;
  
  /** Available page size options */
  pageSizeOptions?: number[];
  
  /** Whether pagination is server-side */
  serverSide?: boolean;
}

// =============================================================================
// Selection
// =============================================================================

/**
 * Selection configuration
 */
export interface SelectionConfig<T extends TableData = TableData> {
  /** Selection mode */
  mode: SelectionMode;
  
  /** Currently selected row IDs */
  selectedRowIds: Set<string>;
  
  /** Select all state */
  selectAll: boolean | 'indeterminate';
  
  /** Function to determine if row is selectable */
  isRowSelectable?: (row: T) => boolean;
  
  /** Maximum number of selectable rows */
  maxSelection?: number;
  
  /** Whether to preserve selection across pagination */
  preserveSelectionAcrossPages?: boolean;
}

// =============================================================================
// Row Actions
// =============================================================================

/**
 * Row action definition
 */
export interface RowAction<T extends TableData = TableData> {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: ReactNode;
  
  /** Action handler */
  onClick: (row: T, event: MouseEvent) => void;
  
  /** Whether action is destructive */
  destructive?: boolean;
  
  /** Whether action is disabled */
  disabled?: boolean | ((row: T) => boolean);
  
  /** Action tooltip */
  tooltip?: string;
  
  /** Keyboard shortcut */
  shortcut?: string;
  
  /** Whether action requires confirmation */
  requireConfirmation?: boolean;
  
  /** Confirmation message */
  confirmationMessage?: string;
  
  /** Action variant */
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'ghost';
}

/**
 * Bulk action definition for selected rows
 */
export interface BulkAction<T extends TableData = TableData> {
  /** Action identifier */
  id: string;
  
  /** Action label */
  label: string;
  
  /** Action icon */
  icon?: ReactNode;
  
  /** Action handler */
  onClick: (selectedRows: T[], event: MouseEvent) => void;
  
  /** Whether action is destructive */
  destructive?: boolean;
  
  /** Whether action is disabled */
  disabled?: boolean | ((selectedRows: T[]) => boolean);
  
  /** Action tooltip */
  tooltip?: string;
  
  /** Minimum selections required */
  minSelections?: number;
  
  /** Maximum selections allowed */
  maxSelections?: number;
  
  /** Whether action requires confirmation */
  requireConfirmation?: boolean;
  
  /** Confirmation message */
  confirmationMessage?: string;
}

// =============================================================================
// Export and Print
// =============================================================================

/**
 * Export configuration
 */
export interface ExportConfig<T extends TableData = TableData> {
  /** Available export formats */
  formats: ExportFormat[];
  
  /** Default filename */
  filename?: string;
  
  /** Columns to include in export (if not provided, exports all visible columns) */
  columns?: string[];
  
  /** Whether to export only selected rows */
  selectedRowsOnly?: boolean;
  
  /** Whether to export all data or only current page */
  exportAllData?: boolean;
  
  /** Custom data transformer */
  transformData?: (data: T[]) => any[];
  
  /** CSV specific options */
  csvOptions?: {
    delimiter?: string;
    includeHeaders?: boolean;
    encoding?: string;
  };
  
  /** PDF specific options */
  pdfOptions?: {
    orientation?: 'portrait' | 'landscape';
    format?: 'A4' | 'letter' | 'legal';
    margin?: number;
  };
}

// =============================================================================
// Virtual Scrolling
// =============================================================================

/**
 * Virtual scrolling configuration
 */
export interface VirtualScrollConfig {
  /** Whether virtual scrolling is enabled */
  enabled: boolean;
  
  /** Estimated row height in pixels */
  estimatedRowHeight: number;
  
  /** Number of rows to render outside visible area */
  overscan?: number;
  
  /** Container height (if not provided, uses parent height) */
  height?: number;
  
  /** Whether to use dynamic row heights */
  dynamicRowHeight?: boolean;
  
  /** Row height function for dynamic heights */
  getRowHeight?: (index: number) => number;
}

// =============================================================================
// Table State and Instance
// =============================================================================

/**
 * Complete table state
 */
export interface TableState<T extends TableData = TableData> {
  /** Table data */
  data: T[];
  
  /** Original data (before filtering/sorting) */
  originalData: T[];
  
  /** Column definitions */
  columns: ColumnDef<T>[];
  
  /** Visible columns (after hiding/showing) */
  visibleColumns: ColumnDef<T>[];
  
  /** Sort configuration */
  sorting: SortConfig[];
  
  /** Filter configuration */
  filters: FilterConfig[];
  
  /** Global search */
  globalSearch: GlobalSearchConfig;
  
  /** Pagination */
  pagination: PaginationConfig;
  
  /** Selection */
  selection: SelectionConfig<T>;
  
  /** Current view mode */
  viewMode: TableViewMode;
  
  /** Loading state */
  loading: boolean;
  
  /** Error state */
  error?: string;
  
  /** Whether table is in edit mode */
  isEditing: boolean;
  
  /** Currently editing cell */
  editingCell?: { rowId: string; columnId: string };
}

/**
 * Table instance methods and state
 */
export interface TableInstance<T extends TableData = TableData> {
  /** Current table state */
  state: TableState<T>;
  
  /** Update table state */
  setState: (updater: Partial<TableState<T>> | ((state: TableState<T>) => Partial<TableState<T>>)) => void;
  
  // Data methods
  /** Set table data */
  setData: (data: T[]) => void;
  
  /** Add row */
  addRow: (row: T, index?: number) => void;
  
  /** Update row */
  updateRow: (rowId: string, updates: Partial<T>) => void;
  
  /** Delete row */
  deleteRow: (rowId: string) => void;
  
  /** Get row by ID */
  getRow: (rowId: string) => T | undefined;
  
  // Column methods
  /** Set columns */
  setColumns: (columns: ColumnDef<T>[]) => void;
  
  /** Show/hide column */
  toggleColumn: (columnId: string, visible?: boolean) => void;
  
  /** Reorder columns */
  reorderColumns: (columnIds: string[]) => void;
  
  /** Resize column */
  resizeColumn: (columnId: string, width: number) => void;
  
  // Sorting methods
  /** Sort by column */
  sortBy: (columnId: string, direction?: SortDirection) => void;
  
  /** Add sort */
  addSort: (columnId: string, direction: SortDirection) => void;
  
  /** Remove sort */
  removeSort: (columnId: string) => void;
  
  /** Clear all sorting */
  clearSorting: () => void;
  
  // Filtering methods
  /** Set column filter */
  setFilter: (columnId: string, operator: FilterOperator, value: any) => void;
  
  /** Remove column filter */
  removeFilter: (columnId: string) => void;
  
  /** Clear all filters */
  clearFilters: () => void;
  
  /** Set global search */
  setGlobalSearch: (query: string) => void;
  
  /** Clear global search */
  clearGlobalSearch: () => void;
  
  // Pagination methods
  /** Go to page */
  goToPage: (page: number) => void;
  
  /** Go to first page */
  goToFirstPage: () => void;
  
  /** Go to last page */
  goToLastPage: () => void;
  
  /** Go to next page */
  goToNextPage: () => void;
  
  /** Go to previous page */
  goToPreviousPage: () => void;
  
  /** Set page size */
  setPageSize: (pageSize: number) => void;
  
  // Selection methods
  /** Select row */
  selectRow: (rowId: string, selected?: boolean) => void;
  
  /** Select multiple rows */
  selectRows: (rowIds: string[], selected?: boolean) => void;
  
  /** Select all rows */
  selectAllRows: (selected?: boolean) => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Get selected rows */
  getSelectedRows: () => T[];
  
  // View methods
  /** Set view mode */
  setViewMode: (mode: TableViewMode) => void;
  
  // Export methods
  /** Export data */
  exportData: (format: ExportFormat, config?: Partial<ExportConfig<T>>) => void;
  
  // Utility methods
  /** Refresh data */
  refresh: () => void;
  
  /** Reset table state */
  reset: () => void;
  
  /** Get filtered data */
  getFilteredData: () => T[];
  
  /** Get sorted data */
  getSortedData: () => T[];
  
  /** Get paginated data */
  getPaginatedData: () => T[];
}

// =============================================================================
// Table Configuration and Props
// =============================================================================

/**
 * BaseTable component props
 */
export interface BaseTableProps<T extends TableData = TableData> {
  /** Table data */
  data: T[];
  
  /** Column definitions */
  columns: ColumnDef<T>[];
  
  /** Table loading state */
  loading?: boolean;
  
  /** Table error state */
  error?: string;
  
  /** Empty state message */
  emptyMessage?: string | ReactNode;
  
  /** Table title */
  title?: string;
  
  /** Table description */
  description?: string;
  
  // Behavior configuration
  /** Selection configuration */
  selection?: Partial<SelectionConfig<T>>;
  
  /** Pagination configuration */
  pagination?: Partial<PaginationConfig>;
  
  /** Virtual scrolling configuration */
  virtualScrolling?: Partial<VirtualScrollConfig>;
  
  /** Export configuration */
  exportConfig?: Partial<ExportConfig<T>>;
  
  /** Initial sorting */
  initialSorting?: SortConfig[];
  
  /** Initial filters */
  initialFilters?: FilterConfig[];
  
  /** Initial global search */
  initialGlobalSearch?: string;
  
  /** Initial view mode */
  initialViewMode?: TableViewMode;
  
  /** Default page size */
  defaultPageSize?: number;
  
  // Actions
  /** Row actions */
  rowActions?: RowAction<T>[];
  
  /** Bulk actions */
  bulkActions?: BulkAction<T>[];
  
  // Event handlers
  /** Row click handler */
  onRowClick?: (row: T, event: MouseEvent) => void;
  
  /** Row double click handler */
  onRowDoubleClick?: (row: T, event: MouseEvent) => void;
  
  /** Cell click handler */
  onCellClick?: (row: T, column: ColumnDef<T>, event: MouseEvent) => void;
  
  /** Selection change handler */
  onSelectionChange?: (selectedRows: T[]) => void;
  
  /** Sort change handler */
  onSortChange?: (sorting: SortConfig[]) => void;
  
  /** Filter change handler */
  onFilterChange?: (filters: FilterConfig[]) => void;
  
  /** Page change handler */
  onPageChange?: (page: number, pageSize: number) => void;
  
  /** View mode change handler */
  onViewModeChange?: (mode: TableViewMode) => void;
  
  /** Column visibility change handler */
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  
  /** Column order change handler */
  onColumnOrderChange?: (columnIds: string[]) => void;
  
  /** Column resize handler */
  onColumnResize?: (columnId: string, width: number) => void;
  
  // Styling
  /** Custom CSS classes */
  className?: string;
  
  /** Custom styles */
  style?: CSSProperties;
  
  /** Table size variant */
  size?: 'sm' | 'default' | 'lg';
  
  /** Whether table has border */
  bordered?: boolean;
  
  /** Whether table has striped rows */
  striped?: boolean;
  
  /** Whether table has hover effects */
  hoverable?: boolean;
  
  /** Whether table is responsive */
  responsive?: boolean;
  
  /** Sticky header */
  stickyHeader?: boolean;
  
  /** Sticky first column */
  stickyFirstColumn?: boolean;
  
  /** Maximum table height */
  maxHeight?: string | number;
  
  // ADHD-friendly features
  /** High contrast mode */
  highContrast?: boolean;
  
  /** Reduced motion */
  reducedMotion?: boolean;
  
  /** Focus management */
  focusManagement?: boolean;
  
  /** Keyboard navigation */
  keyboardNavigation?: boolean;
  
  /** Row highlighting on focus */
  highlightFocusedRow?: boolean;
  
  // Gamification integration
  /** Show XP indicators */
  showXP?: boolean;
  
  /** Show achievement badges */
  showAchievements?: boolean;
  
  /** Show progress indicators */
  showProgress?: boolean;
  
  /** XP field accessor */
  xpAccessor?: keyof T | ((row: T) => number);
  
  /** Achievement field accessor */
  achievementAccessor?: keyof T | ((row: T) => number);
  
  /** Progress field accessor */
  progressAccessor?: keyof T | ((row: T) => number);
  
  // Testing
  /** Test ID for automation */
  testId?: string;
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * Return type for useTable hook
 */
export interface UseTableReturn<T extends TableData = TableData> {
  /** Table instance */
  table: TableInstance<T>;
  
  /** Current filtered and sorted data */
  processedData: T[];
  
  /** Current page data */
  pageData: T[];
  
  /** Table state */
  state: TableState<T>;
  
  /** Whether data is loading */
  loading: boolean;
  
  /** Error state */
  error?: string;
}

/**
 * Return type for useTableSelection hook
 */
export interface UseTableSelectionReturn<T extends TableData = TableData> {
  /** Selected row IDs */
  selectedRowIds: Set<string>;
  
  /** Selected rows */
  selectedRows: T[];
  
  /** Select all state */
  selectAll: boolean | 'indeterminate';
  
  /** Select row */
  selectRow: (rowId: string, selected?: boolean) => void;
  
  /** Select multiple rows */
  selectRows: (rowIds: string[], selected?: boolean) => void;
  
  /** Select all rows */
  selectAllRows: (selected?: boolean) => void;
  
  /** Clear selection */
  clearSelection: () => void;
  
  /** Is row selected */
  isRowSelected: (rowId: string) => boolean;
  
  /** Is row selectable */
  isRowSelectable: (row: T) => boolean;
}

/**
 * Return type for useTableFilters hook
 */
export interface UseTableFiltersReturn<T extends TableData = TableData> {
  /** Current filters */
  filters: FilterConfig[];
  
  /** Global search query */
  globalSearch: string;
  
  /** Filtered data */
  filteredData: T[];
  
  /** Set filter */
  setFilter: (columnId: string, operator: FilterOperator, value: any) => void;
  
  /** Remove filter */
  removeFilter: (columnId: string) => void;
  
  /** Clear all filters */
  clearFilters: () => void;
  
  /** Set global search */
  setGlobalSearch: (query: string) => void;
  
  /** Clear global search */
  clearGlobalSearch: () => void;
  
  /** Get filter for column */
  getColumnFilter: (columnId: string) => FilterConfig | undefined;
}

/**
 * Return type for useTableSorting hook
 */
export interface UseTableSortingReturn<T extends TableData = TableData> {
  /** Current sorting */
  sorting: SortConfig[];
  
  /** Sorted data */
  sortedData: T[];
  
  /** Sort by column */
  sortBy: (columnId: string, direction?: SortDirection) => void;
  
  /** Add sort */
  addSort: (columnId: string, direction: SortDirection) => void;
  
  /** Remove sort */
  removeSort: (columnId: string) => void;
  
  /** Clear all sorting */
  clearSorting: () => void;
  
  /** Get sort for column */
  getColumnSort: (columnId: string) => SortConfig | undefined;
  
  /** Is column sorted */
  isColumnSorted: (columnId: string) => boolean;
}

/**
 * Return type for useTablePagination hook
 */
export interface UseTablePaginationReturn<T extends TableData = TableData> {
  /** Current page (0-indexed) */
  page: number;
  
  /** Page size */
  pageSize: number;
  
  /** Total pages */
  totalPages: number;
  
  /** Has next page */
  hasNextPage: boolean;
  
  /** Has previous page */
  hasPreviousPage: boolean;
  
  /** Paginated data */
  paginatedData: T[];
  
  /** Go to page */
  goToPage: (page: number) => void;
  
  /** Go to first page */
  goToFirstPage: () => void;
  
  /** Go to last page */
  goToLastPage: () => void;
  
  /** Go to next page */
  goToNextPage: () => void;
  
  /** Go to previous page */
  goToPreviousPage: () => void;
  
  /** Set page size */
  setPageSize: (pageSize: number) => void;
}