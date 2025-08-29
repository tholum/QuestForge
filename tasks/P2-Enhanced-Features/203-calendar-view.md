# P2-203: Calendar View Implementation

## Task Overview

**Priority**: P2 (Enhanced Feature)  
**Status**: Not Started  
**Effort**: 8 Story Points  
**Sprint**: Enhanced User Experience  

## Description

Implement a comprehensive calendar view that displays goals, deadlines, milestones, and scheduled activities in monthly, weekly, and daily formats. The calendar will provide intuitive scheduling, drag-and-drop functionality, and integration with external calendar systems for a complete time management solution.

## Dependencies

- ✅ P1-101: Goal Management CRUD (goals to display on calendar)
- ✅ P1-102: Progress Tracking (milestone scheduling)
- ❌ P1-105: Missing Core Pages (calendar page infrastructure)
- ❌ P2-204: Notifications System (calendar reminders)
- ❌ External calendar APIs (Google Calendar, Outlook, etc.)

## Definition of Done

### Core Calendar Features
- [ ] Monthly, weekly, and daily calendar views
- [ ] Goal deadline visualization and management
- [ ] Milestone and checkpoint scheduling
- [ ] Drag-and-drop event rescheduling
- [ ] Color-coded events by module and priority
- [ ] Event creation directly from calendar interface

### Advanced Calendar Functionality
- [ ] Recurring event support for regular goals
- [ ] Time blocking for focused work sessions
- [ ] Conflict detection and resolution
- [ ] Calendar event search and filtering
- [ ] Export calendar data (iCal format)
- [ ] Import from external calendar services

### Integration Features
- [ ] Sync with Google Calendar, Outlook, Apple Calendar
- [ ] Notification integration for upcoming deadlines
- [ ] Goal progress updates from calendar events
- [ ] Mobile calendar app with offline support
- [ ] Team calendar sharing (future feature)

## User Stories

### US-203.1: Visual Goal Scheduling
```
As a user
I want to view my goals and deadlines in a calendar format
So that I can visualize my commitments and plan my time effectively
```

**Acceptance Criteria:**
- Calendar displays goals with target dates as events
- Different modules are color-coded for easy identification
- Priority levels are visually distinguished
- Overdue goals are clearly highlighted
- Calendar supports monthly, weekly, and daily views
- Mobile calendar is touch-friendly and responsive

### US-203.2: Interactive Event Management
```
As a user
I want to create, edit, and reschedule goals directly from the calendar
So that I can efficiently manage my schedule without switching contexts
```

**Acceptance Criteria:**
- User can drag and drop goals to reschedule deadlines
- Double-clicking creates new goals with pre-filled dates
- Event details can be edited in-place or via modal
- Changes sync immediately with goal management system
- Conflict warnings appear for overlapping commitments
- Bulk rescheduling is available for multiple events

### US-203.3: External Calendar Integration
```
As a user with existing calendar systems
I want to sync my goal calendar with external services
So that I have a unified view of all my commitments
```

**Acceptance Criteria:**
- Two-way sync with Google Calendar, Outlook, Apple Calendar
- Goal events appear in external calendars with proper formatting
- External events can influence goal scheduling
- Sync conflicts are resolved with user input
- Sync status is clearly communicated to user
- Manual sync and automatic sync options available

### US-203.4: Time Management Features
```
As a productivity-focused user
I want advanced calendar features like time blocking and recurring goals
So that I can optimize my schedule and maintain consistent habits
```

**Acceptance Criteria:**
- Time blocking for focused work sessions
- Recurring goal patterns (daily, weekly, monthly)
- Available time slots highlighted for new goals
- Calendar analytics show time allocation patterns
- Focus mode blocks distracting calendar features
- Integration with productivity techniques (Pomodoro, etc.)

## Technical Implementation

