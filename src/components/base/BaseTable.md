# BaseTable Component

A comprehensive, feature-rich data table component designed for the Goal Assistant project with advanced functionality, mobile-first responsive design, and ADHD-friendly features.

## 🚀 Features

### Core Functionality
- **Sorting**: Multi-column sorting with custom sort functions
- **Filtering**: Column filters, global search, and advanced filtering options
- **Pagination**: Client-side and server-side pagination with customizable page sizes
- **Selection**: Single and multi-row selection with bulk actions
- **Export**: CSV, JSON, and Excel export functionality

### Responsive Design
- **Mobile-First**: Optimized for mobile devices with touch-friendly interactions
- **Adaptive Layouts**: Automatically switches between table, cards, list, and compact views
- **Column Priority**: Smart column hiding based on mobile priority settings
- **Touch Gestures**: Swipe actions and long-press selections

### Accessibility & ADHD-Friendly
- **WCAG 2.1 AA Compliance**: Full accessibility support with screen readers
- **Keyboard Navigation**: Complete keyboard control with intuitive shortcuts
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast Mode**: Enhanced contrast for better visibility
- **Reduced Motion**: Respects user preferences for animation

### Gamification Integration
- **XP Display**: Show experience points earned from actions
- **Achievement Badges**: Display user achievements and progress
- **Progress Indicators**: Visual progress bars and completion status
- **Status Badges**: Color-coded status indicators

## 📦 Installation

The BaseTable component is included in the base components library:

```typescript
import { BaseTable } from '@/components/base';
import type { BaseTableProps, ColumnDef, TableData } from '@/types/table';
```

## 🎯 Basic Usage

### Simple Table

```typescript
import { BaseTable } from '@/components/base';
import type { ColumnDef, TableData } from '@/types/table';

interface User extends TableData {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

const users: User[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
];

const columns: ColumnDef<User>[] = [
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
];

function UserTable() {
  return (
    <BaseTable
      data={users}
      columns={columns}
      title="User Management"
      description="Manage system users"
      selection={{ mode: 'multiple' }}
      pagination={{ pageSize: 10 }}
    />
  );
}
```

### Advanced Configuration

```typescript
import { BaseTable } from '@/components/base';
import { Edit, Trash2, Eye } from 'lucide-react';

const rowActions = [
  {
    id: 'view',
    label: 'View Details',
    icon: <Eye className="h-4 w-4 mr-2" />,
    onClick: (row) => console.log('Viewing:', row),
  },
  {
    id: 'edit',
    label: 'Edit User',
    icon: <Edit className="h-4 w-4 mr-2" />,
    onClick: (row) => console.log('Editing:', row),
  },
  {
    id: 'delete',
    label: 'Delete User',
    icon: <Trash2 className="h-4 w-4 mr-2" />,
    onClick: (row) => console.log('Deleting:', row),
    destructive: true,
    requireConfirmation: true,
  },
];

const bulkActions = [
  {
    id: 'activate',
    label: 'Activate Users',
    onClick: (rows) => console.log('Activating:', rows.length, 'users'),
  },
  {
    id: 'delete-bulk',
    label: 'Delete Selected',
    onClick: (rows) => console.log('Deleting:', rows.length, 'users'),
    destructive: true,
    requireConfirmation: true,
  },
];

function AdvancedUserTable() {
  return (
    <BaseTable
      data={users}
      columns={columns}
      title="Advanced User Management"
      description="Full-featured user management with actions"
      selection={{ mode: 'multiple' }}
      rowActions={rowActions}
      bulkActions={bulkActions}
      pagination={{ pageSize: 25 }}
      initialSorting={[
        { columnId: 'name', direction: 'asc' },
        { columnId: 'status', direction: 'desc' }
      ]}
      initialFilters={[
        { columnId: 'status', operator: 'equals', value: 'active', enabled: true }
      ]}
      showXP={true}
      showAchievements={true}
      showProgress={true}
      onSelectionChange={(selectedRows) => console.log('Selected:', selectedRows)}
      onRowClick={(row) => console.log('Row clicked:', row)}
      onSortChange={(sorting) => console.log('Sort changed:', sorting)}
      onFilterChange={(filters) => console.log('Filters changed:', filters)}
    />
  );
}
```

