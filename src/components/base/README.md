# Base UI Components

This directory contains the comprehensive base UI component library for the Goal Assistant project. All components are built on top of shadcn/ui with enhanced features for ADHD-friendly design and gamification.

## Components Overview

### 🎯 Button Component
**Enhanced button with comprehensive features for all interactions**

- **File**: `Button.tsx`
- **Features**:
  - Loading states with custom text
  - Left/right icon support
  - Badge notifications
  - Multiple variants (success, warning, destructive)
  - Size variants (xs to xl) and icon-only modes
  - Border radius customization
  - Full-width support
  - Haptic feedback ready
  
- **Key Props**:
  ```typescript
  interface IButtonProps {
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning"
    size?: "xs" | "sm" | "default" | "lg" | "xl" | "icon" | "icon-sm" | "icon-lg" | "icon-xl"
    loading?: boolean
    loadingText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    badge?: number | string
    fullWidth?: boolean
    tooltip?: string
  }
  ```

### 📝 FormField Component
**Form field wrapper with validation and error states**

- **File**: `FormField.tsx`
- **Features**:
  - Visual validation states (error, success, warning, info)
  - Required field indicators
  - Loading states with spinner overlay
  - Helper text and descriptions
  - Works with any input component
  - Accessibility compliant with proper labeling

- **Key Props**:
  ```typescript
  interface IFormFieldProps {
    label?: string
    description?: string
    error?: string
    success?: string
    warning?: string
    info?: string
    required?: boolean
    loading?: boolean
    disabled?: boolean
  }
  ```

- **Helper Hook**:
  ```typescript
  const useFormFieldState = () => ({
    setError: (error: string) => void
    setSuccess: (success: string) => void
    setWarning: (warning: string) => void
    setLoading: (loading: boolean) => void
    clearState: () => void
  })
  ```

### 📊 DataCard Component
**Versatile data display card for metrics and information**

- **File**: `DataCard.tsx`
- **Features**:
  - Progress bar integration
  - Trend indicators with icons
  - Metadata display with icons
  - Action buttons with click handling
  - Menu button for additional options
  - Loading and error states
  - Interactive hover effects
  - Badge notifications

- **Key Props**:
  ```typescript
  interface IDataCardProps {
    title: string
    description?: string
    value?: string | number
    subtitle?: string
    progress?: number
    badge?: { text: string; variant?: BadgeVariant }
    trend?: { direction: "up" | "down"; value: string; label?: string }
    metadata?: Array<{ icon?: React.ReactNode; label: string; value: string }>
    actions?: Array<{ label: string; icon?: React.ReactNode; onClick: () => void }>
    interactive?: boolean
    loading?: boolean
    error?: string
  }
  ```

### 🏷️ StatusBadge Component
**Status indicators for goals, priorities, and progress**

- **File**: `StatusBadge.tsx`
- **Features**:
  - Predefined status types (active, completed, overdue, etc.)
  - Priority levels (low, medium, high, critical)
  - Progress states (not started, in progress, review)
  - Gamification statuses (streak, achievement, level up)
  - Automatic animations for attention-grabbing statuses
  - Helper functions for dynamic status determination

- **Status Types**:
  - **Goal Statuses**: active, completed, paused, cancelled, pending, overdue
  - **Priority Levels**: low, medium, high, critical
  - **Progress States**: notStarted, inProgress, review
  - **Gamification**: streak, achievement, levelUp

- **Helper Functions**:
  ```typescript
  getGoalStatus(goal): keyof typeof statusLabels
  getPriorityStatus(priority): keyof typeof statusLabels
  getProgressStatus(progress): keyof typeof statusLabels
  ```

### 📈 ProgressIndicator Component
**Advanced progress display with gamification features**

- **File**: `ProgressIndicator.tsx`
- **Features**:
  - Linear and circular progress bars
  - Milestone markers with labels
  - Gamification integration (level, XP, streaks, achievements)
  - Animation on mount and completion celebration
  - Progress gradients and custom colors
  - Accessibility compliant with proper ARIA attributes

