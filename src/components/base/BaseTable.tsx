"use client"

import * as React from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal, 
  Search, 
  Filter,
  Download,
  Eye,
  EyeOff,
  Settings,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  Check,
  X,
  Grid3x3,
  List,
  LayoutGrid,
  Maximize2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from './LoadingSpinner';
import { StatusBadge } from './StatusBadge';

import { 
  BaseTableProps,
  TableData,
  ColumnDef,
  TableViewMode,
  SortDirection,
  FilterOperator,
  SelectionMode,
} from '@/types/table';

import { useTable } from '@/hooks/useTable';
import { CardView, ListView, CompactView } from './TableViewModes';

// =============================================================================
// BaseTable Component
// =============================================================================

/**
 * Comprehensive BaseTable component with advanced features
 * - Sorting (multi-column, custom sort functions)
 * - Filtering (column filters, global search, date ranges)
 * - Pagination (server-side and client-side)
 * - Selection (single, multi, bulk actions)
 * - Responsive design (mobile card view, compact view)
 * - Column resizing and reordering
 * - Row actions (edit, delete, custom actions)
 * - Virtual scrolling for large datasets
 * - Export functionality (CSV, JSON)
 * - ADHD-friendly features
 * - Gamification integration
 */
export function BaseTable<T extends TableData = TableData>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = "No data available",
  title,
  description,
  selection = { mode: 'none', selectedRowIds: new Set(), selectAll: false },
  pagination = { page: 0, pageSize: 10 },
  initialSorting = [],
  initialFilters = [],
  initialGlobalSearch = '',
  initialViewMode = 'table',
  defaultPageSize = 10,
  rowActions = [],
  bulkActions = [],
  onRowClick,
  onRowDoubleClick,
  onSelectionChange,
  onSortChange,
  onFilterChange,
  onPageChange,
  onViewModeChange,
  className,
  style,
  size = 'default',
  bordered = false,
  striped = false,
  hoverable = true,
  responsive = true,
  stickyHeader = false,
  maxHeight,
  highContrast = false,
  keyboardNavigation = true,
  highlightFocusedRow = true,
  showXP = false,
  showAchievements = false,
  showProgress = false,
  testId = 'base-table',
}: BaseTableProps<T>) {
  const tableResult = useTable({
    data,
    columns,
    initialSorting,
    initialFilters,
    initialGlobalSearch,
    initialViewMode,
    pagination: { ...pagination, pageSize: pagination.pageSize || defaultPageSize },
    selection: { ...selection, mode: selection.mode || 'none' },
  });

  const {
    table,
    state,
    processedData,
    pageData,
    loading: tableLoading,
    error: tableError,
  } = tableResult;

  const isLoading = loading || tableLoading;
  const currentError = error || tableError;

  // Handle selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRows();
      onSelectionChange(selectedRows);
    }
  }, [state.selection.selectedRowIds, onSelectionChange]);

  // Handle sort changes
  React.useEffect(() => {
    if (onSortChange) {
      onSortChange(state.sorting);
    }
  }, [state.sorting, onSortChange]);

  // Handle filter changes
  React.useEffect(() => {
    if (onFilterChange) {
      onFilterChange(state.filters);
    }
  }, [state.filters, onFilterChange]);

  // Handle pagination changes
  React.useEffect(() => {
    if (onPageChange) {
      onPageChange(state.pagination.page, state.pagination.pageSize);
    }
  }, [state.pagination.page, state.pagination.pageSize, onPageChange]);

  // Handle view mode changes
  React.useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(state.viewMode);
    }
  }, [state.viewMode, onViewModeChange]);

  // Keyboard navigation handler
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (!keyboardNavigation) return;

    // TODO: Implement keyboard navigation logic
    // - Arrow keys for navigation
    // - Enter/Space for selection
    // - Tab for focus management
    // - Ctrl+A for select all
    // - Delete for bulk actions
  }, [keyboardNavigation]);

  const tableClasses = cn(
    'base-table',
    'w-full relative',
    {
      'border border-border rounded-lg': bordered,
      'high-contrast': highContrast,
      'keyboard-nav': keyboardNavigation,
      'highlight-focus': highlightFocusedRow,
    },
    className
  );

  const containerStyle = {
    ...style,
    ...(maxHeight && { maxHeight }),
  };

  return (
    <div 
      className={tableClasses}
      style={containerStyle}
      onKeyDown={handleKeyDown}
      data-testid={testId}
      role="region"
      aria-label={title || 'Data table'}
      tabIndex={keyboardNavigation ? 0 : undefined}
    >
      {/* Table Header with Title, Search, and Controls */}
      <TableHeader
        title={title}
        description={description}
        table={table}
        showSearch={true}
        showViewModeToggle={responsive}
        showColumnVisibility={true}
        showExport={true}
        bulkActions={bulkActions}
      />

      {/* Table Content */}
      <div className="table-content">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {currentError && (
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{currentError}</span>
          </div>
        )}

        {!isLoading && !currentError && processedData.length === 0 && (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        )}

        {!isLoading && !currentError && processedData.length > 0 && (
          <>
            {state.viewMode === 'table' && (
              <TableView
                table={table}
                pageData={pageData}
                columns={state.visibleColumns}
                size={size}
                striped={striped}
                hoverable={hoverable}
                stickyHeader={stickyHeader}
                rowActions={rowActions}
                onRowClick={onRowClick}
                onRowDoubleClick={onRowDoubleClick}
                showXP={showXP}
                showAchievements={showAchievements}
                showProgress={showProgress}
              />
            )}

            {state.viewMode === 'cards' && (
              <CardView
                table={table}
                pageData={pageData}
                columns={state.visibleColumns}
                rowActions={rowActions}
                onRowClick={onRowClick}
                showXP={showXP}
                showAchievements={showAchievements}
                showProgress={showProgress}
              />
            )}

            {state.viewMode === 'list' && (
              <ListView
                table={table}
                pageData={pageData}
                columns={state.visibleColumns}
                rowActions={rowActions}
                onRowClick={onRowClick}
                showXP={showXP}
                showAchievements={showAchievements}
                showProgress={showProgress}
              />
            )}

            {state.viewMode === 'compact' && (
              <CompactView
                table={table}
                pageData={pageData}
                columns={state.visibleColumns}
                rowActions={rowActions}
                onRowClick={onRowClick}
                showXP={showXP}
                showAchievements={showAchievements}
                showProgress={showProgress}
              />
            )}
          </>
        )}
      </div>

      {/* Table Footer with Pagination */}
      {!isLoading && !currentError && processedData.length > 0 && (
        <TableFooter table={table} />
      )}
    </div>
  );
}