### Database Schema Extensions
```sql
-- Calendar events table
CREATE TABLE CalendarEvent (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  eventType TEXT NOT NULL, -- 'goal_deadline', 'milestone', 'time_block', 'reminder', 'external'
  startDateTime DATETIME NOT NULL,
  endDateTime DATETIME,
  isAllDay BOOLEAN DEFAULT false,
  isRecurring BOOLEAN DEFAULT false,
  recurrencePattern TEXT, -- JSON: {type: 'daily', interval: 1, endDate: '2024-12-31'}
  location TEXT,
  color TEXT, -- Hex color for display
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  externalCalendarId TEXT, -- ID from external calendar sync
  externalEventId TEXT, -- External event ID for sync
  lastSyncedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- Calendar sync configurations
CREATE TABLE CalendarSyncConfig (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple', 'ical'
  providerCalendarId TEXT NOT NULL,
  accessToken TEXT, -- Encrypted
  refreshToken TEXT, -- Encrypted
  isEnabled BOOLEAN DEFAULT true,
  syncDirection TEXT DEFAULT 'bidirectional', -- 'import', 'export', 'bidirectional'
  lastSyncAt DATETIME,
  syncErrors TEXT, -- JSON array of recent sync errors
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId, provider, providerCalendarId)
);

-- Time blocking sessions
CREATE TABLE TimeBlock (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  goalId TEXT,
  title TEXT NOT NULL,
  description TEXT,
  startDateTime DATETIME NOT NULL,
  durationMinutes INTEGER NOT NULL,
  blockType TEXT DEFAULT 'focus', -- 'focus', 'break', 'meeting', 'planning'
  isCompleted BOOLEAN DEFAULT false,
  actualDurationMinutes INTEGER,
  productivityScore INTEGER, -- 1-10 rating
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (goalId) REFERENCES Goal(id)
);

-- Calendar views user preferences
CREATE TABLE CalendarViewConfig (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  defaultView TEXT DEFAULT 'month', -- 'month', 'week', 'day', 'agenda'
  startDayOfWeek INTEGER DEFAULT 0, -- 0 = Sunday, 1 = Monday
  workingHoursStart TIME DEFAULT '09:00',
  workingHoursEnd TIME DEFAULT '17:00',
  showWeekends BOOLEAN DEFAULT true,
  showCompletedGoals BOOLEAN DEFAULT false,
  colorScheme TEXT DEFAULT 'auto', -- 'light', 'dark', 'auto'
  timeZone TEXT DEFAULT 'UTC',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id),
  UNIQUE(userId)
);

-- Indexes for performance
CREATE INDEX idx_calendar_event_user_date ON CalendarEvent(userId, startDateTime);
CREATE INDEX idx_calendar_event_goal ON CalendarEvent(goalId);
CREATE INDEX idx_time_block_user_date ON TimeBlock(userId, startDateTime);
```

### API Endpoints

