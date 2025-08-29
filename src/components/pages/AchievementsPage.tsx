"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useAchievements } from '@/hooks/useAchievements';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, Star, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Achievements page displaying unlocked and available achievements
 */
export function AchievementsPage() {
  const {
    achievements,
    summary,
    loading,
    error,
    isCheckingAll,
    checkAllAchievements,
    getCompletedAchievements,
    getPendingAchievements,
    getTierProgress,
    refetch
  } = useAchievements();

  const completedAchievements = getCompletedAchievements();
  const pendingAchievements = getPendingAchievements();
  const tierProgress = getTierProgress();

  const handleRefresh = async () => {
    await refetch();
  };

  const handleCheckAll = async () => {
    await checkAllAchievements();
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'platinum': return <Star className="w-5 h-5 text-purple-600" />;
      case 'gold': return <Trophy className="w-5 h-5 text-yellow-600" />;
      case 'silver': return <Award className="w-5 h-5 text-gray-500" />;
      default: return <Award className="w-5 h-5 text-orange-600" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum': return 'border-purple-200 bg-purple-50';
      case 'gold': return 'border-yellow-200 bg-yellow-50';
      case 'silver': return 'border-gray-200 bg-gray-50';
      default: return 'border-orange-200 bg-orange-50';
    }
  };

  return (
    <MainContent
      currentPage="achievements"
      pageTitle="Achievements"
      pageSubtitle={loading ? "Loading..." : `${summary.completed} of ${summary.total} unlocked (${summary.completionRate}%)`}
      pageActions={
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleCheckAll}
            disabled={isCheckingAll}
          >
            {isCheckingAll ? (
              <LoadingSpinner size="small" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Check All
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
            Failed to load achievements: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
            <span className="ml-2">Loading achievements...</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Tier Progress */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tierProgress.map((tier) => (
              <Card key={tier.tier} className={getTierColor(tier.tier)}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    {getTierIcon(tier.tier)}
                    <div>
                      <p className="text-sm font-medium capitalize">{tier.tier}</p>
                      <p className="text-lg font-bold">{tier.completed}/{tier.total}</p>
                      <p className="text-xs text-muted-foreground">{tier.completionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Achievement Tabs */}
          <Tabs defaultValue="completed" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending">In Progress</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {completedAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedAchievements.map((achievement) => (
                    <Card key={achievement.id} className={`${getTierColor(achievement.tier)} border-2`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl">{achievement.icon}</div>
                          <Badge variant="default">Completed</Badge>
                        </div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium">+{achievement.xpReward} XP</span>
                          <span className="text-muted-foreground">
                            {achievement.userProgress.unlockedAt && 
                              new Date(achievement.userProgress.unlockedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No achievements yet</h3>
                    <p className="text-muted-foreground">Complete goals to unlock achievements.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4 mt-6">
              {pendingAchievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingAchievements.map((achievement) => (
                    <Card key={achievement.id} className={getTierColor(achievement.tier)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="text-2xl opacity-60">{achievement.icon}</div>
                          <Badge variant="secondary">In Progress</Badge>
                        </div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        <div className="space-y-2">
                          <Progress value={achievement.userProgress.progress} className="h-2" />
                          <div className="flex justify-between items-center text-sm">
                            <span>{Math.round(achievement.userProgress.progress)}% complete</span>
                            <span className="font-medium">+{achievement.xpReward} XP</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No pending achievements</h3>
                    <p className="text-muted-foreground">All available achievements are completed.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4 mt-6">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <Card 
                      key={achievement.id} 
                      className={`${getTierColor(achievement.tier)} ${achievement.userProgress.isCompleted ? 'border-2' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className={`text-2xl ${!achievement.userProgress.isCompleted && 'opacity-60'}`}>
                            {achievement.icon}
                          </div>
                          <Badge variant={achievement.userProgress.isCompleted ? "default" : "secondary"}>
                            {achievement.userProgress.isCompleted ? "Completed" : "Locked"}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                        {achievement.userProgress.isCompleted ? (
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">+{achievement.xpReward} XP</span>
                            <span className="text-muted-foreground">
                              {achievement.userProgress.unlockedAt && 
                                new Date(achievement.userProgress.unlockedAt).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Progress value={achievement.userProgress.progress} className="h-2" />
                            <div className="flex justify-between items-center text-sm">
                              <span>{Math.round(achievement.userProgress.progress)}% complete</span>
                              <span className="font-medium">+{achievement.xpReward} XP</span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No achievements available</h3>
                    <p className="text-muted-foreground">Achievements will appear as you use the app.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </MainContent>
  );
}

export default AchievementsPage;