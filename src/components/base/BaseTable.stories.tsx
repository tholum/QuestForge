import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';
import { Edit, Trash2, Eye, Star, Target, Calendar, User } from 'lucide-react';

import { BaseTable } from './BaseTable';
import { 
  TableData, 
  ColumnDef, 
  RowAction, 
  BulkAction,
  FilterOperator,
  SortDirection,
} from '@/types/table';

// =============================================================================
// Mock Data Types
// =============================================================================

interface Goal extends TableData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  progress: number;
  targetDate: string;
  createdAt: string;
  userId: string;
  userName: string;
  xp: number;
  achievements: number;
  category: string;
  estimatedHours: number;
}

interface User extends TableData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  totalXp: number;
  level: number;
  achievements: number;
  joinedAt: string;
  lastActive: string;
  completedGoals: number;
}

// =============================================================================
// Mock Data
// =============================================================================

const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Complete Morning Workout Routine',
    description: 'Establish a consistent 30-minute morning workout routine including cardio and strength training',
    status: 'active',
    priority: 'high',
    difficulty: 'medium',
    progress: 75,
    targetDate: '2024-01-15',
    createdAt: '2024-01-01',
    userId: 'user1',
    userName: 'John Doe',
    xp: 150,
    achievements: 3,
    category: 'Fitness',
    estimatedHours: 20,
  },
  {
    id: '2',
    title: 'Learn React Advanced Patterns',
    description: 'Master advanced React patterns including hooks, context, and performance optimization',
    status: 'active',
    priority: 'medium',
    difficulty: 'hard',
    progress: 45,
    targetDate: '2024-03-01',
    createdAt: '2024-01-05',
    userId: 'user2',
    userName: 'Jane Smith',
    xp: 280,
    achievements: 5,
    category: 'Learning',
    estimatedHours: 40,
  },
  {
    id: '3',
    title: 'Organize Home Office',
    description: 'Complete reorganization of home office space including filing system and equipment setup',
    status: 'completed',
    priority: 'low',
    difficulty: 'easy',
    progress: 100,
    targetDate: '2023-12-31',
    createdAt: '2023-12-15',
    userId: 'user1',
    userName: 'John Doe',
    xp: 75,
    achievements: 1,
    category: 'Home',
    estimatedHours: 8,
  },
  {
    id: '4',
    title: 'Read Bible Daily',
    description: 'Establish daily Bible reading habit with reflection and notes',
    status: 'active',
    priority: 'high',
    difficulty: 'medium',
    progress: 60,
    targetDate: '2024-12-31',
    createdAt: '2024-01-01',
    userId: 'user3',
    userName: 'Mike Johnson',
    xp: 200,
    achievements: 4,
    category: 'Spiritual',
    estimatedHours: 100,
  },
  {
    id: '5',
    title: 'Launch Side Project',
    description: 'Complete development and launch of personal portfolio website',
    status: 'paused',
    priority: 'medium',
    difficulty: 'expert',
    progress: 25,
    targetDate: '2024-06-01',
    createdAt: '2023-11-01',
    userId: 'user2',
    userName: 'Jane Smith',
    xp: 320,
    achievements: 2,
    category: 'Work',
    estimatedHours: 80,
  },
];

const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    status: 'active',
    totalXp: 1250,
    level: 8,
    achievements: 12,
    joinedAt: '2023-06-15',
    lastActive: '2024-01-10',
    completedGoals: 15,
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'admin',
    status: 'active',
    totalXp: 2100,
    level: 12,
    achievements: 18,
    joinedAt: '2023-03-22',
    lastActive: '2024-01-11',
    completedGoals: 28,
  },
  {
    id: 'user3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'moderator',
    status: 'active',
    totalXp: 890,
    level: 6,
    achievements: 8,
    joinedAt: '2023-09-10',
    lastActive: '2024-01-09',
    completedGoals: 11,
  },
];

// =============================================================================
// Column Definitions
// =============================================================================

