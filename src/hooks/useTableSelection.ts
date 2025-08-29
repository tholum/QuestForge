"use client"

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  TableData,
  SelectionConfig,
  UseTableSelectionReturn,
  SelectionMode,
} from '@/types/table';

interface UseTableSelectionOptions<T extends TableData> {
  data: T[];
  mode: SelectionMode;
  initialSelectedIds?: Set<string>;
  isRowSelectable?: (row: T) => boolean;
  maxSelection?: number;
  preserveSelectionAcrossPages?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
}

/**
 * Hook for managing table row selection with keyboard navigation
 * Supports single, multiple selection modes with accessibility features
 */
export function useTableSelection<T extends TableData>({
  data = [],
  mode = 'none',
  initialSelectedIds = new Set(),
  isRowSelectable = () => true,
  maxSelection,
  preserveSelectionAcrossPages = false,
  onSelectionChange,
}: UseTableSelectionOptions<T>): UseTableSelectionReturn<T> {
  
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(initialSelectedIds);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1);

  // Get selectable rows
  const selectableRows = useMemo(() => {
    return data.filter(row => isRowSelectable(row));
  }, [data, isRowSelectable]);

  const selectableRowIds = useMemo(() => {
    return new Set(selectableRows.map(row => row.id));
  }, [selectableRows]);

  // Calculate select all state
  const selectAll = useMemo(() => {
    const selectableCount = selectableRows.length;
    const selectedCount = Array.from(selectedRowIds).filter(id => 
      selectableRowIds.has(id)
    ).length;

    if (selectedCount === 0) return false;
    if (selectedCount === selectableCount) return true;
    return 'indeterminate' as const;
  }, [selectedRowIds, selectableRows.length, selectableRowIds]);

  // Get selected rows
  const selectedRows = useMemo(() => {
    return data.filter(row => selectedRowIds.has(row.id));
  }, [data, selectedRowIds]);

  // Clean up selection when data changes (remove invalid IDs)
  useEffect(() => {
    if (!preserveSelectionAcrossPages) {
      const validIds = new Set(data.map(row => row.id));
      const filteredSelection = new Set(
        Array.from(selectedRowIds).filter(id => validIds.has(id))
      );
      
      if (filteredSelection.size !== selectedRowIds.size) {
        setSelectedRowIds(filteredSelection);
      }
    }
  }, [data, selectedRowIds, preserveSelectionAcrossPages]);

  // Notify selection changes
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedRows);
    }
  }, [selectedRows, onSelectionChange]);

  // =============================================================================
  // Selection Methods
  // =============================================================================

  const selectRow = useCallback((rowId: string, selected = true) => {
    if (mode === 'none') return;

    const row = data.find(r => r.id === rowId);
    if (!row || !isRowSelectable(row)) return;

    setSelectedRowIds(prev => {
      const newSelection = new Set(prev);

      if (selected) {
        if (mode === 'single') {
          newSelection.clear();
        }
        
        // Check max selection limit
        if (maxSelection && newSelection.size >= maxSelection && !newSelection.has(rowId)) {
          return prev;
        }

        newSelection.add(rowId);
        
        // Update last selected index for range selection
        const rowIndex = data.findIndex(r => r.id === rowId);
        setLastSelectedIndex(rowIndex);
      } else {
        newSelection.delete(rowId);
      }

      return newSelection;
    });
  }, [mode, data, isRowSelectable, maxSelection]);

  const selectRows = useCallback((rowIds: string[], selected = true) => {
    if (mode === 'none') return;

    const validRowIds = rowIds.filter(rowId => {
      const row = data.find(r => r.id === rowId);
      return row && isRowSelectable(row);
    });

    if (validRowIds.length === 0) return;

    setSelectedRowIds(prev => {
      const newSelection = new Set(prev);

      if (selected) {
        if (mode === 'single') {
          newSelection.clear();
          if (validRowIds.length > 0) {
            newSelection.add(validRowIds[0]);
            const rowIndex = data.findIndex(r => r.id === validRowIds[0]);
            setLastSelectedIndex(rowIndex);
          }
        } else {
          validRowIds.forEach(rowId => {
            if (!maxSelection || newSelection.size < maxSelection) {
              newSelection.add(rowId);
            }
          });
          
          // Update last selected index
          const lastRowId = validRowIds[validRowIds.length - 1];
          const rowIndex = data.findIndex(r => r.id === lastRowId);
          setLastSelectedIndex(rowIndex);
        }
      } else {
        validRowIds.forEach(rowId => newSelection.delete(rowId));
      }

      return newSelection;
    });
  }, [mode, data, isRowSelectable, maxSelection]);

  const selectAllRows = useCallback((selected = true) => {
    if (mode === 'none') return;

    if (selected) {
      const selectableIds = selectableRows.map(row => row.id);
      const idsToSelect = maxSelection 
        ? selectableIds.slice(0, maxSelection)
        : selectableIds;
      
      setSelectedRowIds(new Set(idsToSelect));
    } else {
      setSelectedRowIds(new Set());
    }
    
    setLastSelectedIndex(-1);
  }, [mode, selectableRows, maxSelection]);

  const selectRange = useCallback((fromIndex: number, toIndex: number, selected = true) => {
    if (mode !== 'multiple') return;

    const startIndex = Math.min(fromIndex, toIndex);
    const endIndex = Math.max(fromIndex, toIndex);
    
    const rangeRowIds = data
      .slice(startIndex, endIndex + 1)
      .filter(row => isRowSelectable(row))
      .map(row => row.id);

    selectRows(rangeRowIds, selected);
  }, [mode, data, isRowSelectable, selectRows]);

  const toggleRowSelection = useCallback((rowId: string) => {
    const isSelected = selectedRowIds.has(rowId);
    selectRow(rowId, !isSelected);
  }, [selectedRowIds, selectRow]);

  const clearSelection = useCallback(() => {
    setSelectedRowIds(new Set());
    setLastSelectedIndex(-1);
    setFocusedRowIndex(-1);
  }, []);

  const isRowSelected = useCallback((rowId: string) => {
    return selectedRowIds.has(rowId);
  }, [selectedRowIds]);

  const getRowSelectable = useCallback((row: T) => {
    return isRowSelectable(row);
  }, [isRowSelectable]);

  // =============================================================================
  // Keyboard Navigation
  // =============================================================================

  const handleKeyboardSelection = useCallback((event: KeyboardEvent, currentRowIndex: number) => {
    if (mode === 'none') return false;

    const { key, shiftKey, ctrlKey, metaKey } = event;
    const modifierKey = ctrlKey || metaKey;

    switch (key) {
      case ' ': // Space - toggle selection
        event.preventDefault();
        if (currentRowIndex >= 0 && currentRowIndex < data.length) {
          const row = data[currentRowIndex];
          if (isRowSelectable(row)) {
            if (mode === 'multiple' && shiftKey && lastSelectedIndex >= 0) {
              // Range selection
              selectRange(lastSelectedIndex, currentRowIndex);
            } else {
              toggleRowSelection(row.id);
            }
          }
        }
        return true;

      case 'a': // Ctrl+A - select all
        if (modifierKey && mode === 'multiple') {
          event.preventDefault();
          selectAllRows(true);
          return true;
        }
        break;

      case 'Escape': // Escape - clear selection
        event.preventDefault();
        clearSelection();
        return true;

      case 'ArrowUp':
      case 'ArrowDown':
        if (mode === 'multiple' && shiftKey && lastSelectedIndex >= 0) {
          event.preventDefault();
          const direction = key === 'ArrowUp' ? -1 : 1;
          const newIndex = Math.max(0, Math.min(data.length - 1, currentRowIndex + direction));
          selectRange(lastSelectedIndex, newIndex);
          setFocusedRowIndex(newIndex);
          return true;
        }
        break;

      case 'Enter':
        if (currentRowIndex >= 0 && currentRowIndex < data.length) {
          const row = data[currentRowIndex];
          if (isRowSelectable(row)) {
            if (mode === 'single') {
              selectRow(row.id, true);
            } else if (mode === 'multiple' && modifierKey) {
              toggleRowSelection(row.id);
            }
            return true;
          }
        }
        break;
    }

    return false;
  }, [
    mode,
    data,
    lastSelectedIndex,
    isRowSelectable,
    toggleRowSelection,
    selectRange,
    selectAllRows,
    clearSelection,
    selectRow,
  ]);

  // =============================================================================
  // Mouse Selection Handlers
  // =============================================================================

  const handleRowClick = useCallback((rowId: string, rowIndex: number, event: MouseEvent) => {
    if (mode === 'none') return;

    const row = data.find(r => r.id === rowId);
    if (!row || !isRowSelectable(row)) return;

    const { shiftKey, ctrlKey, metaKey } = event;
    const modifierKey = ctrlKey || metaKey;

    if (mode === 'single') {
      selectRow(rowId, true);
    } else if (mode === 'multiple') {
      if (shiftKey && lastSelectedIndex >= 0) {
        // Range selection
        selectRange(lastSelectedIndex, rowIndex);
      } else if (modifierKey) {
        // Toggle selection
        toggleRowSelection(rowId);
      } else {
        // Single selection (clear others)
        setSelectedRowIds(new Set([rowId]));
        setLastSelectedIndex(rowIndex);
      }
    }

    setFocusedRowIndex(rowIndex);
  }, [
    mode,
    data,
    isRowSelectable,
    lastSelectedIndex,
    selectRow,
    selectRange,
    toggleRowSelection,
  ]);

  // =============================================================================
  // Touch/Mobile Selection Handlers
  // =============================================================================

  const handleLongPress = useCallback((rowId: string, rowIndex: number) => {
    if (mode === 'none') return;

    const row = data.find(r => r.id === rowId);
    if (!row || !isRowSelectable(row)) return;

    // On mobile, long press toggles selection
    toggleRowSelection(rowId);
    setFocusedRowIndex(rowIndex);
  }, [mode, data, isRowSelectable, toggleRowSelection]);

  // =============================================================================
  // Utility Methods
  // =============================================================================

  const getSelectionStats = useCallback(() => {
    const total = selectableRows.length;
    const selected = Array.from(selectedRowIds).filter(id => 
      selectableRowIds.has(id)
    ).length;
    
    return {
      total,
      selected,
      percentage: total > 0 ? Math.round((selected / total) * 100) : 0,
      hasSelection: selected > 0,
      isAllSelected: selected === total && total > 0,
      isPartiallySelected: selected > 0 && selected < total,
    };
  }, [selectableRows.length, selectedRowIds, selectableRowIds]);

  const canSelectMore = useCallback(() => {
    if (!maxSelection) return true;
    return selectedRowIds.size < maxSelection;
  }, [selectedRowIds.size, maxSelection]);

  const getRemainingSelections = useCallback(() => {
    if (!maxSelection) return Infinity;
    return Math.max(0, maxSelection - selectedRowIds.size);
  }, [maxSelection, selectedRowIds.size]);

  return {
    selectedRowIds,
    selectedRows,
    selectAll,
    selectRow,
    selectRows,
    selectAllRows,
    clearSelection,
    isRowSelected,
    isRowSelectable: getRowSelectable,
    handleKeyboardSelection,
    handleRowClick,
    handleLongPress,
    getSelectionStats,
    canSelectMore,
    getRemainingSelections,
    focusedRowIndex,
    setFocusedRowIndex,
  };
}