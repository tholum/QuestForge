import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { BaseTable } from './BaseTable';
import { TableData, ColumnDef, RowAction } from '@/types/table';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// =============================================================================
// Test Data and Setup
// =============================================================================

interface TestData extends TableData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  age: number;
  joinDate: string;
  progress: number;
}

const mockData: TestData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    age: 30,
    joinDate: '2023-01-15',
    progress: 75,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    status: 'inactive',
    age: 25,
    joinDate: '2023-06-20',
    progress: 45,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    status: 'active',
    age: 35,
    joinDate: '2022-12-01',
    progress: 90,
  },
];

const mockColumns: ColumnDef<TestData>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    sortable: true,
    filterable: true,
    mobilePriority: 1,
  },
  {
    id: 'email',
    header: 'Email',
    accessor: 'email',
    sortable: true,
    filterable: true,
    mobilePriority: 2,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    mobilePriority: 2,
  },
  {
    id: 'age',
    header: 'Age',
    accessor: 'age',
    dataType: 'number',
    sortable: true,
    filterable: true,
    align: 'center',
    mobilePriority: 3,
  },
  {
    id: 'progress',
    header: 'Progress',
    accessor: 'progress',
    dataType: 'progress',
    sortable: true,
    mobilePriority: 2,
  },
  {
    id: 'joinDate',
    header: 'Join Date',
    accessor: 'joinDate',
    dataType: 'date',
    sortable: true,
    filterable: true,
    mobilePriority: 4,
  },
];

const mockRowActions: RowAction<TestData>[] = [
  {
    id: 'edit',
    label: 'Edit',
    onClick: vi.fn(),
  },
  {
    id: 'delete',
    label: 'Delete',
    onClick: vi.fn(),
    destructive: true,
  },
];

const defaultProps = {
  data: mockData,
  columns: mockColumns,
  testId: 'test-table',
};

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe('BaseTable - Basic Rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data correctly', () => {
    render(<BaseTable {...defaultProps} />);
    
    // Check if table exists
    expect(screen.getByTestId('test-table')).toBeInTheDocument();
    
    // Check if headers are rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check if data is rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders empty state when no data provided', () => {
    render(
      <BaseTable
        {...defaultProps}
        data={[]}
        emptyMessage="No data available"
      />
    );
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<BaseTable {...defaultProps} loading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <BaseTable
        {...defaultProps}
        error="Something went wrong"
        data={[]}
      />
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders with title and description', () => {
    render(
      <BaseTable
        {...defaultProps}
        title="User Management"
        description="Manage system users"
      />
    );
    
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Manage system users')).toBeInTheDocument();
  });
});

// =============================================================================
// Sorting Tests
// =============================================================================

describe('BaseTable - Sorting', () => {
  it('sorts data when column header is clicked', async () => {
    const user = userEvent.setup();
    render(<BaseTable {...defaultProps} />);
    
    // Click on Name column to sort
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    // Check if data is sorted (should see Bob first when sorted ascending)
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1]; // Skip header row
    expect(within(firstDataRow).getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('toggles sort direction on repeated clicks', async () => {
    const user = userEvent.setup();
    const onSortChange = vi.fn();
    render(<BaseTable {...defaultProps} onSortChange={onSortChange} />);
    
    const nameHeader = screen.getByText('Name');
    
    // First click - ascending
    await user.click(nameHeader);
    expect(onSortChange).toHaveBeenCalledWith([
      { columnId: 'name', direction: 'asc' }
    ]);
    
    // Second click - descending
    await user.click(nameHeader);
    expect(onSortChange).toHaveBeenCalledWith([
      { columnId: 'name', direction: 'desc' }
    ]);
  });

  it('shows sort indicators', async () => {
    const user = userEvent.setup();
    render(<BaseTable {...defaultProps} />);
    
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    // Should show sort indicator (chevron up for ascending)
    expect(screen.getByTestId('sort-indicator')).toBeInTheDocument();
  });
});

// =============================================================================
// Filtering Tests
// =============================================================================

describe('BaseTable - Filtering', () => {
  it('filters data with global search', async () => {
    const user = userEvent.setup();
    render(<BaseTable {...defaultProps} />);
    
    // Type in search box
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'john');
    
    // Should only show John Doe and Bob Johnson
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });

  it('shows filter count when filters are applied', async () => {
    const user = userEvent.setup();
    render(<BaseTable {...defaultProps} />);
    
    // Apply a search filter
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'active');
    
    // Check if filter button shows count
    await waitFor(() => {
      const filterButton = screen.getByText('Filters');
      expect(filterButton).toBeInTheDocument();
    });
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<BaseTable {...defaultProps} />);
    
    // Apply filter
    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'john');
    
    // Clear search
    await user.clear(searchInput);
    
    // All data should be visible again
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Pagination Tests
// =============================================================================

describe('BaseTable - Pagination', () => {
  const largeDataset = Array.from({ length: 25 }, (_, i) => ({
    id: `${i + 1}`,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    status: 'active' as const,
    age: 20 + (i % 40),
    joinDate: '2023-01-01',
    progress: (i * 4) % 100,
  }));

  it('shows pagination controls when data exceeds page size', () => {
    render(
      <BaseTable
        data={largeDataset}
        columns={mockColumns}
        pagination={{ pageSize: 10 }}
      />
    );
    
    // Should show pagination controls
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
  });

  it('navigates between pages', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    
    render(
      <BaseTable
        data={largeDataset}
        columns={mockColumns}
        pagination={{ pageSize: 10 }}
        onPageChange={onPageChange}
      />
    );
    
    // Click next page
    const nextButton = screen.getByRole('button', { name: /next page/i });
    await user.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(1, 10);
  });

  it('changes page size', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        data={largeDataset}
        columns={mockColumns}
        pagination={{ pageSize: 10 }}
      />
    );
    
    // Open page size selector
    const pageSizeSelect = screen.getByDisplayValue('10');
    await user.click(pageSizeSelect);
    
    // Select 25 items per page
    const option25 = screen.getByText('25');
    await user.click(option25);
    
    // Should show more items now
    expect(screen.getByText('User 15')).toBeInTheDocument();
    expect(screen.getByText('User 25')).toBeInTheDocument();
  });

  it('shows correct pagination info', () => {
    render(
      <BaseTable
        data={largeDataset}
        columns={mockColumns}
        pagination={{ pageSize: 10 }}
      />
    );
    
    // Should show "Showing 1 to 10 of 25 results"
    expect(screen.getByText(/showing 1 to 10 of 25/i)).toBeInTheDocument();
  });
});

