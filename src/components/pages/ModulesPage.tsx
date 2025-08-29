"use client"

import * as React from 'react';
import { MainContent } from '@/components/layout/MainContent';
import { useModules } from '@/hooks/useModules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/base/LoadingSpinner';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Puzzle,
  Settings,
  Activity,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Power,
  PowerOff,
  BookOpen,
  Dumbbell,
  Briefcase,
  Home,
  Heart,
  Wrench,
  Save,
  RotateCcw,
  TrendingUp
} from 'lucide-react';

interface ModuleIconProps {
  moduleId: string;
  className?: string;
}

function ModuleIcon({ moduleId, className = "w-5 h-5" }: ModuleIconProps) {
  const iconMap: Record<string, React.ElementType> = {
    bible: Heart,
    fitness: Dumbbell,
    work: Briefcase,
    home: Home,
    learning: BookOpen,
    default: Puzzle
  };
  
  const Icon = iconMap[moduleId] || iconMap.default;
  return <Icon className={className} />;
}

interface ModuleCardProps {
  config: any;
  onToggle: (moduleId: string, enabled: boolean) => void;
  onConfigure: (config: any) => void;
  onTrackUsage: (moduleId: string) => void;
  isUpdating: boolean;
}

function ModuleCard({ config, onToggle, onConfigure, onTrackUsage, isUpdating }: ModuleCardProps) {
  const { module, isEnabled, lastUsedAt, usageCount } = config;
  
  if (!module) return null;

  const handleToggle = async (checked: boolean) => {
    await onToggle(config.moduleId, checked);
    if (checked) {
      onTrackUsage(config.moduleId);
    }
  };

  const getStatusColor = () => {
    if (!isEnabled) return 'text-red-600 bg-red-50';
    if (!lastUsedAt) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = () => {
    if (!isEnabled) return 'Disabled';
    if (!lastUsedAt) return 'Not Used';
    return 'Active';
  };

  const daysSinceLastUse = lastUsedAt 
    ? Math.floor((new Date().getTime() - new Date(lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Card className="relative transition-all hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ModuleIcon moduleId={config.moduleId} className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{module.name}</CardTitle>
              <CardDescription className="text-sm">
                Version {module.version}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <Switch
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Usage Statistics */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Usage Count</p>
              <p className="font-medium">{usageCount} times</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Used</p>
              <p className="font-medium">
                {lastUsedAt 
                  ? daysSinceLastUse === 0 
                    ? 'Today' 
                    : daysSinceLastUse === 1 
                    ? 'Yesterday' 
                    : `${daysSinceLastUse} days ago`
                  : 'Never'
                }
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(config)}
              disabled={!isEnabled}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTrackUsage(config.moduleId)}>
                  <Activity className="w-4 h-4 mr-2" />
                  Track Usage
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onToggle(config.moduleId, !isEnabled)}
                  disabled={isUpdating}
                >
                  {isEnabled ? (
                    <>
                      <PowerOff className="w-4 h-4 mr-2" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-2" />
                      Enable
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModuleConfigDialogProps {
  config: any;
  onSave: (moduleId: string, configuration: any) => Promise<void>;
  onClose: () => void;
  isUpdating: boolean;
}

function ModuleConfigDialog({ config, onSave, onClose, isUpdating }: ModuleConfigDialogProps) {
  const [formData, setFormData] = React.useState(config?.configuration || {});

  const handleSave = async () => {
    try {
      await onSave(config.moduleId, formData);
      onClose();
    } catch (error) {
      console.error('Failed to save module configuration:', error);
    }
  };

  const handleReset = () => {
    setFormData(config?.configuration || {});
  };

  // Generic configuration form based on module type
  const renderConfigForm = () => {
    switch (config.moduleId) {
      case 'bible':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred-version">Preferred Bible Version</Label>
              <Select
                value={formData.preferredVersion || 'ESV'}
                onValueChange={(value) => setFormData({ ...formData, preferredVersion: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ESV">ESV</SelectItem>
                  <SelectItem value="NIV">NIV</SelectItem>
                  <SelectItem value="NASB">NASB</SelectItem>
                  <SelectItem value="KJV">KJV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="daily-reminder">Daily Reading Reminder</Label>
              <Select
                value={formData.dailyReminderTime || '08:00'}
                onValueChange={(value) => setFormData({ ...formData, dailyReminderTime: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="20:00">8:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
        
      case 'fitness':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="preferred-units">Preferred Units</Label>
              <Select
                value={formData.preferredUnits || 'metric'}
                onValueChange={(value) => setFormData({ ...formData, preferredUnits: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (kg, km)</SelectItem>
                  <SelectItem value="imperial">Imperial (lbs, miles)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="workout-reminder">Workout Reminder</Label>
              <Switch
                id="workout-reminder"
                checked={formData.workoutReminder || false}
                onCheckedChange={(checked) => setFormData({ ...formData, workoutReminder: checked })}
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="notifications">Enable Notifications</Label>
              <Switch
                id="notifications"
                checked={formData.notifications || false}
                onCheckedChange={(checked) => setFormData({ ...formData, notifications: checked })}
              />
            </div>
            
            <div>
              <Label htmlFor="auto-sync">Auto Sync</Label>
              <Switch
                id="auto-sync"
                checked={formData.autoSync || false}
                onCheckedChange={(checked) => setFormData({ ...formData, autoSync: checked })}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={!!config} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ModuleIcon moduleId={config.moduleId} />
            <span>Configure {config.module?.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {renderConfigForm()}
          
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Modules page for managing module configurations
 */
export function ModulesPage() {
  const [selectedConfig, setSelectedConfig] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('all');
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);

  const {
    configurations,
    summary,
    loading,
    error,
    isUpdating,
    enableModule,
    disableModule,
    updateModuleConfiguration,
    trackModuleUsage,
    getEnabledModules,
    getDisabledModules,
    getRecentlyUsedModules,
    getMostUsedModules,
    getModulesByType,
    refetch
  } = useModules();

  // Handle module toggle
  const handleToggleModule = async (moduleId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await enableModule(moduleId);
        setSaveMessage({ type: 'success', message: 'Module enabled successfully' });
      } else {
        await disableModule(moduleId);
        setSaveMessage({ type: 'success', message: 'Module disabled successfully' });
      }
    } catch (error) {
      console.error('Failed to toggle module:', error);
      setSaveMessage({ type: 'error', message: 'Failed to update module' });
    }
  };

  // Handle module configuration
  const handleConfigureModule = (config: any) => {
    setSelectedConfig(config);
  };

  // Handle save configuration
  const handleSaveConfiguration = async (moduleId: string, configuration: any) => {
    try {
      await updateModuleConfiguration(moduleId, '', configuration);
      setSaveMessage({ type: 'success', message: 'Configuration saved successfully' });
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveMessage({ type: 'error', message: 'Failed to save configuration' });
    }
  };

  // Handle track usage
  const handleTrackUsage = async (moduleId: string) => {
    try {
      await trackModuleUsage(moduleId);
    } catch (error) {
      console.error('Failed to track usage:', error);
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

  // Get filtered configurations
  const getFilteredConfigurations = () => {
    switch (activeTab) {
      case 'enabled':
        return getEnabledModules();
      case 'disabled':
        return getDisabledModules();
      case 'recent':
        return getRecentlyUsedModules();
      default:
        return configurations;
    }
  };

  const filteredConfigurations = getFilteredConfigurations();

  return (
    <MainContent
      currentPage="modules"
      pageTitle="Modules"
      pageSubtitle={loading ? "Loading..." : `Manage your ${configurations.length} available modules`}
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
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load modules: {(error as Error).message}
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
            <span className="ml-2">Loading modules...</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Puzzle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Modules</p>
                    <p className="text-2xl font-bold">{summary.totalModules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Enabled</p>
                    <p className="text-2xl font-bold">{summary.enabledModules}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Recently Used</p>
                    <p className="text-2xl font-bold">{summary.recentlyUsed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Most Used</p>
                    <p className="text-2xl font-bold">
                      {getMostUsedModules(1)[0]?.module?.name?.slice(0, 8) || 'None'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Tabs */}
          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-lg grid-cols-4">
                  <TabsTrigger value="all">All Modules</TabsTrigger>
                  <TabsTrigger value="enabled">Enabled</TabsTrigger>
                  <TabsTrigger value="disabled">Disabled</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-6">
                  {filteredConfigurations.length === 0 ? (
                    <div className="text-center py-12">
                      <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No modules found</h3>
                      <p className="text-muted-foreground">
                        No modules match the current filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredConfigurations.map((config) => (
                        <ModuleCard
                          key={config.id}
                          config={config}
                          onToggle={handleToggleModule}
                          onConfigure={handleConfigureModule}
                          onTrackUsage={handleTrackUsage}
                          isUpdating={isUpdating}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Module Configuration Dialog */}
      {selectedConfig && (
        <ModuleConfigDialog
          config={selectedConfig}
          onSave={handleSaveConfiguration}
          onClose={() => setSelectedConfig(null)}
          isUpdating={isUpdating}
        />
      )}
    </MainContent>
  );
}

export default ModulesPage;