#### Calendar Events API
```typescript
// src/app/api/v1/calendar/events/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = await getCurrentUserId(request);
  const startDate = searchParams.get('start') || new Date().toISOString();
  const endDate = searchParams.get('end') || 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const view = searchParams.get('view') || 'month';
  
  try {
    const events = await calendarService.getEvents(userId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      view,
    });
    
    return NextResponse.json({
      success: true,
      data: events,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    
    const event = await calendarService.createEvent(userId, body);
    
    // Sync with external calendars if configured
    await calendarSyncService.syncEventToExternal(userId, event);
    
    return NextResponse.json(
      { success: true, data: event },
      { status: 201 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### Calendar Sync API
```typescript
// src/app/api/v1/calendar/sync/route.ts
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    const body = await request.json();
    const { provider, action } = body; // action: 'connect', 'disconnect', 'sync'
    
    switch (action) {
      case 'connect':
        const authUrl = await calendarSyncService.getAuthUrl(provider, userId);
        return NextResponse.json({ success: true, data: { authUrl } });
      
      case 'disconnect':
        await calendarSyncService.disconnect(userId, provider);
        return NextResponse.json({ success: true });
      
      case 'sync':
        const result = await calendarSyncService.performSync(userId, provider);
        return NextResponse.json({ success: true, data: result });
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return handleAPIError(error);
  }
}
```

### Calendar Service Implementation
```typescript
// src/lib/services/calendar-service.ts
import { CalendarEvent, Goal } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export class CalendarService {
  async getEvents(userId: string, options: {
    startDate: Date;
    endDate: Date;
    view: string;
  }) {
    const { startDate, endDate, view } = options;
    
    // Get calendar events
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        startDateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        goal: {
          include: { module: true },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });
    
    // Get goals with target dates in range
    const goalDeadlines = await prisma.goal.findMany({
      where: {
        userId,
        targetDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { module: true },
    });
    
    // Convert goals to calendar events
    const goalEvents = goalDeadlines.map(goal => ({
      id: `goal-${goal.id}`,
      title: goal.title,
      description: goal.description,
      startDateTime: goal.targetDate,
      endDateTime: goal.targetDate,
      isAllDay: true,
      eventType: 'goal_deadline',
      color: this.getModuleColor(goal.module.name),
      priority: goal.priority,
      goal,
    }));
    
    // Get time blocks in range
    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        userId,
        startDateTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        goal: {
          include: { module: true },
        },
      },
    });
    
    // Convert time blocks to events
    const timeBlockEvents = timeBlocks.map(block => ({
      id: `timeblock-${block.id}`,
      title: block.title,
      description: block.description,
      startDateTime: block.startDateTime,
      endDateTime: new Date(block.startDateTime.getTime() + block.durationMinutes * 60000),
      eventType: 'time_block',
      color: '#6366f1',
      timeBlock: block,
    }));
    
    return [...events, ...goalEvents, ...timeBlockEvents];
  }
  
  async createEvent(userId: string, eventData: any) {
    const event = await prisma.calendarEvent.create({
      data: {
        userId,
        ...eventData,
        startDateTime: new Date(eventData.startDateTime),
        endDateTime: eventData.endDateTime ? new Date(eventData.endDateTime) : null,
      },
      include: {
        goal: {
          include: { module: true },
        },
      },
    });
    
    // If this is a goal deadline event, update the goal
    if (event.goalId && event.eventType === 'goal_deadline') {
      await prisma.goal.update({
        where: { id: event.goalId },
        data: { targetDate: event.startDateTime },
      });
    }
    
    return event;
  }
  
  async updateEvent(eventId: string, userId: string, updates: any) {
    const event = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...updates,
        startDateTime: updates.startDateTime ? new Date(updates.startDateTime) : undefined,
        endDateTime: updates.endDateTime ? new Date(updates.endDateTime) : undefined,
        updatedAt: new Date(),
      },
      include: {
        goal: {
          include: { module: true },
        },
      },
    });
    
    // Sync changes to related goal if applicable
    if (event.goalId && updates.startDateTime) {
      await prisma.goal.update({
        where: { id: event.goalId },
        data: { targetDate: new Date(updates.startDateTime) },
      });
    }
    
    return event;
  }
  
  async deleteEvent(eventId: string, userId: string) {
    return await prisma.calendarEvent.delete({
      where: { id: eventId },
    });
  }
  
  async createTimeBlock(userId: string, blockData: any) {
    return await prisma.timeBlock.create({
      data: {
        userId,
        ...blockData,
        startDateTime: new Date(blockData.startDateTime),
      },
      include: {
        goal: {
          include: { module: true },
        },
      },
    });
  }
  
  private getModuleColor(moduleName: string): string {
    const colors = {
      fitness: '#ef4444',
      learning: '#3b82f6',
      bible: '#8b5cf6',
      work: '#f59e0b',
      home: '#10b981',
      default: '#6b7280',
    };
    
    return colors[moduleName.toLowerCase()] || colors.default;
  }
  
  async getAvailableTimeSlots(userId: string, date: Date, durationMinutes: number) {
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // Default start at 9 AM
    
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // Default end at 5 PM
    
    // Get existing events for the day
    const existingEvents = await this.getEvents(userId, {
      startDate: startOfDay,
      endDate: endOfDay,
      view: 'day',
    });
    
    // Calculate available slots
    const slots = [];
    let currentTime = new Date(startOfDay);
    
    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + durationMinutes * 60000);
      
      // Check if slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.startDateTime);
        const eventEnd = new Date(event.endDateTime || event.startDateTime);
        
        return (currentTime < eventEnd && slotEnd > eventStart);
      });
      
      if (!hasConflict && slotEnd <= endOfDay) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
          duration: durationMinutes,
        });
      }
      
      currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute increments
    }
    
    return slots;
  }
}