const goalColumns: ColumnDef<Goal>[] = [
  {
    id: 'title',
    header: 'Goal Title',
    accessor: 'title',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 250,
    mobilePriority: 1,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 120,
    mobilePriority: 2,
    align: 'center',
  },
  {
    id: 'priority',
    header: 'Priority',
    accessor: 'priority',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 100,
    mobilePriority: 3,
    align: 'center',
  },
  {
    id: 'progress',
    header: 'Progress',
    accessor: 'progress',
    dataType: 'progress',
    sortable: true,
    width: 120,
    mobilePriority: 2,
  },
  {
    id: 'difficulty',
    header: 'Difficulty',
    accessor: 'difficulty',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 100,
    mobilePriority: 4,
  },
  {
    id: 'targetDate',
    header: 'Target Date',
    accessor: 'targetDate',
    dataType: 'date',
    sortable: true,
    filterable: true,
    width: 120,
    mobilePriority: 3,
  },
  {
    id: 'userName',
    header: 'Assigned To',
    accessor: 'userName',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 150,
    mobilePriority: 4,
  },
  {
    id: 'xp',
    header: 'XP Earned',
    accessor: 'xp',
    dataType: 'number',
    sortable: true,
    width: 100,
    mobilePriority: 5,
    align: 'right',
  },
  {
    id: 'category',
    header: 'Category',
    accessor: 'category',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 100,
    mobilePriority: 5,
  },
];

const userColumns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: 'name',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 200,
    mobilePriority: 1,
  },
  {
    id: 'email',
    header: 'Email',
    accessor: 'email',
    dataType: 'string',
    sortable: true,
    filterable: true,
    width: 250,
    mobilePriority: 3,
  },
  {
    id: 'role',
    header: 'Role',
    accessor: 'role',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 100,
    mobilePriority: 2,
  },
  {
    id: 'status',
    header: 'Status',
    accessor: 'status',
    dataType: 'badge',
    sortable: true,
    filterable: true,
    width: 100,
    mobilePriority: 2,
  },
  {
    id: 'level',
    header: 'Level',
    accessor: 'level',
    dataType: 'number',
    sortable: true,
    width: 80,
    mobilePriority: 3,
    align: 'center',
  },
  {
    id: 'totalXp',
    header: 'Total XP',
    accessor: 'totalXp',
    dataType: 'number',
    sortable: true,
    width: 100,
    mobilePriority: 4,
    align: 'right',
  },
  {
    id: 'achievements',
    header: 'Achievements',
    accessor: 'achievements',
    dataType: 'number',
    sortable: true,
    width: 120,
    mobilePriority: 4,
    align: 'center',
  },
  {
    id: 'completedGoals',
    header: 'Goals',
    accessor: 'completedGoals',
    dataType: 'number',
    sortable: true,
    width: 80,
    mobilePriority: 5,
    align: 'center',
  },
  {
    id: 'lastActive',
    header: 'Last Active',
    accessor: 'lastActive',
    dataType: 'date',
    sortable: true,
    width: 120,
    mobilePriority: 5,
  },
];

// =============================================================================
// Actions
// =============================================================================

const goalRowActions: RowAction<Goal>[] = [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4 mr-2" />,
    onClick: (row) => alert(`Viewing goal: ${row.title}`),
  },
  {
    id: 'edit',
    label: 'Edit Goal',
    icon: <Edit className="h-4 w-4 mr-2" />,
    onClick: (row) => alert(`Editing goal: ${row.title}`),
  },
  {
    id: 'delete',
    label: 'Delete Goal',
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    onClick: (row) => alert(`Deleting goal: ${row.title}`),
    destructive: true,
    requireConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete this goal?',
  },
];

const goalBulkActions: BulkAction<Goal>[] = [
  {
    id: 'bulk-complete',
    label: 'Mark as Completed',
    icon: <Target className="h-4 w-4 mr-2" />,
    onClick: (rows) => alert(`Marking ${rows.length} goals as completed`),
  },
  {
    id: 'bulk-delete',
    label: 'Delete Selected',
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    onClick: (rows) => alert(`Deleting ${rows.length} goals`),
    destructive: true,
    requireConfirmation: true,
    confirmationMessage: 'Are you sure you want to delete the selected goals?',
  },
];

// =============================================================================
// Story Meta
// =============================================================================

