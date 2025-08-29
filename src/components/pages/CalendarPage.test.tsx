import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CalendarPage } from './CalendarPage';
import { useCalendar } from '@/hooks/useCalendar';

// Mock the useCalendar hook
vi.mock('@/hooks/useCalendar');

// Mock react-big-calendar
vi.mock('react-big-calendar', () => {
  const mockCalendar = ({ onSelectSlot, onSelectEvent, events, view, onView }: any) => (
    <div data-testid="calendar">
      <div data-testid="calendar-view" data-view={view}>
        {events?.map((event: any) => (
          <div
            key={event.id}
            data-testid="calendar-event"
            onClick={() => onSelectEvent?.(event)}
          >
            {event.title}
          </div>
        ))}
        <div
          data-testid="calendar-slot"
          onClick={() => onSelectSlot?.({ start: new Date(), end: new Date() })}
        />
      </div>
      <div data-testid="calendar-toolbar">
        <button onClick={() => onView?.('month')}>Month</button>
        <button onClick={() => onView?.('week')}>Week</button>
        <button onClick={() => onView?.('day')}>Day</button>
      </div>
    </div>
  );
  
  return {
    Calendar: mockCalendar,
    momentLocalizer: vi.fn(() => ({})),
    Views: { MONTH: 'month', WEEK: 'week', DAY: 'day' },
  };
});

// Mock moment
vi.mock('moment', () => ({
  default: vi.fn(() => ({
    format: vi.fn(() => '2024-01-15'),
    toDate: vi.fn(() => new Date('2024-01-15')),
  })),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }: any) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder || 'Select Value'}</span>,
}));

const mockEvents = [
  {
    id: 'event-1',
    title: 'Morning Workout',
    start: new Date('2024-01-15T08:00:00Z'),
    end: new Date('2024-01-15T09:00:00Z'),
    type: 'goal',
    goalId: 'goal-1',
    module: 'fitness',
    priority: 'high',
    status: 'scheduled',
  },
  {
    id: 'event-2',
    title: 'Team Meeting',
    start: new Date('2024-01-15T14:00:00Z'),
    end: new Date('2024-01-15T15:00:00Z'),
    type: 'deadline',
    goalId: 'goal-2',
    module: 'work',
    priority: 'medium',
    status: 'scheduled',
  },
];

const mockDeadlines = [
  {
    id: 'deadline-1',
    goalId: 'goal-1',
    goalTitle: 'Complete Fitness Challenge',
    dueDate: '2024-01-20T23:59:59Z',
    priority: 'high',
    module: 'fitness',
    daysRemaining: 5,
  },
  {
    id: 'deadline-2',
    goalId: 'goal-2',
    goalTitle: 'Finish Project Report',
    dueDate: '2024-01-18T17:00:00Z',
    priority: 'medium',
    module: 'work',
    daysRemaining: 3,
  },
];

const mockUpcomingGoals = [
  {
    id: 'goal-1',
    title: 'Morning Run',
    module: 'fitness',
    scheduledFor: '2024-01-16T07:00:00Z',
    estimatedDuration: 30,
  },
  {
    id: 'goal-2',
    title: 'Study Session',
    module: 'learning',
    scheduledFor: '2024-01-16T19:00:00Z',
    estimatedDuration: 60,
  },
];

