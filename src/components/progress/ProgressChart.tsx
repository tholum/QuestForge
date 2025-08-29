/**
 * Progress Chart Component
 * 
 * Responsive progress visualization using Recharts with support for multiple chart types,
 * trend analysis, and interactive tooltips.
 */

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  LineChartIcon,
  AreaChart as AreaChartIcon,
  Calendar,
  Zap,
} from 'lucide-react'
import { useProgressChart, type ProgressEntry } from '@/hooks/useProgress'
import { LoadingSpinner } from '@/components/base/LoadingSpinner'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  date: string
  progress: number
  xpEarned?: number
  trend?: number
}

interface IProgressChartProps {
  goalId: string
  goalTitle?: string
  className?: string
  
  // Chart configuration
  defaultType?: 'line' | 'area' | 'bar'
  defaultTimeframe?: number
  defaultAggregation?: 'daily' | 'weekly' | 'monthly'
  showXP?: boolean
  showTrend?: boolean
  height?: number
  
  // UI options
  showControls?: boolean
  showStats?: boolean
  variant?: 'default' | 'compact' | 'dashboard'
}

const ProgressChart: React.FC<IProgressChartProps> = ({
  goalId,
  goalTitle = 'Goal Progress',
  className,
  defaultType = 'line',
  defaultTimeframe = 30,
  defaultAggregation = 'daily',
  showXP = true,
  showTrend = true,
  height = 300,
  showControls = true,
  showStats = true,
  variant = 'default'
}) => {
  const [chartType, setChartType] = React.useState<'line' | 'area' | 'bar'>(defaultType)
  const [timeframe, setTimeframe] = React.useState(defaultTimeframe)
  const [aggregation, setAggregation] = React.useState<'daily' | 'weekly' | 'monthly'>(defaultAggregation)

  const {
    data: chartResponse,
    isLoading,
    error,
    refetch
  } = useProgressChart(goalId, {
    days: timeframe,
    type: chartType,
    aggregation,
    includeXP: showXP,
    includeTrend: showTrend
  })

  const chartData = chartResponse?.data?.chartData || []
  const trendData = chartResponse?.data?.trendLine || []
  const stats = chartResponse?.data?.stats

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload
    const date = new Date(label).toLocaleDateString()

    return (
      <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
        <p className="font-medium text-sm">{date}</p>
        <div className="space-y-1">
          <p className="text-sm flex items-center gap-2">
            <div className="w-2 h-2 rounded bg-primary" />
            Progress: {data.progress.toFixed(1)}%
          </p>
          {showXP && data.xpEarned !== undefined && (
            <p className="text-sm flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-500" />
              XP: {data.xpEarned}
            </p>
          )}
          {showTrend && data.trend !== undefined && (
            <p className="text-sm flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-blue-500" />
              Trend: {data.trend.toFixed(1)}%
            </p>
          )}
        </div>
      </div>
    )
  }

  // Format date for display
  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr)
    if (aggregation === 'daily') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (aggregation === 'weekly') {
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <p>Failed to load chart data</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    if (!chartData.length) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <p>No progress data available</p>
            <p className="text-sm">Start tracking progress to see your chart</p>
          </div>
        </div>
      )
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    const gradientId = `gradient-${goalId}`

    return (
      <ResponsiveContainer width="100%" height={height}>
        {chartType === 'line' && (
          <LineChart {...commonProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisDate}
              fontSize={12}
            />
            <YAxis 
              domain={[0, 'dataMax + 10']}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            {showTrend && trendData.length > 0 && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            )}
          </LineChart>
        )}
        {chartType === 'area' && (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisDate}
              fontSize={12}
            />
            <YAxis 
              domain={[0, 'dataMax + 10']}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="progress"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        )}
        {chartType === 'bar' && (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxisDate}
              fontSize={12}
            />
            <YAxis 
              domain={[0, 'dataMax + 10']}
              fontSize={12}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="progress"
              fill="hsl(var(--primary))"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    )
  }

  const getTrendIcon = () => {
    if (!stats) return null
    
    switch (stats.progressTrend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }
  }

  const isCompact = variant === 'compact'
  const isDashboard = variant === 'dashboard'

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className={cn('pb-4', isCompact && 'pb-2')}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={cn('flex items-center gap-2', isCompact && 'text-base')}>
              {chartType === 'line' && <LineChartIcon className="w-5 h-5" />}
              {chartType === 'area' && <AreaChartIcon className="w-5 h-5" />}
              {chartType === 'bar' && <BarChart3 className="w-5 h-5" />}
              Progress Chart
            </CardTitle>
            <CardDescription>
              {goalTitle} - {timeframe} days
            </CardDescription>
          </div>
          
          {stats && showStats && (
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <Badge variant="outline" className="capitalize">
                {stats.progressTrend}
              </Badge>
            </div>
          )}
        </div>

        {showControls && !isCompact && (
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Type:</label>
              <Tabs value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="area">Area</TabsTrigger>
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Period:</label>
              <Select value={String(timeframe)} onValueChange={(value) => setTimeframe(Number(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7d</SelectItem>
                  <SelectItem value="30">30d</SelectItem>
                  <SelectItem value="90">90d</SelectItem>
                  <SelectItem value="365">1y</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Group:</label>
              <Select value={aggregation} onValueChange={(value: any) => setAggregation(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className={cn('space-y-4', isCompact && 'space-y-2')}>
          {renderChart()}
          
          {stats && showStats && !isCompact && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.averageProgress.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Avg Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.maxProgress.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">Peak Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalXP}
                </div>
                <div className="text-xs text-muted-foreground">Total XP</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.totalDataPoints}
                </div>
                <div className="text-xs text-muted-foreground">Data Points</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProgressChart