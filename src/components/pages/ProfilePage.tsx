"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Edit3,
  Calendar,
  Target,
  Trophy,
  Flame,
  MapPin,
  Mail,
  Clock,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Upload,
  Activity,
  TrendingUp,
  Award
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  color?: string;
  trend?: number;
}

function StatCard({ title, value, icon: Icon, description, color = "text-blue-600", trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold">{value}</p>
              {trend !== undefined && (
                <Badge variant={trend > 0 ? "default" : "secondary"} className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {trend > 0 ? '+' : ''}{trend}%
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EditProfileDialogProps {
  profile: any;
  onSave: (data: any) => Promise<void>;
  isUpdating: boolean;
}

function EditProfileDialog({ profile, onSave, isUpdating }: EditProfileDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    timezone: profile?.timezone || 'UTC',
    locale: profile?.locale || 'en-US'
  });

  const handleSave = async () => {
    try {
      await onSave(formData);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' }
  ];

  const locales = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'es-ES', label: 'Spanish (Spain)' },
    { value: 'fr-FR', label: 'French (France)' },
    { value: 'de-DE', label: 'German (Germany)' }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit3 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your display name"
            />
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us a bit about yourself..."
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => setFormData({ ...formData, timezone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="locale">Language</Label>
            <Select
              value={formData.locale}
              onValueChange={(value) => setFormData({ ...formData, locale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale.value} value={locale.value}>
                    {locale.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <LoadingSpinner size="small" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Profile page displaying user information and statistics
 */
export function ProfilePage() {
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

  const {
    profile,
    stats,
    loading,
    error,
    isUpdating,
    updateProfile,
    getProfileCompleteness,
    getLevelProgress,
    getTopModule,
    getActivitySummary,
    refetch
  } = useProfile();

  // Handle profile update
  const handleUpdateProfile = async (data: any) => {
    try {
      await updateProfile(data);
      setSaveMessage({ type: 'success', message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Failed to update profile:', error);
      setSaveMessage({ type: 'error', message: 'Failed to update profile' });
    }
  };

  // Clear save message after a few seconds
  React.useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  // Handle refresh
  const handleRefresh = async () => {
    await refetch();
  };

  // Get derived data
  const profileCompleteness = React.useMemo(() => getProfileCompleteness(), [profile]);
  const levelProgress = React.useMemo(() => getLevelProgress(), [stats]);
  const topModule = React.useMemo(() => getTopModule(), [stats]);
  const activitySummary = React.useMemo(() => getActivitySummary(), [stats]);

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainContent
      currentPage="profile"
      pageTitle="Profile"
      pageSubtitle="View and manage your profile information"
      pageActions={
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {profile && (
            <EditProfileDialog
              profile={profile}
              onSave={handleUpdateProfile}
              isUpdating={isUpdating}
            />
          )}
        </div>
      }
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load profile: {(error as Error).message}
          </AlertDescription>
        </Alert>
      )}

      {/* Success/Error Messages */}
      {saveMessage && (
        <Alert variant={saveMessage.type === 'success' ? 'default' : 'destructive'} className="mb-6">
          {saveMessage.type === 'success' ? 
            <CheckCircle2 className="h-4 w-4" /> : 
            <AlertCircle className="h-4 w-4" />
          }
          <AlertDescription>
            {saveMessage.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
            <span className="ml-2">Loading profile...</span>
          </CardContent>
        </Card>
      ) : profile ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile.profilePicture || undefined} />
                    <AvatarFallback className="text-lg">
                      {profile.name ? getUserInitials(profile.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 p-0"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <h2 className="text-2xl font-bold">{profile.name || 'Anonymous User'}</h2>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>{profile.email}</span>
                      {profile.emailVerified && (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-muted-foreground max-w-md">{profile.bio}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.timezone}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                    </div>
                    {profile.lastActiveAt && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Active {new Date(profile.lastActiveAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="outline" className="text-sm">
                    Level {stats?.gamification.currentLevel || 1}
                  </Badge>
                  <div className="text-right">
                    <p className="text-sm font-medium">Profile Completeness</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={profileCompleteness} className="w-20" />
                      <span className="text-sm text-muted-foreground">{profileCompleteness}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      Level {stats.gamification.currentLevel}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {levelProgress.xpToNext} XP to Level {levelProgress.nextLevel}
                    </span>
                  </div>
                  <Progress value={levelProgress.progress} className="h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Total XP: {stats.gamification.totalXp.toLocaleString()}</span>
                    <span>Achievements: {stats.gamification.achievementCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Statistics Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Goals"
                value={stats.goals.total}
                icon={Target}
                description="Goals created"
                color="text-blue-600"
              />
              <StatCard
                title="Completed"
                value={stats.goals.completed}
                icon={CheckCircle2}
                description={`${stats.goals.completionRate}% completion rate`}
                color="text-green-600"
              />
              <StatCard
                title="Current Streak"
                value={`${stats.activity.currentStreak} days`}
                icon={Flame}
                description="Days of consistent activity"
                color="text-orange-600"
              />
              <StatCard
                title="Total XP"
                value={stats.activity.totalXpEarned.toLocaleString()}
                icon={Trophy}
                description="Experience points earned"
                color="text-purple-600"
              />
            </div>
          )}

          {/* Activity Summary */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Module Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Module Activity
                  </CardTitle>
                  <CardDescription>
                    Your usage across different modules
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.moduleUsage.length > 0 ? (
                    <div className="space-y-4">
                      {stats.moduleUsage.slice(0, 5).map((module, index) => (
                        <div key={module.moduleId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 text-xs">
                              {index + 1}
                            </Badge>
                            <span className="font-medium">{module.moduleName}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {module.goalCount} goals
                          </span>
                        </div>
                      ))}
                      {topModule && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Most active: <span className="font-medium text-foreground">{topModule.moduleName}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No module activity yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest progress entries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm truncate">{activity.goal.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.goal.module} • {new Date(activity.recordedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">+{activity.xpEarned} XP</p>
                            <p className="text-xs text-muted-foreground">
                              {activity.value}/{activity.maxValue}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Profile not found</h3>
            <p className="text-muted-foreground">
              Unable to load your profile information.
            </p>
          </CardContent>
        </Card>
      )}
    </MainContent>
  );
}

export default ProfilePage;