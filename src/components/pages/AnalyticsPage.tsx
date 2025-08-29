"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Trophy,
  Flame,
  Download,
  RefreshCw,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: number;
  description?: string;
}

function MetricCard({ title, value, icon: Icon, trend, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Icon className="w-8 h-8 text-muted-foreground" />
            {trend !== undefined && (
              <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : trend < 0 ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

/**
 * Analytics page with charts and insights
 */
export function AnalyticsPage() {
  const [period, setPeriod] = React.useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedModule, setSelectedModule] = React.useState<string>('');
  const [chartType, setChartType] = React.useState<'line' | 'bar'>('line');

  const {
    data,
    summary,
    trends,
    moduleBreakdown,
    timeline,
    loading,
    error,
    cached,
    getTimelineChartData,
    getModuleChartData,
    exportToCsv,
    exportToJson,
    refetch,
    invalidateCache
  } = useAnalytics({ 
    period, 
    moduleId: selectedModule || undefined 
  });

  // Handle refresh
  const handleRefresh = async () => {
    await invalidateCache();
    await refetch();
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Chart data
  const timelineData = getTimelineChartData();
  const moduleData = getModuleChartData();

  return (
    <MainContent
      currentPage="analytics"
      pageTitle="Analytics"
      pageSubtitle={loading ? "Loading analytics..." : `Analytics for ${period} period`}
      pageActions={
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={exportToCsv}
            disabled={loading || !data}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
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
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load analytics: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Cache Status */}
      {cached && (
        <Alert className="mb-6">
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Showing cached data. Click refresh for latest analytics.
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !data ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
            <span className="ml-2">Loading analytics...</span>
          </CardContent>
        </Card>
      ) : data && summary ? (
        <div className="space-y-6">
          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Time Period</label>
                  <Select value={period} onValueChange={setPeriod as any}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Module Filter</label>
                  <Select value={selectedModule} onValueChange={setSelectedModule}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Modules</SelectItem>
                      {moduleBreakdown.map((module) => (
                        <SelectItem key={module.moduleId} value={module.moduleId}>
                          {module.moduleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Chart Type</label>
                  <Select value={chartType} onValueChange={setChartType as any}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Goals"
              value={formatNumber(summary.totalGoals)}
              icon={Target}
              trend={trends?.goalsTrend}
              description="Goals created"
            />
            <MetricCard
              title="Completion Rate"
              value={`${summary.completionRate}%`}
              icon={Trophy}
              trend={trends?.completionTrend}
              description={`${summary.completedGoals} completed`}
            />
            <MetricCard
              title="XP Earned"
              value={formatNumber(summary.totalXpEarned)}
              icon={Activity}
              description={`Level ${summary.currentLevel}`}
            />
            <MetricCard
              title="Current Streak"
              value={`${summary.currentStreak} days`}
              icon={Flame}
              description="Consecutive active days"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {chartType === 'line' ? (
                    <LineChartIcon className="w-5 h-5 mr-2" />
                  ) : (
                    <BarChart3 className="w-5 h-5 mr-2" />
                  )}
                  Progress Timeline
                </CardTitle>
                <CardDescription>
                  Daily progress and XP earned over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === 'line' ? (
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="progress" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        name="Progress Entries"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="xp" 
                        stroke="#82ca9d" 
                        strokeWidth={2}
                        name="XP Earned"
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="displayDate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="progress" fill="#8884d8" name="Progress Entries" />
                      <Bar dataKey="xp" fill="#82ca9d" name="XP Earned" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Module Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2" />
                  Module Performance
                </CardTitle>
                <CardDescription>
                  Goal completion by module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={moduleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, completionRate }) => `${name}: ${completionRate}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="completed"
                    >
                      {moduleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Module Details Table */}
          <Card>
            <CardHeader>
              <CardTitle>Module Statistics</CardTitle>
              <CardDescription>
                Detailed breakdown by module
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Module</th>
                      <th className="text-right p-2">Goals</th>
                      <th className="text-right p-2">Completed</th>
                      <th className="text-right p-2">Rate</th>
                      <th className="text-right p-2">XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleBreakdown.map((module) => (
                      <tr key={module.moduleId} className="border-b">
                        <td className="p-2 font-medium">{module.moduleName}</td>
                        <td className="p-2 text-right">{module.totalGoals}</td>
                        <td className="p-2 text-right">{module.completedGoals}</td>
                        <td className="p-2 text-right">
                          <Badge variant="outline">
                            {module.totalGoals > 0 
                              ? Math.round((module.completedGoals / module.totalGoals) * 100)
                              : 0
                            }%
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{formatNumber(module.xpEarned)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No analytics data</h3>
            <p className="text-muted-foreground">
              Start creating goals to see your analytics.
            </p>
          </CardContent>
        </Card>
      )}
    </MainContent>
  );
}

export default AnalyticsPage;