// =============================================================================
// Table Header Component
// =============================================================================

interface TableHeaderProps<T extends TableData> {
  title?: string;
  description?: string;
  table: any; // TODO: Use proper TableInstance type
  showSearch?: boolean;
  showViewModeToggle?: boolean;
  showColumnVisibility?: boolean;
  showExport?: boolean;
  bulkActions?: any[];
}

function TableHeader<T extends TableData>({
  title,
  description,
  table,
  showSearch = true,
  showViewModeToggle = true,
  showColumnVisibility = true,
  showExport = true,
  bulkActions = [],
}: TableHeaderProps<T>) {
  const { state } = table;
  const hasSelectedRows = state.selection.selectedRowIds.size > 0;

  return (
    <div className="table-header p-4 border-b border-border">
      {/* Title and Description */}
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left Side - Search and Filters */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={state.globalSearch.query}
                onChange={(e) => table.setGlobalSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* TODO: Open filter panel */}}
            className="whitespace-nowrap"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filters
            {state.filters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {state.filters.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Bulk Actions */}
          {hasSelectedRows && bulkActions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {state.selection.selectedRowIds.size} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.destructive ? 'destructive' : 'default'}
                  size="sm"
                  onClick={(e) => action.onClick(table.getSelectedRows(), e)}
                  disabled={
                    typeof action.disabled === 'function'
                      ? action.disabled(table.getSelectedRows())
                      : action.disabled
                  }
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* View Mode Toggle */}
          {showViewModeToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {state.viewMode === 'table' && <Grid3x3 className="h-4 w-4" />}
                  {state.viewMode === 'cards' && <LayoutGrid className="h-4 w-4" />}
                  {state.viewMode === 'list' && <List className="h-4 w-4" />}
                  {state.viewMode === 'compact' && <Maximize2 className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={state.viewMode === 'table'}
                  onCheckedChange={() => table.setViewMode('table')}
                >
                  <Grid3x3 className="h-4 w-4 mr-2" />
                  Table
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={state.viewMode === 'cards'}
                  onCheckedChange={() => table.setViewMode('cards')}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Cards
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={state.viewMode === 'list'}
                  onCheckedChange={() => table.setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={state.viewMode === 'compact'}
                  onCheckedChange={() => table.setViewMode('compact')}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Compact
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Visibility */}
          {showColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table.state.columns.map((column: ColumnDef<T>) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={!column.hidden}
                    onCheckedChange={(checked) => 
                      table.toggleColumn(column.id, checked)
                    }
                  >
                    {typeof column.header === 'string' ? column.header : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Export */}
          {showExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => table.exportData('csv')}>
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.exportData('json')}>
                  JSON Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => table.exportData('xlsx')}>
                  Excel Format
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Settings */}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Table View Components
// =============================================================================

interface TableViewProps<T extends TableData> {
  table: any; // TODO: Use proper TableInstance type
  pageData: T[];
  columns: ColumnDef<T>[];
  size?: 'sm' | 'default' | 'lg';
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  rowActions?: any[];
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  onRowDoubleClick?: (row: T, event: React.MouseEvent) => void;
  showXP?: boolean;
  showAchievements?: boolean;
  showProgress?: boolean;
}

function TableView<T extends TableData>({
  table,
  pageData,
  columns,
  size = 'default',
  striped = false,
  hoverable = true,
  stickyHeader = false,
  rowActions = [],
  onRowClick,
  onRowDoubleClick,
  showXP,
  showAchievements,
  showProgress,
}: TableViewProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* Table Header */}
        <thead className={cn('bg-muted/50', { 'sticky top-0 z-10': stickyHeader })}>
          <tr>
            {/* Selection Column */}
            {table.state.selection.mode !== 'none' && (
              <th className="w-12 p-2">
                {table.state.selection.mode === 'multiple' && (
                  <Checkbox
                    checked={table.state.selection.selectAll}
                    onCheckedChange={(checked) => table.selectAllRows(checked)}
                    aria-label="Select all rows"
                  />
                )}
              </th>
            )}

            {/* Data Columns */}
            {columns.map((column) => (
              <th
                key={column.id}
                className={cn(
                  'text-left font-medium p-2',
                  {
                    'text-center': column.align === 'center',
                    'text-right': column.align === 'right',
                    'cursor-pointer hover:bg-muted': column.sortable,
                  }
                )}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                }}
                onClick={() => {
                  if (column.sortable) {
                    const currentSort = table.getColumnSort(column.id);
                    const direction: SortDirection = 
                      currentSort?.direction === 'asc' ? 'desc' : 'asc';
                    table.sortBy(column.id, direction);
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <div className="flex flex-col">
                      {table.getColumnSort(column.id) ? (
                        table.getColumnSort(column.id)?.direction === 'asc' ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-50" />
                      )}
                    </div>
                  )}
                </div>
              </th>
            ))}

            {/* Actions Column */}
            {rowActions.length > 0 && (
              <th className="w-12 p-2">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody>
          {pageData.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={cn(
                'border-b transition-colors',
                {
                  'hover:bg-muted/50': hoverable,
                  'bg-muted/25': striped && rowIndex % 2 === 1,
                  'bg-primary/5': table.isRowSelected(row.id),
                }
              )}
              onClick={(e) => onRowClick?.(row, e)}
              onDoubleClick={(e) => onRowDoubleClick?.(row, e)}
            >
              {/* Selection Cell */}
              {table.state.selection.mode !== 'none' && (
                <td className="p-2">
                  <Checkbox
                    checked={table.isRowSelected(row.id)}
                    onCheckedChange={(checked) => table.selectRow(row.id, checked)}
                    aria-label={`Select row ${rowIndex + 1}`}
                  />
                </td>
              )}

              {/* Data Cells */}
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    'p-2',
                    {
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    },
                    column.className
                  )}
                  style={column.style}
                >
                  <CellContent
                    row={row}
                    column={column}
                    table={table}
                    showXP={showXP}
                    showAchievements={showAchievements}
                    showProgress={showProgress}
                  />
                </td>
              ))}

              {/* Actions Cell */}
              {rowActions.length > 0 && (
                <td className="p-2">
                  <RowActionsDropdown
                    row={row}
                    actions={rowActions}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// =============================================================================
// Cell Content Component
// =============================================================================

interface CellContentProps<T extends TableData> {
  row: T;
  column: ColumnDef<T>;
  table: any;
  showXP?: boolean;
  showAchievements?: boolean;
  showProgress?: boolean;
}

function CellContent<T extends TableData>({
  row,
  column,
  table,
  showXP,
  showAchievements,
  showProgress,
}: CellContentProps<T>) {
  // Get cell value
  const value = typeof column.accessor === 'function'
    ? column.accessor(row)
    : row[column.accessor as keyof T];

  // Custom cell renderer
  if (column.Cell) {
    return (
      <column.Cell
        row={row}
        value={value}
        column={column}
        table={table}
        rowIndex={0} // TODO: Get proper row index
        columnIndex={0} // TODO: Get proper column index
        isSelected={table.isRowSelected(row.id)}
        isEditing={false}
      />
    );
  }

  // Built-in renderers based on data type
  switch (column.dataType) {
    case 'boolean':
      return value ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-red-600" />
      );

    case 'badge':
      return (
        <StatusBadge 
          status={value} 
          variant="secondary" 
        />
      );

    case 'progress':
      return (
        <div className="flex items-center gap-2">
          <Progress value={value} className="flex-1" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {value}%
          </span>
        </div>
      );

    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(Number(value) || 0);

    case 'percentage':
      return `${Number(value) || 0}%`;

    case 'date':
      return value ? new Date(value).toLocaleDateString() : '';

    case 'datetime':
      return value ? new Date(value).toLocaleString() : '';

    default:
      return String(value || '');
  }
}

// =============================================================================
// Row Actions Dropdown
// =============================================================================

interface RowActionsDropdownProps<T extends TableData> {
  row: T;
  actions: any[]; // TODO: Use proper RowAction type
}

function RowActionsDropdown<T extends TableData>({
  row,
  actions,
}: RowActionsDropdownProps<T>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={(e) => action.onClick(row, e)}
            disabled={
              typeof action.disabled === 'function'
                ? action.disabled(row)
                : action.disabled
            }
            className={cn({
              'text-destructive focus:text-destructive': action.destructive,
            })}
          >
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// =============================================================================
// Table Footer Component
// =============================================================================

interface TableFooterProps<T extends TableData> {
  table: any; // TODO: Use proper TableInstance type
}

function TableFooter<T extends TableData>({ table }: TableFooterProps<T>) {
  const { state } = table;
  const { pagination } = state;

  return (
    <div className="flex items-center justify-between p-4 border-t border-border">
      {/* Results Info */}
      <div className="text-sm text-muted-foreground">
        Showing {pagination.page * pagination.pageSize + 1} to{' '}
        {Math.min((pagination.page + 1) * pagination.pageSize, pagination.totalItems || 0)} of{' '}
        {pagination.totalItems || 0} results
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Page Size Selector */}
        <Select
          value={String(pagination.pageSize)}
          onValueChange={(value) => table.setPageSize(Number(value))}
        >
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50, 100].map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Page Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.goToFirstPage()}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.goToPreviousPage()}
            disabled={!pagination.hasPreviousPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            <span className="text-sm">Page</span>
            <Input
              type="number"
              min={1}
              max={pagination.totalPages}
              value={pagination.page + 1}
              onChange={(e) => {
                const page = Number(e.target.value) - 1;
                if (page >= 0 && page < (pagination.totalPages || 1)) {
                  table.goToPage(page);
                }
              }}
              className="w-16 text-center"
            />
            <span className="text-sm">of {pagination.totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.goToNextPage()}
            disabled={!pagination.hasNextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.goToLastPage()}
            disabled={!pagination.hasNextPage}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BaseTable;