// =============================================================================
// Selection Tests
// =============================================================================

describe('BaseTable - Selection', () => {
  it('renders checkboxes when selection is enabled', () => {
    render(
      <BaseTable
        {...defaultProps}
        selection={{ mode: 'multiple' }}
      />
    );
    
    // Should have checkboxes for each row plus header
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(4); // 3 data rows + 1 header
  });

  it('selects individual rows', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    
    render(
      <BaseTable
        {...defaultProps}
        selection={{ mode: 'multiple' }}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // Click first row checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Skip header checkbox
    
    expect(onSelectionChange).toHaveBeenCalledWith([mockData[0]]);
  });

  it('selects all rows with header checkbox', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    
    render(
      <BaseTable
        {...defaultProps}
        selection={{ mode: 'multiple' }}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // Click header checkbox
    const headerCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(headerCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(mockData);
  });

  it('handles single selection mode', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    
    render(
      <BaseTable
        {...defaultProps}
        selection={{ mode: 'single' }}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // Click first row checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    
    // Click second row checkbox
    await user.click(checkboxes[1]);
    
    // Should only have the second row selected
    const lastCall = onSelectionChange.mock.calls[onSelectionChange.mock.calls.length - 1];
    expect(lastCall[0]).toHaveLength(1);
    expect(lastCall[0][0].id).toBe('2');
  });

  it('shows bulk actions when rows are selected', async () => {
    const user = userEvent.setup();
    const bulkActions = [
      {
        id: 'delete-bulk',
        label: 'Delete Selected',
        onClick: vi.fn(),
      },
    ];
    
    render(
      <BaseTable
        {...defaultProps}
        selection={{ mode: 'multiple' }}
        bulkActions={bulkActions}
      />
    );
    
    // Select a row
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    
    // Should show bulk actions
    await waitFor(() => {
      expect(screen.getByText('1 selected')).toBeInTheDocument();
      expect(screen.getByText('Delete Selected')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// Row Actions Tests
// =============================================================================

describe('BaseTable - Row Actions', () => {
  it('renders row action buttons', () => {
    render(
      <BaseTable
        {...defaultProps}
        rowActions={mockRowActions}
      />
    );
    
    // Should have action buttons for each row
    const actionButtons = screen.getAllByRole('button', { name: /open menu/i });
    expect(actionButtons).toHaveLength(3);
  });

  it('opens action menu on button click', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        {...defaultProps}
        rowActions={mockRowActions}
      />
    );
    
    // Click first action button
    const actionButton = screen.getAllByRole('button', { name: /open menu/i })[0];
    await user.click(actionButton);
    
    // Should show action menu
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('executes action when menu item is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        {...defaultProps}
        rowActions={mockRowActions}
      />
    );
    
    // Open action menu and click edit
    const actionButton = screen.getAllByRole('button', { name: /open menu/i })[0];
    await user.click(actionButton);
    
    const editAction = screen.getByText('Edit');
    await user.click(editAction);
    
    expect(mockRowActions[0].onClick).toHaveBeenCalledWith(
      mockData[0],
      expect.any(Object)
    );
  });
});

// =============================================================================
// View Mode Tests
// =============================================================================

describe('BaseTable - View Modes', () => {
  it('renders table view by default', () => {
    render(<BaseTable {...defaultProps} />);
    
    // Should render as table
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('switches to card view', async () => {
    const user = userEvent.setup();
    
    render(<BaseTable {...defaultProps} responsive={true} />);
    
    // Open view mode menu
    const viewModeButton = screen.getByRole('button', { name: /view mode/i });
    await user.click(viewModeButton);
    
    // Select cards view
    const cardView = screen.getByText('Cards');
    await user.click(cardView);
    
    // Should no longer show table
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    
    // Should show cards
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onViewModeChange when view mode changes', async () => {
    const user = userEvent.setup();
    const onViewModeChange = vi.fn();
    
    render(
      <BaseTable
        {...defaultProps}
        responsive={true}
        onViewModeChange={onViewModeChange}
      />
    );
    
    // Change to cards view
    const viewModeButton = screen.getByRole('button', { name: /view mode/i });
    await user.click(viewModeButton);
    
    const cardView = screen.getByText('Cards');
    await user.click(cardView);
    
    expect(onViewModeChange).toHaveBeenCalledWith('cards');
  });
});

// =============================================================================
// Keyboard Navigation Tests
// =============================================================================

describe('BaseTable - Keyboard Navigation', () => {
  it('handles keyboard navigation when enabled', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        {...defaultProps}
        keyboardNavigation={true}
        selection={{ mode: 'multiple' }}
      />
    );
    
    const table = screen.getByTestId('test-table');
    table.focus();
    
    // Test Ctrl+A for select all
    await user.keyboard('{Control>}a{/Control}');
    
    // All checkboxes should be checked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked();
    });
  });

  it('handles escape key to clear selection', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        {...defaultProps}
        keyboardNavigation={true}
        selection={{ mode: 'multiple' }}
      />
    );
    
    const table = screen.getByTestId('test-table');
    
    // Select all first
    table.focus();
    await user.keyboard('{Control>}a{/Control}');
    
    // Then clear with escape
    await user.keyboard('{Escape}');
    
    // All checkboxes should be unchecked
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).not.toBeChecked();
    });
  });
});