export const calendarService = new CalendarService();
```

### React Components

#### Calendar View Component
```typescript
// src/components/calendar/CalendarView.tsx
'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Settings,
  Sync,
  Filter,
} from 'lucide-react';
import { useCalendar } from '@/hooks/useCalendar';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarFilters } from './CalendarFilters';
import { cn } from '@/lib/utils';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const views = ['month', 'week', 'day', 'agenda'] as const;
type CalendarView = typeof views[number];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    syncCalendars,
    filters,
    updateFilters,
  } = useCalendar({
    date: currentDate,
    view: currentView,
  });
  
  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent({
      start,
      end,
      isNew: true,
    });
    setShowEventModal(true);
  };
  
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };
  
  const handleEventDrop = async ({ event, start, end }) => {
    try {
      await updateEvent(event.id, {
        startDateTime: start,
        endDateTime: end,
      });
    } catch (error) {
      console.error('Failed to update event:', error);
    }
  };
  
  const eventStyleGetter = (event, start, end, isSelected) => {
    const style = {
      backgroundColor: event.color || '#3b82f6',
      borderRadius: '4px',
      opacity: event.status === 'completed' ? 0.6 : 1,
      border: 'none',
      color: 'white',
      fontSize: '12px',
      padding: '2px 4px',
    };
    
    if (event.priority === 'high') {
      style.borderLeft = '4px solid #ef4444';
    } else if (event.priority === 'urgent') {
      style.borderLeft = '4px solid #dc2626';
      style.fontWeight = 'bold';
    }
    
    return { style };
  };
  
  const CustomEvent = ({ event }) => (
    <div className="flex items-center gap-1">
      <span className="truncate">{event.title}</span>
      {event.eventType === 'goal_deadline' && (
        <Badge variant="secondary" className="text-xs">Goal</Badge>
      )}
      {event.eventType === 'time_block' && (
        <Badge variant="outline" className="text-xs">Block</Badge>
      )}
    </div>
  );
  
  const filteredEvents = events.filter(event => {
    if (filters.modules.length > 0 && event.goal?.moduleId) {
      return filters.modules.includes(event.goal.moduleId);
    }
    if (filters.eventTypes.length > 0) {
      return filters.eventTypes.includes(event.eventType);
    }
    if (filters.priorities.length > 0) {
      return filters.priorities.includes(event.priority);
    }
    return true;
  });
  
  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-2xl font-bold">Calendar</CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={syncCalendars}
              >
                <Sync className="h-4 w-4 mr-2" />
                Sync
              </Button>
              
              <Button
                size="sm"
                onClick={() => {
                  setSelectedEvent({ isNew: true });
                  setShowEventModal(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0">
            <CalendarFilters
              filters={filters}
              onFiltersChange={updateFilters}
            />
          </CardContent>
        )}
      </Card>
      
      {/* Calendar Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (currentView === 'month') {
                      newDate.setMonth(newDate.getMonth() - 1);
                    } else if (currentView === 'week') {
                      newDate.setDate(newDate.getDate() - 7);
                    } else {
                      newDate.setDate(newDate.getDate() - 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <h3 className="text-lg font-semibold min-w-[200px] text-center">
                  {format(currentDate, currentView === 'month' ? 'MMMM yyyy' : 
                           currentView === 'week' ? "'Week of' MMM d, yyyy" : 
                           'MMMM d, yyyy')}
                </h3>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(currentDate);
                    if (currentView === 'month') {
                      newDate.setMonth(newDate.getMonth() + 1);
                    } else if (currentView === 'week') {
                      newDate.setDate(newDate.getDate() + 7);
                    } else {
                      newDate.setDate(newDate.getDate() + 1);
                    }
                    setCurrentDate(newDate);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-1">
              {views.map(view => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className="capitalize"
                >
                  {view}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Calendar Component */}
      <Card>
        <CardContent className="p-4">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="startDateTime"
              endAccessor="endDateTime"
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              onEventDrop={handleEventDrop}
              eventPropGetter={eventStyleGetter}
              components={{
                event: CustomEvent,
              }}
              selectable
              resizable
              dragFromOutsideItem={() => ({})}
              popup
              showMultiDayTimes
              step={15}
              timeslots={4}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Event Modal */}
      <CalendarEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onSave={async (eventData) => {
          if (selectedEvent?.isNew) {
            await createEvent(eventData);
          } else {
            await updateEvent(selectedEvent.id, eventData);
          }
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onDelete={selectedEvent?.id ? async () => {
          await deleteEvent(selectedEvent.id);
          setShowEventModal(false);
          setSelectedEvent(null);
        } : undefined}
      />
    </div>
  );
}
```

## Mobile Optimizations

### Touch-Friendly Interface
- Large touch targets for calendar navigation
- Swipe gestures for changing months/weeks
- Long press for creating events
- Mobile-specific calendar layouts

### Performance Optimizations
- Virtual scrolling for large event lists
- Lazy loading of calendar data
- Efficient event rendering
- Offline calendar caching

## Testing Strategy

### Unit Tests
- Calendar event CRUD operations
- Date calculation and formatting
- External calendar sync logic
- Time conflict detection

### Integration Tests
- Complete calendar workflows
- External calendar integration
- Event creation and editing
- Drag-and-drop functionality

### Mobile Testing
- Touch interaction testing
- Calendar rendering on various screen sizes
- Performance optimization validation
- Offline functionality testing

## Success Metrics

### Functional Metrics
- 100% calendar event sync accuracy
- < 1 second calendar view switching
- 99.9% external calendar sync reliability
- Zero data loss in event operations

### User Experience Metrics
- Calendar feature adoption rate > 70%
- Daily calendar usage > 50%
- Event creation success rate > 95%
- Mobile calendar usage > 60%

### Performance Metrics
- Calendar load time < 2 seconds
- Event rendering time < 500ms
- Sync operation completion < 5 seconds
- Mobile scrolling performance at 60fps

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Enhanced User Experience