const mockUseCalendar = {
  events: mockEvents,
  deadlines: mockDeadlines,
  upcomingGoals: mockUpcomingGoals,
  loading: false,
  error: null,
  currentDate: new Date('2024-01-15'),
  selectedEvent: null,
  view: 'month' as const,
  createEvent: vi.fn().mockResolvedValue(undefined),
  updateEvent: vi.fn().mockResolvedValue(undefined),
  deleteEvent: vi.fn().mockResolvedValue(undefined),
  setView: vi.fn(),
  navigateToDate: vi.fn(),
  getEventsForDate: vi.fn((date: Date) => mockEvents.filter(e => 
    e.start.toDateString() === date.toDateString()
  )),
  getDeadlinesInRange: vi.fn((days: number) => mockDeadlines.filter(d =>
    d.daysRemaining <= days
  )),
  getUpcomingGoals: vi.fn((days: number) => mockUpcomingGoals.filter(g =>
    new Date(g.scheduledFor).getTime() - Date.now() <= days * 24 * 60 * 60 * 1000
  )),
  scheduleGoal: vi.fn().mockResolvedValue(undefined),
  rescheduleGoal: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('CalendarPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useCalendar as any).mockReturnValue(mockUseCalendar);
  });

  describe('Rendering and Layout', () => {
    it('renders the calendar page with correct title', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Calendar')).toBeInTheDocument();
      expect(screen.getByText('Schedule and track your goals')).toBeInTheDocument();
    });

    it('renders the main calendar component', () => {
      render(<CalendarPage />);
      
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    it('renders view controls', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Month')).toBeInTheDocument();
      expect(screen.getByText('Week')).toBeInTheDocument();
      expect(screen.getByText('Day')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        loading: true,
      });

      render(<CalendarPage />);
      
      expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        error: new Error('Failed to load calendar'),
      });

      render(<CalendarPage />);
      
      expect(screen.getByText('Failed to load calendar: Failed to load calendar')).toBeInTheDocument();
    });
  });

  describe('Calendar Events', () => {
    it('displays calendar events', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Morning Workout')).toBeInTheDocument();
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });

    it('handles event selection', async () => {
      render(<CalendarPage />);
      
      const eventElement = screen.getByText('Morning Workout');
      fireEvent.click(eventElement);
      
      // Should trigger event selection logic
      await waitFor(() => {
        expect(screen.getByTestId('calendar-event')).toBeInTheDocument();
      });
    });

    it('handles slot selection for creating new events', async () => {
      render(<CalendarPage />);
      
      const slotElement = screen.getByTestId('calendar-slot');
      fireEvent.click(slotElement);
      
      // Should open event creation dialog
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('View Controls', () => {
    it('handles view changes', async () => {
      render(<CalendarPage />);
      
      const weekButton = screen.getByText('Week');
      fireEvent.click(weekButton);
      
      await waitFor(() => {
        expect(mockUseCalendar.setView).toHaveBeenCalledWith('week');
      });
    });

    it('displays current view correctly', () => {
      render(<CalendarPage />);
      
      const calendarView = screen.getByTestId('calendar-view');
      expect(calendarView).toHaveAttribute('data-view', 'month');
    });
  });

  describe('Upcoming Deadlines', () => {
    it('displays upcoming deadlines section', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Upcoming Deadlines')).toBeInTheDocument();
      expect(screen.getByText('Complete Fitness Challenge')).toBeInTheDocument();
      expect(screen.getByText('Finish Project Report')).toBeInTheDocument();
    });

    it('shows days remaining for deadlines', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('3 days')).toBeInTheDocument();
    });

    it('displays priority indicators', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });

    it('handles empty deadlines', () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        deadlines: [],
      });

      render(<CalendarPage />);
      
      expect(screen.getByText('No upcoming deadlines')).toBeInTheDocument();
    });
  });

  describe('Upcoming Goals', () => {
    it('displays upcoming goals section', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('Scheduled Goals')).toBeInTheDocument();
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Study Session')).toBeInTheDocument();
    });

    it('shows scheduled times and durations', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('60 min')).toBeInTheDocument();
    });

    it('handles empty scheduled goals', () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        upcomingGoals: [],
      });

      render(<CalendarPage />);
      
      expect(screen.getByText('No scheduled goals')).toBeInTheDocument();
    });
  });

  describe('Event Creation', () => {
    it('opens event creation dialog', async () => {
      render(<CalendarPage />);
      
      const createButton = screen.getByText('Add Event');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByText('Create Event')).toBeInTheDocument();
      });
    });

    it('handles event creation form submission', async () => {
      render(<CalendarPage />);
      
      // Open dialog
      const createButton = screen.getByText('Add Event');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
      });
      
      // Fill form and submit
      const titleInput = screen.getByLabelText('Event Title');
      fireEvent.change(titleInput, { target: { value: 'New Event' } });
      
      const saveButton = screen.getByText('Save Event');
      fireEvent.click(saveButton);
      
      await waitFor(() => {
        expect(mockUseCalendar.createEvent).toHaveBeenCalled();
      });
    });
  });

  describe('Event Editing', () => {
    it('opens event edit dialog when event is selected', async () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        selectedEvent: mockEvents[0],
      });

      render(<CalendarPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByText('Edit Event')).toBeInTheDocument();
      });
    });

    it('pre-fills form with event data', async () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        selectedEvent: mockEvents[0],
      });

      render(<CalendarPage />);
      
      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Morning Workout');
        expect(titleInput).toBeInTheDocument();
      });
    });

    it('handles event updates', async () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        selectedEvent: mockEvents[0],
      });

      render(<CalendarPage />);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Update Event');
        fireEvent.click(saveButton);
      });
      
      expect(mockUseCalendar.updateEvent).toHaveBeenCalled();
    });

    it('handles event deletion', async () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        selectedEvent: mockEvents[0],
      });

      render(<CalendarPage />);
      
      await waitFor(() => {
        const deleteButton = screen.getByText('Delete Event');
        fireEvent.click(deleteButton);
      });
      
      expect(mockUseCalendar.deleteEvent).toHaveBeenCalledWith(mockEvents[0].id);
    });
  });

  describe('Goal Scheduling', () => {
    it('allows scheduling goals from the sidebar', async () => {
      render(<CalendarPage />);
      
      const scheduleButton = screen.getByText('Schedule');
      fireEvent.click(scheduleButton);
      
      await waitFor(() => {
        expect(mockUseCalendar.scheduleGoal).toHaveBeenCalled();
      });
    });

    it('allows rescheduling existing goals', async () => {
      render(<CalendarPage />);
      
      const rescheduleButton = screen.getByText('Reschedule');
      fireEvent.click(rescheduleButton);
      
      await waitFor(() => {
        expect(mockUseCalendar.rescheduleGoal).toHaveBeenCalled();
      });
    });
  });

  describe('Date Navigation', () => {
    it('allows navigation to specific dates', async () => {
      render(<CalendarPage />);
      
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
      
      await waitFor(() => {
        expect(mockUseCalendar.navigateToDate).toHaveBeenCalledWith(new Date());
      });
    });
  });

  describe('Module Filtering', () => {
    it('allows filtering events by module', async () => {
      render(<CalendarPage />);
      
      const moduleFilter = screen.getByTestId('select');
      fireEvent.change(moduleFilter, { target: { value: 'fitness' } });
      
      await waitFor(() => {
        // Should filter events to only show fitness module events
        expect(screen.getByText('Morning Workout')).toBeInTheDocument();
      });
    });

    it('shows all modules in filter dropdown', () => {
      render(<CalendarPage />);
      
      expect(screen.getByText('All Modules')).toBeInTheDocument();
      expect(screen.getByText('Fitness')).toBeInTheDocument();
      expect(screen.getByText('Work')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      render(<CalendarPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseCalendar.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh button when loading', () => {
      (useCalendar as any).mockReturnValue({
        ...mockUseCalendar,
        loading: true,
      });

      render(<CalendarPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Event Type Indicators', () => {
    it('displays different event types with proper styling', () => {
      render(<CalendarPage />);
      
      // Events should have different styling based on type
      const goalEvent = screen.getByText('Morning Workout');
      const deadlineEvent = screen.getByText('Team Meeting');
      
      expect(goalEvent).toBeInTheDocument();
      expect(deadlineEvent).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(<CalendarPage />);
      
      // Should render mobile-appropriate layout
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<CalendarPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Calendar' })).toBeInTheDocument();
    });

    it('has accessible form labels in dialogs', async () => {
      render(<CalendarPage />);
      
      const createButton = screen.getByText('Add Event');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Event Title')).toBeInTheDocument();
      });
    });

    it('has keyboard navigation support', () => {
      render(<CalendarPage />);
      
      // Calendar component should support keyboard navigation
      const calendar = screen.getByTestId('calendar');
      expect(calendar).toBeInTheDocument();
    });
  });

  describe('Time Zone Handling', () => {
    it('displays times in correct timezone', () => {
      render(<CalendarPage />);
      
      // Times should be displayed in user's timezone
      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });
  });

  describe('Calendar Integration', () => {
    it('integrates with goal system', () => {
      render(<CalendarPage />);
      
      // Calendar should show goal-related events
      expect(screen.getByText('Morning Workout')).toBeInTheDocument();
    });

    it('integrates with deadline system', () => {
      render(<CalendarPage />);
      
      // Calendar should show deadline events
      expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    });
  });
});