// =============================================================================
// Accessibility Tests
// =============================================================================

describe('BaseTable - Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<BaseTable {...defaultProps} />);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    render(
      <BaseTable
        {...defaultProps}
        title="User Management Table"
        selection={{ mode: 'multiple' }}
      />
    );
    
    const table = screen.getByTestId('test-table');
    expect(table).toHaveAttribute('role', 'region');
    expect(table).toHaveAttribute('aria-label', 'User Management Table');
    
    // Checkboxes should have proper labels
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[1]).toHaveAttribute('aria-label', 'Select row 1');
  });

  it('supports keyboard navigation', () => {
    render(
      <BaseTable
        {...defaultProps}
        keyboardNavigation={true}
      />
    );
    
    const table = screen.getByTestId('test-table');
    expect(table).toHaveAttribute('tabIndex', '0');
  });

  it('has proper focus management', async () => {
    const user = userEvent.setup();
    
    render(
      <BaseTable
        {...defaultProps}
        highlightFocusedRow={true}
      />
    );
    
    const table = screen.getByTestId('test-table');
    await user.click(table);
    
    expect(table).toHaveFocus();
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('BaseTable - Performance', () => {
  it('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: 'active' as const,
      age: 20 + (i % 40),
      joinDate: '2023-01-01',
      progress: (i * 4) % 100,
    }));
    
    const startTime = performance.now();
    
    render(
      <BaseTable
        data={largeDataset}
        columns={mockColumns}
        pagination={{ pageSize: 50 }}
      />
    );
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within reasonable time (less than 100ms)
    expect(renderTime).toBeLessThan(100);
  });

  it('re-renders efficiently when data changes', () => {
    const { rerender } = render(<BaseTable {...defaultProps} />);
    
    const updatedData = [...mockData, {
      id: '4',
      name: 'Alice Brown',
      email: 'alice@example.com',
      status: 'active' as const,
      age: 28,
      joinDate: '2023-12-01',
      progress: 60,
    }];
    
    const startTime = performance.now();
    
    rerender(
      <BaseTable
        {...defaultProps}
        data={updatedData}
      />
    );
    
    const endTime = performance.now();
    const rerenderTime = endTime - startTime;
    
    // Should re-render quickly
    expect(rerenderTime).toBeLessThan(50);
    
    // Should show new data
    expect(screen.getByText('Alice Brown')).toBeInTheDocument();
  });
});

// =============================================================================
// Export Functionality Tests
// =============================================================================

describe('BaseTable - Export', () => {
  // Mock URL.createObjectURL for export tests
  beforeEach(() => {
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock HTML elements
    const mockLink = {
      click: vi.fn(),
      setAttribute: vi.fn(),
      style: {},
    } as any;
    
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') return mockLink;
      return document.createElement(tagName);
    });
    
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows export options', async () => {
    const user = userEvent.setup();
    
    render(<BaseTable {...defaultProps} />);
    
    // Click export button
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    // Should show export options
    expect(screen.getByText('CSV Format')).toBeInTheDocument();
    expect(screen.getByText('JSON Format')).toBeInTheDocument();
  });

  it('triggers CSV export when option is selected', async () => {
    const user = userEvent.setup();
    
    render(<BaseTable {...defaultProps} />);
    
    // Open export menu and select CSV
    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);
    
    const csvOption = screen.getByText('CSV Format');
    await user.click(csvOption);
    
    // Should have created and clicked download link
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });
});