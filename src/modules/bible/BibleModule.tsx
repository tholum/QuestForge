'use client';

import React, { useState, useEffect } from 'react';
import { IModule, Achievement, PointsConfiguration, ModuleCapability } from '../../types/module';
import { BibleDashboardData, BibleModuleConfig } from './types';
// import { bibleAPIService } from './services/BibleAPIService';
import { bibleDashboardRepository } from '../../lib/prisma/repositories/bible-repository';

// UI Component imports 
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

/**
 * Bible Study Dashboard Component
 */
const BibleStudyDashboard = ({ userId }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  const [dashboardData, setDashboardData] = useState<BibleDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await bibleDashboardRepository.getDashboardData(userId);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-800">Bible Study Dashboard</h3>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          🔥 {dashboardData?.readingStreak || 0} day streak
        </Badge>
      </div>

      {/* Today's Reading Card */}
      {dashboardData?.todaysReadings.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Today's Reading</h4>
          {dashboardData.todaysReadings.map((reading) => (
            <div key={reading.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{reading.plan.name}</span>
                {reading.isCompleted ? (
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                ) : (
                  <Button size="sm" variant="outline">Start Reading</Button>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {Array.isArray(reading.passages) ? (reading.passages as string[]).join(', ') : 'No passages'}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardData?.stats.totalPlans || 0}</div>
            <div className="text-sm text-gray-600">Active Plans</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardData?.stats.completedReadingsThisWeek || 0}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dashboardData?.stats.studySessionsThisMonth || 0}</div>
            <div className="text-sm text-gray-600">Study Sessions</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{dashboardData?.activePrayerRequests.length || 0}</div>
            <div className="text-sm text-gray-600">Active Prayers</div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Recent Study Sessions</h4>
        {dashboardData?.recentStudySessions.length === 0 ? (
          <p className="text-sm text-gray-500">No recent study sessions. Start your first session!</p>
        ) : (
          <div className="space-y-2">
            {dashboardData?.recentStudySessions.slice(0, 3).map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <div className="font-medium text-sm">{session.title}</div>
                  <div className="text-xs text-gray-500">
                    {session.durationMinutes ? `${session.durationMinutes} minutes` : 'No duration'} • 
                    {new Date(session.studyDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="sm">
          📖 Start Reading
        </Button>
        <Button variant="outline" size="sm">
          📝 Log Study
        </Button>
        <Button variant="outline" size="sm">
          🙏 Add Prayer
        </Button>
        <Button variant="outline" size="sm">
          🔖 Bookmark Verse
        </Button>
      </div>
    </div>
  );
};

/**
 * Bible Mobile Quick Add Component
 */
const BibleMobileQuickAdd = ({ onSuccess, onCancel }: { moduleId: string; userId: string; onSuccess?: () => void; onCancel?: () => void }) => {
  const [activeTab, setActiveTab] = useState('reading');
  const [formData, setFormData] = useState({
    // Reading completion
    readingId: '',
    readingTime: '',
    notes: '',
    // Study session
    studyTitle: '',
    studyDuration: '',
    studyNotes: '',
    // Prayer request
    prayerTitle: '',
    prayerCategory: 'personal' as const,
    prayerDescription: '',
    // Bookmark
    bookmarkReference: '',
    bookmarkNotes: ''
  });

  const handleSubmit = async (type: string) => {
    try {
      let endpoint = '';
      let data: Record<string, unknown> = {};

      switch (type) {
        case 'reading':
          endpoint = '/api/v1/modules/bible/readings/complete';
          data = {
            readingId: formData.readingId,
            readingTimeMinutes: parseInt(formData.readingTime) || undefined,
            notes: formData.notes || undefined
          };
          break;
        case 'study':
          endpoint = '/api/v1/modules/bible/study-sessions';
          data = {
            title: formData.studyTitle,
            durationMinutes: parseInt(formData.studyDuration) || undefined,
            notes: formData.studyNotes || undefined,
            studyDate: new Date()
          };
          break;
        case 'prayer':
          endpoint = '/api/v1/modules/bible/prayer-requests';
          data = {
            title: formData.prayerTitle,
            category: formData.prayerCategory,
            description: formData.prayerDescription || undefined,
            requestDate: new Date()
          };
          break;
        case 'bookmark':
          endpoint = '/api/v1/modules/bible/bookmarks';
          data = {
            reference: formData.bookmarkReference,
            notes: formData.bookmarkNotes || undefined
          };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        onSuccess?.();
      } else {
        console.error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Quick Bible Study Actions</h3>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reading" className="text-xs">Reading</TabsTrigger>
          <TabsTrigger value="study" className="text-xs">Study</TabsTrigger>
          <TabsTrigger value="prayer" className="text-xs">Prayer</TabsTrigger>
          <TabsTrigger value="bookmark" className="text-xs">Bookmark</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Reading Time (minutes)</label>
            <Input
              type="number"
              value={formData.readingTime}
              onChange={(e) => setFormData({...formData, readingTime: e.target.value})}
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Reflections on today's reading..."
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('reading')} className="w-full">
            Complete Reading
          </Button>
        </TabsContent>

        <TabsContent value="study" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Study Title</label>
            <Input
              value={formData.studyTitle}
              onChange={(e) => setFormData({...formData, studyTitle: e.target.value})}
              placeholder="Romans 8 Study"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
            <Input
              type="number"
              value={formData.studyDuration}
              onChange={(e) => setFormData({...formData, studyDuration: e.target.value})}
              placeholder="45"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Study Notes</label>
            <Textarea
              value={formData.studyNotes}
              onChange={(e) => setFormData({...formData, studyNotes: e.target.value})}
              placeholder="Key insights and applications..."
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('study')} className="w-full">
            Log Study Session
          </Button>
        </TabsContent>

        <TabsContent value="prayer" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prayer Request</label>
            <Input
              value={formData.prayerTitle}
              onChange={(e) => setFormData({...formData, prayerTitle: e.target.value})}
              placeholder="Prayer for wisdom in decisions"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select
              value={formData.prayerCategory}
              onValueChange={(value) => setFormData({...formData, prayerCategory: value as any})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="ministry">Ministry</SelectItem>
                <SelectItem value="world">World</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.prayerDescription}
              onChange={(e) => setFormData({...formData, prayerDescription: e.target.value})}
              placeholder="Additional details..."
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('prayer')} className="w-full">
            Add Prayer Request
          </Button>
        </TabsContent>

        <TabsContent value="bookmark" className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Scripture Reference</label>
            <Input
              value={formData.bookmarkReference}
              onChange={(e) => setFormData({...formData, bookmarkReference: e.target.value})}
              placeholder="John 3:16"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={formData.bookmarkNotes}
              onChange={(e) => setFormData({...formData, bookmarkNotes: e.target.value})}
              placeholder="Why this verse is meaningful..."
              rows={3}
            />
          </div>
          <Button onClick={() => handleSubmit('bookmark')} className="w-full">
            Save Bookmark
          </Button>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 mt-6">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

/**
 * Bible Desktop Detail Component
 */
const BibleDesktopDetail = ({ moduleId, userId, config }: { moduleId: string; userId: string; config: Record<string, unknown> }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Bible Study Center</h2>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reading">Reading Plans</TabsTrigger>
          <TabsTrigger value="study">Study Sessions</TabsTrigger>
          <TabsTrigger value="prayer">Prayer Journal</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <BibleStudyDashboard moduleId={moduleId} userId={userId} config={config} />
        </TabsContent>

        <TabsContent value="reading" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Your Reading Plans</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">One Year Chronological</h4>
                      <Badge>Active</Badge>
                    </div>
                    <Progress value={65} className="mb-2" />
                    <div className="text-sm text-gray-600">237 of 365 days complete</div>
                  </div>
                </div>
                <Button className="mt-4" variant="outline">
                  Create New Reading Plan
                </Button>
              </Card>
            </div>
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Plans</h3>
                <div className="space-y-3">
                  <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <h4 className="font-medium text-sm">New Testament 30 Days</h4>
                    <p className="text-xs text-gray-600">Intensive NT reading</p>
                  </div>
                  <div className="p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <h4 className="font-medium text-sm">Psalms & Proverbs</h4>
                    <p className="text-xs text-gray-600">Daily wisdom</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="study" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Study Sessions</h3>
              <Button>New Study Session</Button>
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Romans 8 Study</h4>
                    <span className="text-sm text-gray-500">{i} days ago</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    45 minutes • Romans 8:1-17
                  </p>
                  <p className="text-sm">
                    Explored themes of freedom from condemnation and life in the Spirit...
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prayer" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Active Prayer Requests</h3>
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-blue-400 bg-blue-50">
                  <h4 className="font-medium text-sm">Wisdom for career decision</h4>
                  <p className="text-xs text-gray-600 mt-1">Personal • 3 days ago</p>
                </div>
                <div className="p-3 border-l-4 border-green-400 bg-green-50">
                  <h4 className="font-medium text-sm">Family health concerns</h4>
                  <p className="text-xs text-gray-600 mt-1">Family • 1 week ago</p>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="outline">
                Add Prayer Request
              </Button>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Answered Prayers</h3>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-sm">Job interview success</h4>
                  <p className="text-xs text-gray-600 mt-1">Answered 2 weeks ago</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Scripture Bookmarks</h3>
              <Button>Add Bookmark</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['John 3:16', 'Romans 8:28', 'Philippians 4:13'].map((verse) => (
                <div key={verse} className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">{verse}</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    &quot;For God so loved the world that he gave his one and only Son...&quot;
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">salvation</Badge>
                    <Badge variant="outline" className="text-xs">love</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Bible Settings Component
 */
const BibleSettings = ({ config, onConfigChange }: { moduleId: string; config: Record<string, unknown>; onConfigChange: (config: Record<string, unknown>) => void }) => {
  const [settings, setSettings] = useState<BibleModuleConfig>({
    preferredVersion: 'ESV',
    enableReadingReminders: true,
    reminderTime: '07:00',
    autoCreateGoals: true,
    defaultStudyDuration: 30,
    enablePrayerJournal: true,
    enableBookmarks: true,
    shareBookmarks: false,
    ...config
  });

  const handleSettingChange = (key: keyof BibleModuleConfig, value: unknown) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onConfigChange(newSettings);
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold">Bible Study Settings</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Bible Version</label>
          <Select
            value={settings.preferredVersion}
            onValueChange={(value) => handleSettingChange('preferredVersion', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV">ESV (English Standard Version)</SelectItem>
              <SelectItem value="NIV">NIV (New International Version)</SelectItem>
              <SelectItem value="KJV">KJV (King James Version)</SelectItem>
              <SelectItem value="WEB">WEB (World English Bible)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableReadingReminders}
              onChange={(e) => handleSettingChange('enableReadingReminders', e.target.checked)}
            />
            <span className="text-sm font-medium">Enable daily reading reminders</span>
          </label>
        </div>

        {settings.enableReadingReminders && (
          <div>
            <label className="block text-sm font-medium mb-2">Reminder Time</label>
            <Input
              type="time"
              value={settings.reminderTime}
              onChange={(e) => handleSettingChange('reminderTime', e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoCreateGoals}
              onChange={(e) => handleSettingChange('autoCreateGoals', e.target.checked)}
            />
            <span className="text-sm font-medium">Automatically create goals for reading plans</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Default Study Session Duration (minutes)</label>
          <Input
            type="number"
            value={settings.defaultStudyDuration}
            onChange={(e) => handleSettingChange('defaultStudyDuration', parseInt(e.target.value))}
            min="5"
            max="180"
          />
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enablePrayerJournal}
              onChange={(e) => handleSettingChange('enablePrayerJournal', e.target.checked)}
            />
            <span className="text-sm font-medium">Enable prayer journal</span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.enableBookmarks}
              onChange={(e) => handleSettingChange('enableBookmarks', e.target.checked)}
            />
            <span className="text-sm font-medium">Enable scripture bookmarks</span>
          </label>
        </div>

        {settings.enableBookmarks && (
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.shareBookmarks}
                onChange={(e) => handleSettingChange('shareBookmarks', e.target.checked)}
              />
              <span className="text-sm font-medium">Share bookmarks publicly (when not private)</span>
            </label>
          </div>
        )}
      </div>

      <div className="pt-4 border-t">
        <h4 className="font-medium mb-2">Data Management</h4>
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            Export Bible Study Data
          </Button>
          <Button variant="outline" size="sm">
            Import Reading Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

// Define achievements for the Bible module
const bibleAchievements: Achievement[] = [
  {
    id: 'first_reading',
    name: 'First Steps in Faith',
    description: 'Complete your first Bible reading',
    icon: 'book-open',
    tier: 'bronze',
    conditions: { type: 'count', target: 1, field: 'readingsCompleted' },
    xpReward: 25
  },
  {
    id: 'week_consistent',
    name: 'Faithful Reader',
    description: 'Read for 7 consecutive days',
    icon: 'calendar',
    tier: 'silver',
    conditions: { type: 'streak', target: 7, field: 'readingStreak' },
    xpReward: 100
  },
  {
    id: 'chapter_master',
    name: 'Chapter Master',
    description: 'Complete 100 Bible readings',
    icon: 'trophy',
    tier: 'gold',
    conditions: { type: 'count', target: 100, field: 'totalReadings' },
    xpReward: 300
  },
  {
    id: 'prayer_warrior',
    name: 'Prayer Warrior',
    description: 'Log 50 prayer requests',
    icon: 'heart',
    tier: 'gold',
    conditions: { type: 'count', target: 50, field: 'prayerRequests' },
    xpReward: 250
  },
  {
    id: 'year_reader',
    name: 'Annual Scholar',
    description: 'Complete a one-year reading plan',
    icon: 'crown',
    tier: 'platinum',
    conditions: { type: 'completion', field: 'yearPlanCompleted' },
    xpReward: 1000
  }
];

const biblePointsConfig: PointsConfiguration = {
  actions: {
    complete_reading: {
      basePoints: 15,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Complete a daily Bible reading'
    },
    log_study_session: {
      basePoints: 20,
      difficultyMultiplier: true,
      streakBonus: true,
      description: 'Log a Bible study session'
    },
    add_prayer_request: {
      basePoints: 5,
      difficultyMultiplier: false,
      streakBonus: true,
      description: 'Add a prayer request'
    },
    bookmark_verse: {
      basePoints: 3,
      difficultyMultiplier: false,
      streakBonus: false,
      description: 'Bookmark a scripture verse'
    },
    answer_prayer: {
      basePoints: 10,
      difficultyMultiplier: false,
      streakBonus: false,
      description: 'Mark a prayer as answered'
    }
  },
  difficultyMultipliers: {
    easy: 1,
    medium: 1.25,
    hard: 1.5,
    expert: 2
  },
  streakBonusPercentage: 20 // Higher bonus to encourage daily reading
};

// Define module capabilities
const bibleCapabilities: ModuleCapability[] = [
  {
    id: 'reading_plans',
    name: 'Reading Plans',
    description: 'Create and manage Bible reading plans',
    required: true
  },
  {
    id: 'study_sessions',
    name: 'Study Sessions',
    description: 'Log and track Bible study sessions',
    required: true
  },
  {
    id: 'prayer_journal',
    name: 'Prayer Journal',
    description: 'Track prayer requests and answers',
    required: false
  },
  {
    id: 'scripture_bookmarks',
    name: 'Scripture Bookmarks',
    description: 'Save and organize favorite verses',
    required: false
  },
  {
    id: 'bible_api',
    name: 'Bible Text API',
    description: 'Access to Bible text from multiple sources',
    required: true
  }
];

// Main Bible module implementation
export const BibleModule: IModule = {
  id: 'bible',
  name: 'Bible Study',
  version: '1.0.0',
  icon: 'book-open',
  color: '#3B82F6',

  metadata: {
    id: 'bible',
    name: 'Bible Study',
    version: '1.0.0',
    author: 'Goal Assistant Team',
    description: 'Comprehensive Bible study module with reading plans, study sessions, prayer journal, and scripture bookmarks',
    keywords: ['bible', 'study', 'reading', 'prayer', 'scripture', 'devotional', 'faith'],
    homepage: 'https://goalassistant.app/modules/bible',
    repository: 'https://github.com/goalassistant/modules/bible',
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
    peerDependencies: {}
  },

  components: {
    dashboard: BibleStudyDashboard,
    mobileQuickAdd: BibleMobileQuickAdd,
    desktopDetail: BibleDesktopDetail,
    settings: BibleSettings
  },

  achievements: bibleAchievements,
  pointsConfig: biblePointsConfig,
  capabilities: bibleCapabilities,

  permissions: [
    'read:bible_data',
    'write:bible_data',
    'read:prayer_data',
    'write:prayer_data',
    'read:scripture_bookmarks',
    'write:scripture_bookmarks'
  ],

  // API routes definition
  apiRoutes: {
    baseRoute: '/api/v1/modules/bible',
    routes: [
      {
        path: '/',
        method: 'GET',
        handler: 'getBibleDashboard',
        permissions: ['read:bible_data']
      },
      {
        path: '/reading-plans',
        method: 'GET',
        handler: 'getReadingPlans',
        permissions: ['read:bible_data']
      },
      {
        path: '/reading-plans',
        method: 'POST',
        handler: 'createReadingPlan',
        permissions: ['write:bible_data']
      },
      {
        path: '/readings/complete',
        method: 'POST',
        handler: 'completeReading',
        permissions: ['write:bible_data']
      },
      {
        path: '/study-sessions',
        method: 'GET',
        handler: 'getStudySessions',
        permissions: ['read:bible_data']
      },
      {
        path: '/study-sessions',
        method: 'POST',
        handler: 'createStudySession',
        permissions: ['write:bible_data']
      },
      {
        path: '/prayer-requests',
        method: 'GET',
        handler: 'getPrayerRequests',
        permissions: ['read:prayer_data']
      },
      {
        path: '/prayer-requests',
        method: 'POST',
        handler: 'createPrayerRequest',
        permissions: ['write:prayer_data']
      },
      {
        path: '/bookmarks',
        method: 'GET',
        handler: 'getBookmarks',
        permissions: ['read:scripture_bookmarks']
      },
      {
        path: '/bookmarks',
        method: 'POST',
        handler: 'createBookmark',
        permissions: ['write:scripture_bookmarks']
      }
    ]
  },

  // Lifecycle methods
  async onInstall(): Promise<void> {
    console.log('Installing Bible Study module...');
    // Initialize module-specific setup
  },

  async onUninstall(): Promise<void> {
    console.log('Uninstalling Bible Study module...');
    // Clean up module data
  },

  async onEnable(): Promise<void> {
    console.log('Enabling Bible Study module...');
    // Set up achievements, background tasks, etc.
  },

  async onDisable(): Promise<void> {
    console.log('Disabling Bible Study module...');
    // Disable background tasks
  },

  async onUpgrade(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Upgrading Bible Study module from ${fromVersion} to ${toVersion}...`);
    // Handle data migration
  },

  async onConfigChange(oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>): Promise<void> {
    console.log('Bible Study module configuration changed:', { oldConfig, newConfig });
    // React to configuration changes
  }
};