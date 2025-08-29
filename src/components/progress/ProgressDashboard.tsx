/**
 * Progress Dashboard Component
 * 
 * Comprehensive dashboard showing progress analytics, charts, recent entries,
 * and gamification elements with responsive design.
 */

import React from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Zap, 
  Award, 
  Calendar,
  BarChart3,
  Users,
  Clock,
  Flame
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  useProgress,
  useUserAnalytics,
  useLeaderboard,
  type ProgressEntry,
  type UserAnalytics
} from '@/hooks/useProgress'
import { LoadingSpinner } from '@/components/base/LoadingSpinner'
import { ProgressIndicator, CircularProgress } from '@/components/base/ProgressIndicator'
import ProgressChart from './ProgressChart'
import { cn } from '@/lib/utils'

interface IProgressDashboardProps {
  userId: string
  className?: string
  
  // Data configuration
  timeframeDays?: number
  maxRecentEntries?: number
  
  // UI customization
  variant?: 'default' | 'compact' | 'mobile'
  showCharts?: boolean
  showLeaderboard?: boolean
  showRecentProgress?: boolean
  showGamification?: boolean
  
  // Layout options
  cols?: 1 | 2 | 3
  chartHeight?: number
}

const ProgressDashboard: React.FC<IProgressDashboardProps> = ({
  userId,
  className,
  timeframeDays = 30,
  maxRecentEntries = 10,
  variant = 'default',
  showCharts = true,
  showLeaderboard = true,
  showRecentProgress = true,
  showGamification = true,
  cols = 3,
  chartHeight = 300
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = React.useState(timeframeDays)
  
  // Fetch data
  const {
    data: recentProgressData,
    isLoading: isLoadingProgress
  } = useProgress({
    userId,
    limit: maxRecentEntries,
    sortBy: 'recordedAt',
    sortOrder: 'desc'
  })

  const {
    data: analyticsResponse,
    isLoading: isLoadingAnalytics
  } = useUserAnalytics(userId, selectedTimeframe)

  const {
    data: leaderboardResponse,
    isLoading: isLoadingLeaderboard
  } = useLeaderboard({
    limit: 5,
    days: selectedTimeframe,
    includeUserRank: true
  })

  const analytics = analyticsResponse?.data
  const recentProgress = recentProgressData?.data || []
  const leaderboard = leaderboardResponse?.data

  const isLoading = isLoadingProgress || isLoadingAnalytics || isLoadingLeaderboard
  const isCompact = variant === 'compact'
  const isMobile = variant === 'mobile'

  // Render analytics summary cards
  const renderAnalyticsSummary = () => {
    if (!analytics) return null

    const summaryCards = [
      {
        title: 'Total Progress Entries',
        value: analytics.analytics.totalEntries,
        icon: Target,
        color: 'text-blue-600',
        change: analytics.analytics.progressTrend,
        description: `${analytics.insights.dailyAverage.toFixed(1)} per day average`
      },
      {
        title: 'Total XP Earned',
        value: analytics.analytics.totalXpEarned,
        icon: Zap,
        color: 'text-yellow-600',
        change: analytics.analytics.totalXpEarned > 0 ? 'increasing' : 'stable',
        description: `${analytics.insights.xpPerEntry} XP per entry`
      },
      {
        title: 'Current Level',
        value: analytics.gamification.level.currentLevel,
        icon: Award,
        color: 'text-purple-600',
        change: 'stable',
        description: `${(analytics.gamification.level.progressToNextLevel * 100).toFixed(1)}% to next level`
      },
      {
        title: 'Current Streak',
        value: analytics.gamification.streak.currentStreak,
        icon: Flame,
        color: 'text-orange-600',
        change: analytics.gamification.streak.isActive ? 'increasing' : 'decreasing',
        description: `${analytics.insights.streakHealth} health`
      }
    ]

    const gridCols = isMobile ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-4'

    return (
      <div className={cn('grid gap-4', gridCols)}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon
          const getTrendIcon = () => {
            switch (card.change) {
              case 'increasing':
                return <TrendingUp className="w-4 h-4 text-green-500" />
              case 'decreasing':
                return <TrendingDown className="w-4 h-4 text-red-500" />
              default:
                return null
            }
          }

          return (
            <Card key={index}>
              <CardContent className={cn('p-4', isCompact && 'p-3')}>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{card.value}</p>
                      {getTrendIcon()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {card.description}
                    </p>
                  </div>
                  <Icon className={cn('w-8 h-8', card.color)} />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }

  // Render progress consistency chart
  const renderConsistencyChart = () => {
    if (!analytics) return null

    const consistencyScore = analytics.analytics.consistencyScore
    const streakData = analytics.gamification.streak

    return (
      <Card>
        <CardHeader className={cn('pb-4', isCompact && 'pb-2')}>
          <CardTitle className="text-lg">Consistency Overview</CardTitle>
          <CardDescription>
            Your progress consistency over the last {selectedTimeframe} days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consistency Score */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Consistency Score</span>
              <Badge variant="outline">{analytics.insights.consistencyGrade}</Badge>
            </div>
            <Progress value={consistencyScore} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{consistencyScore}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Streak Information */}
          {showGamification && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <CircularProgress
                    value={streakData.currentStreak}
                    max={30}
                    size={80}
                    strokeWidth={6}
                    showPercentage={false}
                    color="hsl(var(--orange))"
                  />
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-medium">Current Streak</p>
                    <p className="text-xs text-muted-foreground">
                      {streakData.currentStreak} days
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Streak Health</p>
                    <Badge variant="outline" className="capitalize">
                      {analytics.insights.streakHealth.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">
                      {streakData.isActive ? 'Active' : 'Broken'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  // Render recent progress entries
  const renderRecentProgress = () => {
    if (!recentProgress.length) return null

    return (
      <Card>
        <CardHeader className={cn('pb-4', isCompact && 'pb-2')}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Progress
          </CardTitle>
          <CardDescription>
            Your latest {recentProgress.length} progress entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentProgress.slice(0, 5).map((entry: ProgressEntry, index) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {entry.goal?.title || 'Goal'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.recordedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-sm font-medium">
                    {((entry.value / entry.maxValue) * 100).toFixed(1)}%
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Zap className="w-3 h-3" />
                    {entry.xpEarned} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render leaderboard
  const renderLeaderboard = () => {
    if (!leaderboard) return null

    const { progressLeaderboard, currentUser } = leaderboard

    return (
      <Card>
        <CardHeader className={cn('pb-4', isCompact && 'pb-2')}>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Progress Leaderboard
          </CardTitle>
          <CardDescription>
            Top performers in the last {selectedTimeframe} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {progressLeaderboard?.slice(0, 5).map((user: any, index: number) => (
              <div key={user.userId} className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                user.userId === userId ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
              )}>
                <div className="flex items-center gap-3">
                  <Badge variant={index < 3 ? 'default' : 'outline'}>
                    #{user.rank || index + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {user.userName || 'Anonymous'}
                      {user.userId === userId && (
                        <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.entriesCount} entries
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{user.totalXp} XP</p>
                  <p className="text-xs text-muted-foreground">
                    {user.totalProgress.toFixed(1)} total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with timeframe selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Progress Dashboard</h2>
          <p className="text-muted-foreground">
            Track your progress and achievements
          </p>
        </div>
        
        <Tabs 
          value={String(selectedTimeframe)} 
          onValueChange={(value) => setSelectedTimeframe(Number(value))}
        >
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
            <TabsTrigger value="90">90 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Analytics Summary */}
      {analytics && renderAnalyticsSummary()}

      {/* Main Content Grid */}
      <div className={cn(
        'grid gap-6',
        isMobile ? 'grid-cols-1' : cols === 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'
      )}>
        {/* Consistency Chart */}
        {renderConsistencyChart()}

        {/* Recent Progress */}
        {showRecentProgress && renderRecentProgress()}

        {/* Leaderboard */}
        {showLeaderboard && renderLeaderboard()}
      </div>
    </div>
  )
}

export default ProgressDashboard