- **Key Props**:
  ```typescript
  interface IProgressIndicatorProps {
    value: number
    max?: number
    label?: string
    showGamification?: boolean
    level?: number
    xp?: number
    nextLevelXp?: number
    streak?: number
    achievements?: number
    animateOnMount?: boolean
    celebrateOnComplete?: boolean
    milestones?: Array<{ value: number; label: string; icon?: React.ReactNode }>
  }
  ```

### ➕ QuickAddButton Component
**Floating action button for mobile quick actions**

- **File**: `QuickAddButton.tsx`
- **Features**:
  - Expandable action menu
  - Multiple positioning options
  - Haptic feedback support
  - Scroll-aware visibility
  - Notification badges
  - Customizable quick actions
  - Mobile-optimized design

- **Key Props**:
  ```typescript
  interface IQuickAddButtonProps {
    position?: "bottom-right" | "bottom-center" | "bottom-left" | "top-right"
    quickActions?: Array<{
      id: string
      label: string
      icon: React.ReactNode
      color?: string
      onClick: () => void
    }>
    notifications?: number
    hideOnScroll?: boolean
    vibrate?: boolean
  }
  ```

### 🔔 NotificationToast Component
**Comprehensive toast notification system**

- **File**: `NotificationToast.tsx`
- **Features**:
  - Multiple variants (success, error, warning, info, achievement)
  - Auto-dismiss with progress indicators
  - Hover-to-pause functionality
  - Action buttons for user interaction
  - Sound and haptic feedback
  - Persistent toasts for critical messages
  - Toast management hook and container

- **Key Components**:
  ```typescript
  // Main toast component
  <NotificationToast
    variant="success"
    title="Goal Completed!"
    description="Great job finishing your workout!"
    action={{ label: "Share", onClick: handleShare }}
    showProgress
    duration={5000}
  />
  
  // Toast management hook
  const toast = useToast()
  toast.success("Success!", "Operation completed")
  toast.error("Error!", "Something went wrong")
  toast.achievement("Level Up!", "You reached level 5!")
  
  // Container for positioning
  <ToastContainer position="top-right">
    {toast.toasts.map(({ id, props }) => (
      <NotificationToast key={id} {...props} />
    ))}
  </ToastContainer>
  ```

### ⏳ LoadingSpinner Component
**Comprehensive loading states and animations**

- **File**: `LoadingSpinner.tsx`
- **Features**:
  - Indeterminate and determinate loading
  - Multiple animation styles and speeds
  - Overlay and full-screen modes
  - Skeleton loaders for content placeholders
  - Pulse and dots loaders for variety
  - Accessibility compliant with proper labels

- **Additional Components**:
  ```typescript
  // Skeleton loader for content placeholders
  <SkeletonLoader lines={3} width={["100%", "75%", "50%"]} />
  
  // Pulse animation loader
  <PulseLoader size="default" variant="success" />
  
  // Bouncing dots loader
  <DotsLoader size="lg" variant="primary" />
  
  // Circular progress for determinate loading
  <CircularProgress value={75} size={120} />
  ```

## Design Principles

### 🎯 ADHD-Friendly Design
- **Clear Visual Hierarchy**: Strong contrast and obvious interactive elements
- **Immediate Feedback**: Loading states, hover effects, and confirmation messages
- **Reduced Cognitive Load**: Consistent patterns and predictable behavior
- **Dopamine Optimization**: Celebrations, achievements, and progress indicators

### 📱 Mobile-First Approach
- **Touch-Friendly**: Large tap targets and appropriate spacing
- **Responsive Design**: Adaptive layouts for all screen sizes
- **Performance Optimized**: Lightweight animations and efficient rendering
- **Gesture Support**: Swipe actions and haptic feedback

### ♿ Accessibility Excellence
- **WCAG 2.1 AA Compliance**: Proper contrast ratios and color usage
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Keyboard Navigation**: Focus management and keyboard shortcuts
- **Reduced Motion**: Respects user preferences for motion

### 🎮 Gamification Integration
- **Progress Visualization**: Clear progress indicators and milestone markers
- **Achievement System**: Badges, levels, and streak tracking
- **Immediate Rewards**: XP notifications and celebration animations
- **Social Elements**: Sharing capabilities and progress comparisons

## Usage Examples

### Basic Goal Progress Card
```tsx
import { DataCard, StatusBadge, ProgressIndicator } from '@/components/base'

<DataCard
  title="Morning Workout"
  description="30-minute cardio session"
  value="Completed"
  variant="success"
  progress={100}
  badge={{ text: "+15 XP", variant: "success" }}
  metadata={[
    { icon: <Clock />, label: "Duration", value: "32 min" },
    { icon: <Zap />, label: "Calories", value: "285" }
  ]}
  actions={[
    { label: "Share Achievement", onClick: handleShare }
  ]}
/>
```

### Interactive Form with Validation
```tsx
import { FormField, Button } from '@/components/base'
import { useFormFieldState } from '@/components/base'

const goalState = useFormFieldState()

<FormField
  label="Goal Title"
  required
  {...goalState}
>
  <Input
    value={goalTitle}
    onChange={handleTitleChange}
    placeholder="Enter your goal..."
  />
</FormField>

<Button
  onClick={handleSubmit}
  loading={isSubmitting}
  loadingText="Creating goal..."
  leftIcon={<Target />}
>
  Create Goal
</Button>
```

### Gamification Dashboard
```tsx
import { ProgressIndicator, StatusBadge, NotificationToast } from '@/components/base'

<ProgressIndicator
  value={currentXP}
  max={nextLevelXP}
  label="Level Progress"
  variant="gamified"
  showGamification
  level={userLevel}
  xp={currentXP}
  nextLevelXp={nextLevelXP}
  streak={currentStreak}
  achievements={totalAchievements}
  celebrateOnComplete
/>

<StatusBadge
  status="streak"
  count={currentStreak}
  customLabel="Daily Streak"
/>

{/* Achievement notification */}
<NotificationToast
  variant="achievement"
  title="Achievement Unlocked!"
  description="First Goal Completed!"
  icon={<Trophy />}
  action={{
    label: "View Badge",
    onClick: () => router.push('/achievements')
  }}
  duration={8000}
/>
```

## Testing

All components include comprehensive test suites covering:

- **Unit Tests**: Component rendering and prop handling
- **Interaction Tests**: User interactions and event handling
- **Accessibility Tests**: Screen reader support and keyboard navigation
- **Snapshot Tests**: Visual regression prevention
- **Integration Tests**: Component composition and data flow

### Running Tests
```bash
# Run all component tests
npm run test:unit

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Storybook

Each component has comprehensive Storybook stories demonstrating:

- **All Variants**: Every possible configuration and state
- **Interactive Examples**: Real-world usage scenarios
- **Mobile Views**: Responsive design examples
- **Accessibility Features**: Screen reader and keyboard navigation
- **Dark Mode Support**: Light and dark theme examples

### Running Storybook
```bash
# Start Storybook development server
npm run storybook

# Build Storybook for deployment
npm run build-storybook
```

## Best Practices

### Component Usage
1. **Import from Index**: Always import from `@/components/base` for consistency
2. **TypeScript First**: Use provided interfaces for proper type checking
3. **Accessibility**: Always provide proper labels and ARIA attributes
4. **Performance**: Use loading states for async operations
5. **Consistency**: Follow established patterns and naming conventions

### Styling
1. **Tailwind Classes**: Use utility classes for consistent spacing and colors
2. **CSS Variables**: Leverage design tokens for theme consistency
3. **Responsive Design**: Always consider mobile-first approach
4. **Dark Mode**: Ensure components work in both light and dark themes

### Testing
1. **Test User Interactions**: Focus on how users will interact with components
2. **Accessibility Testing**: Include screen reader and keyboard navigation tests
3. **Edge Cases**: Test loading states, error states, and empty states
4. **Snapshot Testing**: Catch visual regressions early

This component library provides the foundation for building consistent, accessible, and engaging user interfaces throughout the Goal Assistant application. Each component is designed with ADHD-friendly principles, mobile optimization, and comprehensive testing in mind.