const meta: Meta<typeof BaseTable> = {
  title: 'Base/BaseTable',
  component: BaseTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BaseTable Component

A comprehensive, feature-rich data table component with advanced functionality for the Goal Assistant project.

## Features

- **Sorting**: Multi-column sorting with custom sort functions
- **Filtering**: Column filters, global search, and advanced filtering options
- **Pagination**: Client-side and server-side pagination with customizable page sizes
- **Selection**: Single and multi-row selection with bulk actions
- **Responsive Design**: Adaptive layouts (table → cards → list → compact views)
- **Accessibility**: Full keyboard navigation and WCAG compliance
- **Gamification**: XP display, achievement badges, and progress indicators
- **Export**: CSV, JSON, and Excel export functionality
- **ADHD-Friendly**: High contrast mode, focus management, and clear visual hierarchy

## Usage

The BaseTable component is designed to work with any data that extends the \`TableData\` interface (requires an \`id\` field).
Column definitions provide complete control over rendering, sorting, filtering, and responsive behavior.
        `,
      },
    },
  },
  argTypes: {
    data: {
      description: 'Array of data objects to display in the table',
      control: false,
    },
    columns: {
      description: 'Column definitions that control table structure and behavior',
      control: false,
    },
    loading: {
      description: 'Whether the table is in a loading state',
      control: 'boolean',
    },
    error: {
      description: 'Error message to display if data loading fails',
      control: 'text',
    },
    emptyMessage: {
      description: 'Message to show when there is no data',
      control: 'text',
    },
    title: {
      description: 'Table title displayed in the header',
      control: 'text',
    },
    description: {
      description: 'Table description displayed below the title',
      control: 'text',
    },
    size: {
      description: 'Size variant of the table',
      control: 'radio',
      options: ['sm', 'default', 'lg'],
    },
    bordered: {
      description: 'Whether the table has borders',
      control: 'boolean',
    },
    striped: {
      description: 'Whether table rows have alternating background colors',
      control: 'boolean',
    },
    hoverable: {
      description: 'Whether rows have hover effects',
      control: 'boolean',
    },
    stickyHeader: {
      description: 'Whether the table header is sticky',
      control: 'boolean',
    },
    highContrast: {
      description: 'Enable high contrast mode for accessibility',
      control: 'boolean',
    },
    keyboardNavigation: {
      description: 'Enable keyboard navigation support',
      control: 'boolean',
    },
    showXP: {
      description: 'Show XP indicators for gamification',
      control: 'boolean',
    },
    showAchievements: {
      description: 'Show achievement badges for gamification',
      control: 'boolean',
    },
    showProgress: {
      description: 'Show progress indicators',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof BaseTable>;

// =============================================================================
// Interactive Template
// =============================================================================

function InteractiveTable(args: any) {
  const [selectedRows, setSelectedRows] = useState<Goal[]>([]);

  return (
    <div className="p-4">
      <BaseTable
        {...args}
        onSelectionChange={setSelectedRows}
        onRowClick={(row, event) => {
          console.log('Row clicked:', row, event);
        }}
        onSortChange={(sorting) => {
          console.log('Sort changed:', sorting);
        }}
        onFilterChange={(filters) => {
          console.log('Filters changed:', filters);
        }}
        onPageChange={(page, pageSize) => {
          console.log('Page changed:', page, pageSize);
        }}
        onViewModeChange={(mode) => {
          console.log('View mode changed:', mode);
        }}
      />
      {selectedRows.length > 0 && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <h4 className="font-semibold mb-2">Selected Rows ({selectedRows.length}):</h4>
          <div className="text-sm space-y-1">
            {selectedRows.map(row => (
              <div key={row.id}>{row.title}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Stories
// =============================================================================

export const Default: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Goals Dashboard',
    description: 'Manage and track your personal goals with advanced filtering and sorting.',
    rowActions: goalRowActions,
    bulkActions: goalBulkActions,
    selection: { mode: 'multiple' },
    pagination: { pageSize: 5 },
  },
};

export const Loading: Story = {
  render: InteractiveTable,
  args: {
    data: [],
    columns: goalColumns,
    loading: true,
    title: 'Loading Goals...',
  },
};

export const Error: Story = {
  render: InteractiveTable,
  args: {
    data: [],
    columns: goalColumns,
    error: 'Failed to load goals. Please try again.',
    title: 'Goals Dashboard',
  },
};

export const Empty: Story = {
  render: InteractiveTable,
  args: {
    data: [],
    columns: goalColumns,
    emptyMessage: '🎯 No goals yet! Create your first goal to get started.',
    title: 'Goals Dashboard',
    description: 'Start your journey by creating meaningful goals.',
  },
};

export const SingleSelection: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Single Selection Mode',
    selection: { mode: 'single' },
    rowActions: goalRowActions,
  },
};

export const NoSelection: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Read-Only Table',
    description: 'Table without selection capabilities.',
    selection: { mode: 'none' },
  },
};

export const CompactSize: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Compact Table',
    size: 'sm',
    bordered: true,
    striped: true,
  },
};