## 🔧 Column Definitions

Column definitions control how data is displayed, sorted, filtered, and rendered:

```typescript
interface ColumnDef<T extends TableData> {
  // Required
  id: string;                          // Unique identifier
  header: string | ReactNode;          // Column header
  accessor: keyof T | ((row: T) => any); // Data accessor

  // Display
  dataType?: ColumnDataType;           // Data type for rendering
  align?: 'left' | 'center' | 'right'; // Text alignment
  width?: string | number;             // Column width
  minWidth?: string | number;          // Minimum width
  maxWidth?: string | number;          // Maximum width

  // Functionality
  sortable?: boolean;                  // Enable sorting
  filterable?: boolean;                // Enable filtering
  resizable?: boolean;                 // Enable resizing
  pinned?: 'left' | 'right';          // Pin column

  // Mobile
  mobilePriority?: 1 | 2 | 3 | 4 | 5; // Mobile display priority (1 = always show)
  stickyOnMobile?: boolean;            // Sticky on mobile

  // Custom Renderers
  Cell?: React.ComponentType<CellProps<T>>;
  Header?: React.ComponentType<HeaderProps<T>>;
  Footer?: React.ComponentType<FooterProps<T>>;

  // Advanced
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  filterOperators?: FilterOperator[];
  FilterComponent?: React.ComponentType<ColumnFilterProps<T>>;
}
```

### Data Types

Built-in data types provide automatic rendering:

- `string` - Plain text
- `number` - Numeric values with right alignment
- `date` - Formatted dates
- `datetime` - Formatted date/time
- `boolean` - Check/X icons
- `currency` - Formatted currency values
- `percentage` - Percentage display
- `badge` - Status badges
- `progress` - Progress bars
- `actions` - Action buttons (non-sortable)
- `custom` - Custom cell renderer

### Mobile Priority

Control column visibility on mobile devices:

- `1` - Always visible (primary content)
- `2` - Hidden on phones, visible on tablets+
- `3` - Hidden on small tablets, visible on large tablets+
- `4` - Hidden on tablets, visible on desktop
- `5` - Desktop only (optional information)

## 🎨 View Modes

The BaseTable supports four responsive view modes:

### Table View (Default)
Traditional table layout with all columns visible. Best for desktop use.

### Cards View
Grid of cards showing data in a card format. Ideal for mobile devices and visual browsing.

### List View
Compact list format showing primary information. Good for mobile and quick scanning.

### Compact View
Dense table with limited columns. Maximizes data visibility in minimal space.

The component automatically suggests the best view mode based on screen size, but users can manually switch between modes.

## ⌨️ Keyboard Navigation

Full keyboard support for accessibility:

| Key Combination | Action |
|----------------|--------|
| `Tab` | Navigate between interactive elements |
| `↑/↓` | Navigate rows |
| `Space` | Toggle row selection |
| `Shift + Space` | Range selection (multi-select mode) |
| `Ctrl/Cmd + A` | Select all rows |
| `Escape` | Clear selection |
| `Enter` | Activate focused element |
| `Ctrl/Cmd + Click` | Toggle individual selection |
| `Shift + Click` | Range selection |

## 🎯 Selection Modes

### No Selection
```typescript
selection={{ mode: 'none' }}
```

### Single Selection
```typescript
selection={{ mode: 'single' }}
```

### Multiple Selection
```typescript
selection={{ 
  mode: 'multiple',
  maxSelection: 50, // Optional limit
  preserveSelectionAcrossPages: true, // Keep selection when paginating
  isRowSelectable: (row) => row.status === 'active' // Custom selectability
}}
```

## 📊 Sorting & Filtering

### Initial Sorting
```typescript
initialSorting={[
  { columnId: 'priority', direction: 'desc' },
  { columnId: 'name', direction: 'asc' }
]}
```

### Initial Filters
```typescript
initialFilters={[
  { 
    columnId: 'status', 
    operator: 'equals', 
    value: 'active', 
    enabled: true 
  },
  { 
    columnId: 'age', 
    operator: 'between', 
    value: [18, 65], 
    enabled: true 
  }
]}
```

