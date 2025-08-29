"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useGoals } from '@/hooks/useGoals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, TrendingUp, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Progress page displaying goal progress and tracking
 */
export function ProgressPage() {
  const {
    goals,
    loading,
    error,
    refetch
  } = useGoals({ filter: 'active' });

  const handleRefresh = async () => {
    await refetch();
  };

  // Calculate overall progress
  const overallProgress = React.useMemo(() => {
    if (!goals.length) return 0;
    const totalProgress = goals.reduce((sum, goal) => {
      const progress = goal.progress?.[0] || { value: 0, maxValue: 100 };
      return sum + (progress.value / progress.maxValue) * 100;
    }, 0);
    return Math.round(totalProgress / goals.length);
  }, [goals]);

  return (
    <MainContent
      currentPage="progress"
      pageTitle="Progress"
      pageSubtitle={loading ? "Loading..." : `Tracking ${goals.length} active goals`}
      pageActions={
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load progress: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
            <span className="ml-2">Loading progress...</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overall Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Progress</CardTitle>
              <CardDescription>Your progress across all active goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={overallProgress} className="h-4" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{overallProgress}% Complete</span>
                  <span>{goals.length} Active Goals</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Individual Goal Progress */}
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = goal.progress?.[0] || { value: 0, maxValue: 100 };
              const percentage = Math.min(100, Math.max(0, (progress.value / progress.maxValue) * 100));
              
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <CardDescription>{goal.description}</CardDescription>
                      </div>
                      <Badge variant={percentage === 100 ? "default" : "secondary"}>
                        {Math.round(percentage)}%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Progress value={percentage} className="h-3" />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{progress.value} / {progress.maxValue}</span>
                        <span>Priority: {goal.priority}</span>
                      </div>
                      {goal.targetDate && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          Due: {new Date(goal.targetDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {goals.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active goals</h3>
                <p className="text-muted-foreground">
                  Create some goals to track your progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </MainContent>
  );
}

export default ProgressPage;