"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useCalendar } from '@/hooks/useCalendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore } from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Plus, RefreshCw, AlertCircle, Clock } from 'lucide-react';

/**
 * Calendar page displaying events and goal deadlines
 */
export function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const {
    events,
    eventsByDate,
    summary,
    loading,
    error,
    getEventsForDate,
    getUpcomingEvents,
    getOverdueEvents,
    refetch
  } = useCalendar({
    startDate: startOfMonth(currentDate),
    endDate: endOfMonth(currentDate)
  });

  const handleRefresh = async () => {
    await refetch();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'goal_deadline': return 'bg-red-100 text-red-800';
      case 'milestone': return 'bg-green-100 text-green-800';
      case 'reminder': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for calendar grid
  const startWeekday = monthStart.getDay();
  const endWeekday = monthEnd.getDay();
  const paddingStart = Array.from({ length: startWeekday }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - startWeekday + i);
    return date;
  });
  const paddingEnd = Array.from({ length: 6 - endWeekday }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });
  
  const allCalendarDays = [...paddingStart, ...calendarDays, ...paddingEnd];

  return (
    <MainContent
      currentPage="calendar"
      pageTitle="Calendar"
      pageSubtitle={loading ? "Loading..." : format(currentDate, 'MMMM yyyy')}
      pageActions={
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load calendar: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Calendar Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
                <p className="text-sm text-muted-foreground">{summary.totalEvents} events this month</p>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="large" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {allCalendarDays.map((day, index) => {
                        const dayEvents = getEventsForDate(day);
                        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                        const isPast = isBefore(day, new Date()) && !isToday(day);
                        
                        return (
                          <div
                            key={index}
                            className={`min-h-24 p-2 border rounded-lg transition-colors ${
                              isToday(day) 
                                ? 'bg-primary/10 border-primary' 
                                : isCurrentMonth 
                                ? 'bg-background hover:bg-muted/50' 
                                : 'bg-muted/30 text-muted-foreground'
                            } ${isPast ? 'opacity-75' : ''}`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {format(day, 'd')}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded truncate ${
                                    getEventTypeColor(event.eventType)
                                  }`}
                                  title={event.title}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Upcoming
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getUpcomingEvents(5).map((event) => (
                    <div key={event.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <Badge variant="outline" className={getEventTypeColor(event.eventType)}>
                          {event.eventType.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(event.startDate), 'MMM d, h:mm a')}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                  {getUpcomingEvents().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming events
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Events */}
            {getOverdueEvents().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-red-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    Overdue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getOverdueEvents().slice(0, 5).map((event) => (
                      <div key={event.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <Badge variant="destructive">
                            Overdue
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(event.startDate), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Events:</span>
                    <span className="font-medium">{summary.totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upcoming:</span>
                    <span className="font-medium">{summary.upcomingEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue:</span>
                    <span className="font-medium text-red-600">{summary.overdueEvents}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainContent>
  );
}

export default CalendarPage;