export const LargeSize: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Large Table',
    size: 'lg',
    stickyHeader: true,
    maxHeight: '600px',
  },
};

export const HighContrast: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'High Contrast Mode',
    description: 'ADHD-friendly design with enhanced contrast.',
    highContrast: true,
    bordered: true,
    selection: { mode: 'multiple' },
    rowActions: goalRowActions,
  },
};

export const WithGamification: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Goals with Gamification',
    description: 'Track your progress with XP and achievements.',
    showXP: true,
    showAchievements: true,
    showProgress: true,
    selection: { mode: 'multiple' },
  },
};

export const UserManagement: Story = {
  render: (args: any) => {
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    
    return (
      <div className="p-4">
        <BaseTable
          {...args}
          data={mockUsers}
          columns={userColumns}
          onSelectionChange={setSelectedUsers}
        />
        {selectedUsers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Selected Users ({selectedUsers.length}):</h4>
            <div className="text-sm space-y-1">
              {selectedUsers.map(user => (
                <div key={user.id}>{user.name} - {user.email}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
  args: {
    title: 'User Management',
    description: 'Manage system users with roles and permissions.',
    selection: { mode: 'multiple' },
    pagination: { pageSize: 10 },
    showXP: true,
    showAchievements: true,
    rowActions: [
      {
        id: 'view-profile',
        label: 'View Profile',
        icon: <User className="h-4 w-4 mr-2" />,
        onClick: (row: User) => alert(`Viewing profile: ${row.name}`),
      },
      {
        id: 'edit-user',
        label: 'Edit User',
        icon: <Edit className="h-4 w-4 mr-2" />,
        onClick: (row: User) => alert(`Editing user: ${row.name}`),
      },
    ],
    bulkActions: [
      {
        id: 'activate-users',
        label: 'Activate Users',
        icon: <Star className="h-4 w-4 mr-2" />,
        onClick: (rows: User[]) => alert(`Activating ${rows.length} users`),
      },
    ],
  },
};

export const MobileResponsive: Story = {
  render: InteractiveTable,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    data: mockGoals.slice(0, 3),
    columns: goalColumns,
    title: 'Mobile View',
    description: 'Optimized for mobile devices with card layout.',
    selection: { mode: 'multiple' },
    initialViewMode: 'cards',
    responsive: true,
  },
};

export const CustomPagination: Story = {
  render: InteractiveTable,
  args: {
    data: [...mockGoals, ...mockGoals, ...mockGoals], // Triple the data
    columns: goalColumns,
    title: 'Large Dataset',
    description: 'Table with custom pagination settings.',
    pagination: {
      pageSize: 3,
      pageSizeOptions: [3, 5, 10, 20],
    },
    selection: { mode: 'multiple' },
  },
};

export const InitialFiltersAndSort: Story = {
  render: InteractiveTable,
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'Pre-filtered Goals',
    description: 'Table with initial sorting and filters applied.',
    initialSorting: [
      { columnId: 'priority', direction: 'desc' as SortDirection },
      { columnId: 'progress', direction: 'asc' as SortDirection },
    ],
    initialFilters: [
      {
        columnId: 'status',
        operator: 'equals' as FilterOperator,
        value: 'active',
        enabled: true,
      },
    ],
    selection: { mode: 'multiple' },
  },
};

export const AllViewModes: Story = {
  render: (args: any) => {
    const [viewMode, setViewMode] = useState<'table' | 'cards' | 'list' | 'compact'>('table');
    
    return (
      <div className="p-4">
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Cards
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-3 py-1 rounded text-sm ${viewMode === 'compact' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Compact
          </button>
        </div>
        <BaseTable
          {...args}
          initialViewMode={viewMode}
          key={viewMode} // Force re-render when view mode changes
        />
      </div>
    );
  },
  args: {
    data: mockGoals,
    columns: goalColumns,
    title: 'All View Modes',
    description: 'Switch between different table view modes.',
    selection: { mode: 'multiple' },
    showXP: true,
    showAchievements: true,
    showProgress: true,
    rowActions: goalRowActions,
  },
};