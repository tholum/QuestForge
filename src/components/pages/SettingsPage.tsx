"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useSettings } from '@/hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Bell,
  Shield,
  Monitor,
  User,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface SettingsSectionProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

function SettingsSection({ children, title, description }: SettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Separator />
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

interface SettingItemProps {
  id: string;
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingItem({ id, label, description, children }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex-1 space-y-1">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Settings page with tabbed interface for different setting categories
 */
export function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState('account');
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Settings hook
  const {
    settings,
    loading,
    error,
    isUpdating,
    updateSetting,
    updateMultipleSettings,
    getNotificationSettings,
    getPrivacySettings,
    getDisplaySettings,
    getAccountSettings,
    refetch
  } = useSettings();

  // Responsive detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current settings with defaults
  const notificationSettings = React.useMemo(() => getNotificationSettings(), [settings]);
  const privacySettings = React.useMemo(() => getPrivacySettings(), [settings]);
  const displaySettings = React.useMemo(() => getDisplaySettings(), [settings]);
  const accountSettings = React.useMemo(() => getAccountSettings(), [settings]);

  // Handle setting changes
  const handleSettingChange = async (category: string, key: string, value: any, dataType: 'string' | 'boolean' | 'number' = 'string') => {
    try {
      await updateSetting(category as any, key, value, dataType);
      setSaveMessage({ type: 'success', message: 'Setting updated successfully' });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to update setting:', error);
      setSaveMessage({ type: 'error', message: 'Failed to update setting' });
    }
  };

  // Handle bulk save (for when multiple settings change)
  const handleBulkSave = async (settingsToSave: Array<{
    category: string;
    key: string;
    value: any;
    dataType?: 'string' | 'boolean' | 'number';
  }>) => {
    try {
      await updateMultipleSettings(settingsToSave.map(s => ({
        category: s.category as any,
        key: s.key,
        value: s.value,
        dataType: s.dataType || 'string'
      })));
      setSaveMessage({ type: 'success', message: 'Settings saved successfully' });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveMessage({ type: 'error', message: 'Failed to save settings' });
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

  const tabConfig = [
    {
      id: 'account',
      label: 'Account',
      icon: User,
      description: 'Manage your account information and preferences'
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Control how and when you receive notifications'
    },
    {
      id: 'privacy',
      label: 'Privacy',
      icon: Shield,
      description: 'Manage your privacy and data sharing preferences'
    },
    {
      id: 'display',
      label: 'Display',
      icon: Monitor,
      description: 'Customize the appearance and behavior of the app'
    }
  ];

  return (
    <MainContent
      currentPage="settings"
      pageTitle="Settings"
      pageSubtitle="Manage your account and app preferences"
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
        </div>
      }
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load settings: {(error as Error).message}
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
            <span className="ml-2">Loading settings...</span>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <Card>
            <CardContent className="p-6">
              <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'} gap-4`}>
                {tabConfig.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <Icon className="w-4 h-4" />
                      <span className={isMobile ? 'hidden sm:inline' : ''}>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Manage your personal account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingsSection
                  title="Session & Security"
                  description="Configure account security and session preferences"
                >
                  <SettingItem
                    id="two-factor-auth"
                    label="Two-Factor Authentication"
                    description="Add an extra layer of security to your account"
                  >
                    <Switch
                      id="two-factor-auth"
                      checked={accountSettings.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        handleSettingChange('account', 'twoFactorAuth', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="session-timeout"
                    label="Session Timeout"
                    description="How long to keep you logged in when inactive (minutes)"
                  >
                    <Select
                      value={accountSettings.sessionTimeout.toString()}
                      onValueChange={(value) => 
                        handleSettingChange('account', 'sessionTimeout', parseInt(value), 'number')
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="480">8 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    id="login-history"
                    label="Login History"
                    description="Keep track of your login sessions"
                  >
                    <Switch
                      id="login-history"
                      checked={accountSettings.loginHistory}
                      onCheckedChange={(checked) => 
                        handleSettingChange('account', 'loginHistory', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>
                </SettingsSection>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingsSection
                  title="Communication Preferences"
                  description="Manage how we communicate with you"
                >
                  <SettingItem
                    id="email-notifications"
                    label="Email Notifications"
                    description="Receive notifications via email"
                  >
                    <Switch
                      id="email-notifications"
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => 
                        handleSettingChange('notification', 'emailNotifications', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="push-notifications"
                    label="Push Notifications"
                    description="Receive browser push notifications"
                  >
                    <Switch
                      id="push-notifications"
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => 
                        handleSettingChange('notification', 'pushNotifications', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="weekly-digest"
                    label="Weekly Progress Digest"
                    description="Get a summary of your weekly progress"
                  >
                    <Switch
                      id="weekly-digest"
                      checked={notificationSettings.weeklyDigest}
                      onCheckedChange={(checked) => 
                        handleSettingChange('notification', 'weeklyDigest', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="achievement-alerts"
                    label="Achievement Alerts"
                    description="Get notified when you unlock achievements"
                  >
                    <Switch
                      id="achievement-alerts"
                      checked={notificationSettings.achievementAlerts}
                      onCheckedChange={(checked) => 
                        handleSettingChange('notification', 'achievementAlerts', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="goal-reminders"
                    label="Goal Reminders"
                    description="Receive reminders about your goals"
                  >
                    <Switch
                      id="goal-reminders"
                      checked={notificationSettings.goalReminders}
                      onCheckedChange={(checked) => 
                        handleSettingChange('notification', 'goalReminders', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>
                </SettingsSection>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Privacy & Data
                </CardTitle>
                <CardDescription>
                  Control your privacy and data sharing preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingsSection
                  title="Data & Privacy"
                  description="Manage how your data is used and shared"
                >
                  <SettingItem
                    id="profile-visibility"
                    label="Profile Visibility"
                    description="Control who can see your profile information"
                  >
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value) => 
                        handleSettingChange('privacy', 'profileVisibility', value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="friends">Friends</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    id="analytics-sharing"
                    label="Analytics Sharing"
                    description="Help improve the app by sharing anonymous usage data"
                  >
                    <Switch
                      id="analytics-sharing"
                      checked={privacySettings.analyticsSharing}
                      onCheckedChange={(checked) => 
                        handleSettingChange('privacy', 'analyticsSharing', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>

                  <SettingItem
                    id="data-export"
                    label="Data Export"
                    description="Allow exporting your personal data"
                  >
                    <Switch
                      id="data-export"
                      checked={privacySettings.dataExport}
                      onCheckedChange={(checked) => 
                        handleSettingChange('privacy', 'dataExport', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>
                </SettingsSection>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2" />
                  Display & Interface
                </CardTitle>
                <CardDescription>
                  Customize how the application looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SettingsSection
                  title="Appearance"
                  description="Customize the visual appearance of the application"
                >
                  <SettingItem
                    id="theme"
                    label="Theme"
                    description="Choose between light and dark theme"
                  >
                    <Select
                      value={displaySettings.theme}
                      onValueChange={(value) => 
                        handleSettingChange('display', 'theme', value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    id="density"
                    label="Display Density"
                    description="Adjust the spacing and size of interface elements"
                  >
                    <Select
                      value={displaySettings.density}
                      onValueChange={(value) => 
                        handleSettingChange('display', 'density', value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    id="animations"
                    label="Animations"
                    description="Enable smooth transitions and animations"
                  >
                    <Switch
                      id="animations"
                      checked={displaySettings.animations}
                      onCheckedChange={(checked) => 
                        handleSettingChange('display', 'animations', checked, 'boolean')
                      }
                      disabled={isUpdating}
                    />
                  </SettingItem>
                </SettingsSection>

                <SettingsSection
                  title="Localization"
                  description="Configure language and regional settings"
                >
                  <SettingItem
                    id="language"
                    label="Language"
                    description="Choose your preferred language"
                  >
                    <Select
                      value={displaySettings.language}
                      onValueChange={(value) => 
                        handleSettingChange('display', 'language', value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="en-GB">English (UK)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <SettingItem
                    id="date-format"
                    label="Date Format"
                    description="Choose how dates are displayed"
                  >
                    <Select
                      value={displaySettings.dateFormat}
                      onValueChange={(value) => 
                        handleSettingChange('display', 'dateFormat', value)
                      }
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM dd, yyyy">MMM DD, YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>
                </SettingsSection>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </MainContent>
  );
}

export default SettingsPage;