### Filter Operators
- `equals` - Exact match
- `contains` - Text contains
- `startsWith` - Text starts with
- `endsWith` - Text ends with
- `greaterThan` - Numeric >
- `lessThan` - Numeric <
- `greaterThanOrEqual` - Numeric >=
- `lessThanOrEqual` - Numeric <=
- `between` - Numeric range
- `in` - Value in array
- `notIn` - Value not in array
- `isEmpty` - Empty/null values
- `isNotEmpty` - Non-empty values

## 🎮 Gamification Features

### XP Display
```typescript
showXP={true}
xpAccessor={(row) => row.xpEarned} // Custom XP accessor
```

### Achievement Badges
```typescript
showAchievements={true}
achievementAccessor={(row) => row.achievementCount}
```

### Progress Indicators
```typescript
showProgress={true}
progressAccessor={(row) => row.completionPercentage}
```

## 📱 Mobile Optimization

### Touch Interactions
- **Tap**: Select row (if selection enabled) or trigger row click
- **Long Press**: Toggle selection (mobile alternative to Ctrl+Click)
- **Swipe**: Reveal row actions (implementation pending)

### Responsive Breakpoints
- **Phone** (`< 768px`): Card or List view recommended
- **Tablet** (`768px - 1024px`): Table or Card view
- **Desktop** (`> 1024px`): Full table view with all features

### Mobile-Specific Features
- Larger touch targets (minimum 44px)
- Optimized pagination controls
- Simplified filter interface
- Context-aware action menus

## 🎨 Styling & Theming

### Size Variants
```typescript
size="sm"     // Compact spacing
size="default" // Standard spacing
size="lg"     // Generous spacing
```

### Visual Options
```typescript
bordered={true}        // Add borders
striped={true}         // Alternating row colors
hoverable={true}       // Hover effects
stickyHeader={true}    // Sticky table header
highContrast={true}    // ADHD-friendly high contrast
```

### ADHD-Friendly Features
```typescript
highContrast={true}           // Enhanced contrast ratios
reducedMotion={true}          // Minimize animations
focusManagement={true}        // Clear focus indicators
highlightFocusedRow={true}    // Row highlighting
keyboardNavigation={true}     // Full keyboard support
```

## 📤 Export Functionality

### Basic Export
```typescript
// Automatic export buttons in table header
// Supports CSV, JSON, Excel formats
```

### Custom Export Configuration
```typescript
exportConfig={{
  formats: ['csv', 'json', 'xlsx'],
  filename: 'user-export',
  columns: ['name', 'email', 'status'], // Specific columns
  selectedRowsOnly: true, // Only selected data
  transformData: (data) => data.map(row => ({
    ...row,
    status: row.status.toUpperCase()
  }))
}}
```

## 🔄 Server-Side Operations

For large datasets, enable server-side processing:

```typescript
function ServerSideTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);

  const handleDataChange = async (page, pageSize, sorting, filters, search) => {
    setLoading(true);
    try {
      const response = await fetchData({
        page,
        pageSize,
        sorting,
        filters,
        search
      });
      setData(response.data);
      setTotalItems(response.total);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseTable
      data={data}
      columns={columns}
      loading={loading}
      pagination={{
        serverSide: true,
        totalItems,
        page: 0,
        pageSize: 25
      }}
      onPageChange={handleDataChange}
      onSortChange={handleDataChange}
      onFilterChange={handleDataChange}
    />
  );
}
```

## 🎯 Event Handlers

The BaseTable provides comprehensive event handling:

