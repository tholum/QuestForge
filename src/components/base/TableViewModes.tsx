"use client"

import * as React from 'react';
import { MoreVertical, ChevronRight, Star, Clock, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from './StatusBadge';

import {
  TableData,
  ColumnDef,
  TableInstance,
  RowAction,
} from '@/types/table';

// =============================================================================
// Card View Component
// =============================================================================

interface CardViewProps<T extends TableData> {
  table: TableInstance<T>;
  pageData: T[];
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  showXP?: boolean;
  showAchievements?: boolean;
  showProgress?: boolean;
}

export function CardView<T extends TableData>({
  table,
  pageData,
  columns,
  rowActions = [],
  onRowClick,
  showXP = false,
  showAchievements = false,
  showProgress = false,
}: CardViewProps<T>) {
  // Sort columns by mobile priority (lower numbers = higher priority)
  const prioritizedColumns = React.useMemo(() => {
    return [...columns].sort((a, b) => {
      const aPriority = a.mobilePriority || 5;
      const bPriority = b.mobilePriority || 5;
      return aPriority - bPriority;
    });
  }, [columns]);

  // Get primary columns (priority 1-2)
  const primaryColumns = prioritizedColumns.filter(col => (col.mobilePriority || 5) <= 2);
  const secondaryColumns = prioritizedColumns.filter(col => (col.mobilePriority || 5) > 2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {pageData.map((row, index) => (
        <Card
          key={row.id}
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:shadow-md hover:shadow-primary/10 hover:-translate-y-0.5",
            "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
            {
              "ring-2 ring-primary ring-offset-2": table.isRowSelected(row.id),
              "opacity-75": !table.isRowSelectable(row),
            }
          )}
          onClick={(e) => {
            e.preventDefault();
            onRowClick?.(row, e);
          }}
          tabIndex={0}
          role="button"
          aria-label={`Row ${index + 1}`}
        >
          {/* Card Header */}
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* Selection Checkbox */}
                {table.state.selection.mode !== 'none' && (
                  <Checkbox
                    checked={table.isRowSelected(row.id)}
                    onCheckedChange={(checked) => {
                      table.selectRow(row.id, !!checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1"
                    disabled={!table.isRowSelectable(row)}
                  />
                )}

                {/* Primary Content */}
                <div className="min-w-0 flex-1">
                  {primaryColumns.map((column, colIndex) => (
                    <div key={column.id} className={cn({
                      "mb-1": colIndex === 0,
                      "text-sm text-muted-foreground": colIndex > 0,
                    })}>
                      {colIndex === 0 && (
                        <div className="font-semibold text-base line-clamp-2">
                          <CellContent
                            row={row}
                            column={column}
                            table={table}
                            variant="primary"
                          />
                        </div>
                      )}
                      {colIndex === 1 && (
                        <div className="line-clamp-1">
                          <CellContent
                            row={row}
                            column={column}
                            table={table}
                            variant="secondary"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {rowActions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Show row actions menu
                  }}
                  className="shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Card Content */}
          <CardContent className="pt-0">
            {/* Progress Indicator */}
            {showProgress && (
              <div className="mb-3">
                <Progress value={75} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
              </div>
            )}

            {/* Secondary Information */}
            {secondaryColumns.length > 0 && (
              <div className="space-y-2">
                {secondaryColumns.slice(0, 3).map((column) => (
                  <div key={column.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {typeof column.header === 'string' ? column.header : column.id}:
                    </span>
                    <div className="text-right">
                      <CellContent
                        row={row}
                        column={column}
                        table={table}
                        variant="badge"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Gamification Elements */}
            {(showXP || showAchievements) && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                {showXP && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">+15 XP</span>
                  </div>
                )}
                {showAchievements && (
                  <Badge variant="secondary" className="text-xs">
                    🏆 3 Achievements
                  </Badge>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Updated 2h ago</span>
              </div>
              {showProgress && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">+12%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// List View Component
// =============================================================================

interface ListViewProps<T extends TableData> {
  table: TableInstance<T>;
  pageData: T[];
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  showXP?: boolean;
  showAchievements?: boolean;
  showProgress?: boolean;
}

export function ListView<T extends TableData>({
  table,
  pageData,
  columns,
  rowActions = [],
  onRowClick,
  showXP = false,
  showAchievements = false,
  showProgress = false,
}: ListViewProps<T>) {
  const prioritizedColumns = React.useMemo(() => {
    return [...columns]
      .sort((a, b) => (a.mobilePriority || 5) - (b.mobilePriority || 5))
      .slice(0, 3); // Show only top 3 columns in list view
  }, [columns]);

  return (
    <div className="divide-y divide-border">
      {pageData.map((row, index) => (
        <div
          key={row.id}
          className={cn(
            "flex items-center gap-4 p-4 cursor-pointer transition-colors",
            "hover:bg-muted/50 focus:bg-muted/50 focus:outline-none",
            {
              "bg-primary/10": table.isRowSelected(row.id),
              "opacity-75": !table.isRowSelectable(row),
            }
          )}
          onClick={(e) => onRowClick?.(row, e)}
          tabIndex={0}
          role="button"
          aria-label={`Row ${index + 1}`}
        >
          {/* Selection */}
          {table.state.selection.mode !== 'none' && (
            <Checkbox
              checked={table.isRowSelected(row.id)}
              onCheckedChange={(checked) => {
                table.selectRow(row.id, !!checked);
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={!table.isRowSelectable(row)}
              className="shrink-0"
            />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium line-clamp-1 mb-1">
                  <CellContent
                    row={row}
                    column={prioritizedColumns[0]}
                    table={table}
                    variant="primary"
                  />
                </div>
                {prioritizedColumns[1] && (
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    <CellContent
                      row={row}
                      column={prioritizedColumns[1]}
                      table={table}
                      variant="secondary"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Third column as badge */}
                {prioritizedColumns[2] && (
                  <div className="text-sm">
                    <CellContent
                      row={row}
                      column={prioritizedColumns[2]}
                      table={table}
                      variant="badge"
                    />
                  </div>
                )}

                {/* Gamification */}
                {showXP && (
                  <Badge variant="secondary" className="text-xs">
                    +15 XP
                  </Badge>
                )}

                {/* Progress */}
                {showProgress && (
                  <div className="w-16">
                    <Progress value={75} className="h-1" />
                  </div>
                )}

                {/* Actions */}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Compact View Component
// =============================================================================

interface CompactViewProps<T extends TableData> {
  table: TableInstance<T>;
  pageData: T[];
  columns: ColumnDef<T>[];
  rowActions?: RowAction<T>[];
  onRowClick?: (row: T, event: React.MouseEvent) => void;
  showXP?: boolean;
  showAchievements?: boolean;
  showProgress?: boolean;
}

export function CompactView<T extends TableData>({
  table,
  pageData,
  columns,
  rowActions = [],
  onRowClick,
  showXP = false,
  showAchievements = false,
  showProgress = false,
}: CompactViewProps<T>) {
  // Use only the highest priority columns for compact view
  const compactColumns = React.useMemo(() => {
    return [...columns]
      .sort((a, b) => (a.mobilePriority || 5) - (b.mobilePriority || 5))
      .slice(0, 4); // Maximum 4 columns in compact view
  }, [columns]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {table.state.selection.mode !== 'none' && (
              <th className="w-8 p-2">
                {table.state.selection.mode === 'multiple' && (
                  <Checkbox
                    checked={table.state.selection.selectAll}
                    onCheckedChange={(checked) => table.selectAllRows(!!checked)}
                    className="h-3 w-3"
                  />
                )}
              </th>
            )}
            {compactColumns.map((column) => (
              <th
                key={column.id}
                className="text-left font-medium p-2 text-xs"
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                }}
              >
                {typeof column.header === 'string' ? column.header : column.id}
              </th>
            ))}
            {rowActions.length > 0 && <th className="w-8 p-2"></th>}
          </tr>
        </thead>
        <tbody>
          {pageData.map((row, index) => (
            <tr
              key={row.id}
              className={cn(
                "border-b hover:bg-muted/50 cursor-pointer transition-colors",
                {
                  'bg-primary/10': table.isRowSelected(row.id),
                  'bg-muted/25': index % 2 === 1,
                  'opacity-75': !table.isRowSelectable(row),
                }
              )}
              onClick={(e) => onRowClick?.(row, e)}
              tabIndex={0}
            >
              {/* Selection */}
              {table.state.selection.mode !== 'none' && (
                <td className="p-2">
                  <Checkbox
                    checked={table.isRowSelected(row.id)}
                    onCheckedChange={(checked) => {
                      table.selectRow(row.id, !!checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3 w-3"
                    disabled={!table.isRowSelectable(row)}
                  />
                </td>
              )}

              {/* Data Cells */}
              {compactColumns.map((column) => (
                <td
                  key={column.id}
                  className={cn('p-2 truncate', {
                    'text-center': column.align === 'center',
                    'text-right': column.align === 'right',
                  })}
                >
                  <CellContent
                    row={row}
                    column={column}
                    table={table}
                    variant="compact"
                  />
                </td>
              ))}

              {/* Actions */}
              {rowActions.length > 0 && (
                <td className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Show row actions
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
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
// Cell Content Component with Variants
// =============================================================================

interface CellContentProps<T extends TableData> {
  row: T;
  column: ColumnDef<T>;
  table: TableInstance<T>;
  variant?: 'primary' | 'secondary' | 'badge' | 'compact';
}

function CellContent<T extends TableData>({
  row,
  column,
  table,
  variant = 'primary',
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

  // Built-in renderers based on data type and variant
  const renderContent = () => {
    switch (column.dataType) {
      case 'boolean':
        return (
          <div className="flex items-center">
            {value ? (
              <Badge variant="secondary" className="text-xs">
                Yes
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No
              </Badge>
            )}
          </div>
        );

      case 'badge':
        return (
          <StatusBadge 
            status={value} 
            variant={variant === 'compact' ? 'secondary' : 'default'}
            size={variant === 'compact' ? 'sm' : 'default'}
          />
        );

      case 'progress':
        if (variant === 'compact') {
          return `${value}%`;
        }
        return (
          <div className="flex items-center gap-2 w-full max-w-[120px]">
            <Progress value={Number(value) || 0} className="flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {value}%
            </span>
          </div>
        );

      case 'currency':
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: variant === 'compact' ? 0 : 2,
        }).format(Number(value) || 0);
        
        return variant === 'compact' ? formatted.replace('.00', '') : formatted;

      case 'percentage':
        return `${Number(value) || 0}%`;

      case 'date':
        if (!value) return '';
        const date = new Date(value);
        return variant === 'compact' 
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleDateString();

      case 'datetime':
        if (!value) return '';
        const datetime = new Date(value);
        return variant === 'compact'
          ? datetime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : datetime.toLocaleString();

      default:
        const stringValue = String(value || '');
        
        // Truncate long text based on variant
        if (variant === 'compact' && stringValue.length > 20) {
          return stringValue.substring(0, 17) + '...';
        }
        if (variant === 'secondary' && stringValue.length > 50) {
          return stringValue.substring(0, 47) + '...';
        }
        
        return stringValue;
    }
  };

  return (
    <div className={cn({
      'font-medium': variant === 'primary',
      'text-muted-foreground': variant === 'secondary',
      'text-xs': variant === 'compact',
    })}>
      {renderContent()}
    </div>
  );
}

export { CellContent };