```typescript
<BaseTable
  // Selection events
  onSelectionChange={(selectedRows) => console.log('Selection:', selectedRows)}
  
  // Row interaction events
  onRowClick={(row, event) => console.log('Row clicked:', row)}
  onRowDoubleClick={(row, event) => console.log('Row double-clicked:', row)}
  onCellClick={(row, column, event) => console.log('Cell clicked:', row, column)}
  
  // Data manipulation events
  onSortChange={(sorting) => console.log('Sorting changed:', sorting)}
  onFilterChange={(filters) => console.log('Filters changed:', filters)}
  onPageChange={(page, pageSize) => console.log('Page changed:', page, pageSize)}
  
  // View events
  onViewModeChange={(mode) => console.log('View mode:', mode)}
  onColumnVisibilityChange={(columnId, visible) => console.log('Column visibility:', columnId, visible)}
  onColumnOrderChange={(columnIds) => console.log('Column order:', columnIds)}
  onColumnResize={(columnId, width) => console.log('Column resized:', columnId, width)}
/>
```

## ⚡ Performance Optimization

### Virtual Scrolling (Implementation Pending)
For very large datasets:

```typescript
virtualScrolling={{
  enabled: true,
  estimatedRowHeight: 50,
  overscan: 10
}}
```

### Optimization Tips
- Use `useMemo` for computed column definitions
- Implement server-side pagination for large datasets
- Use `useCallback` for event handlers to prevent unnecessary re-renders
- Consider data virtualization for 10,000+ rows

## 🧪 Testing

The BaseTable includes comprehensive test coverage:

```typescript
// Run tests
npm run test BaseTable

// Test specific functionality
npm run test BaseTable -- --grep "sorting"
npm run test BaseTable -- --grep "selection"
npm run test BaseTable -- --grep "accessibility"
```

### Test Categories
- **Unit Tests**: Component functionality
- **Integration Tests**: Feature interactions
- **Accessibility Tests**: WCAG compliance
- **Performance Tests**: Large dataset handling
- **Mobile Tests**: Touch interactions

## 🎯 Best Practices

### Column Definitions
- Always provide `mobilePriority` for responsive behavior
- Use appropriate `dataType` for automatic formatting
- Implement custom `sortFn` for complex sorting logic
- Keep column IDs descriptive and stable

### Performance
- Implement server-side pagination for >1000 rows
- Use `useMemo` for expensive computations
- Minimize re-renders with stable references
- Consider virtual scrolling for very large datasets

### Accessibility
- Always provide meaningful `title` and `description`
- Use semantic column headers
- Implement proper ARIA labels for actions
- Test with keyboard navigation
- Verify screen reader compatibility

### Mobile Experience
- Set appropriate `mobilePriority` on columns
- Test on actual devices, not just browser dev tools
- Consider simplified interactions for complex actions
- Provide alternative access to hidden information

### ADHD-Friendly Design
- Use clear, consistent visual hierarchy
- Provide immediate feedback for all actions
- Minimize cognitive load with progressive disclosure
- Offer customization options (contrast, animations)

## 🔮 Roadmap

Features planned for future releases:

### Phase 1 (Pending)
- [ ] Column resizing and reordering with drag-and-drop
- [ ] Enhanced row actions with custom dropdown menus
- [ ] Virtual scrolling for large datasets
- [ ] Advanced export options (PDF, print)
- [ ] Enhanced ADHD-friendly features

### Phase 2 (Future)
- [ ] Data visualization integration
- [ ] Advanced filtering UI with date pickers
- [ ] Inline editing capabilities
- [ ] Advanced keyboard shortcuts
- [ ] Column grouping and hierarchical headers
- [ ] Custom cell editors
- [ ] Data validation and error states

### Phase 3 (Future)
- [ ] Real-time data updates
- [ ] Collaborative features
- [ ] Advanced analytics integration
- [ ] Plugin system for custom extensions

## 📚 Examples

See the comprehensive Storybook stories for interactive examples:
- Basic usage scenarios
- Advanced configurations
- Mobile responsive examples
- Accessibility demonstrations
- Performance testing with large datasets

## 🤝 Contributing

When contributing to the BaseTable component:

1. Follow existing TypeScript patterns
2. Add comprehensive tests for new features
3. Update Storybook stories
4. Verify accessibility compliance
5. Test on mobile devices
6. Update documentation

## 📄 License

This component is part of the Goal Assistant project and follows the project's licensing terms.

---

*Built with ❤️ for the Goal Assistant project - helping individuals with ADHD achieve their goals through intuitive, accessible technology.*