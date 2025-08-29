"use client"

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useModal } from '@/components/layout/ModalProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Home,
  Target,
  TrendingUp,
  Settings,
  Search,
  Plus,
  Keyboard,
  ArrowRight
} from 'lucide-react';

export interface KeyboardShortcut {
  key: string;
  action: string;
  description: string;
  handler: () => void;
  category: string;
}

export interface KeyboardShortcutsProps {
  disabled?: boolean;
}

/**
 * Desktop keyboard shortcuts system
 * Features:
 * - Global keyboard shortcuts for navigation and actions
 * - Command palette with search functionality
 * - Shortcut help modal
 * - Context-aware shortcuts
 * - Accessibility compliance
 */
export function KeyboardShortcuts({ disabled = false }: KeyboardShortcutsProps) {
  const router = useRouter();
  const { openModal } = useModal();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'cmd+1',
      action: '⌘+1',
      description: 'Go to Dashboard',
      handler: () => router.push('/'),
      category: 'Navigation'
    },
    {
      key: 'cmd+2',
      action: '⌘+2',
      description: 'Go to Goals',
      handler: () => router.push('/goals'),
      category: 'Navigation'
    },
    {
      key: 'cmd+3',
      action: '⌘+3',
      description: 'Go to Progress',
      handler: () => router.push('/progress'),
      category: 'Navigation'
    },
    {
      key: 'cmd+4',
      action: '⌘+4',
      description: 'Go to Analytics',
      handler: () => router.push('/analytics'),
      category: 'Navigation'
    },
    {
      key: 'cmd+comma',
      action: '⌘+,',
      description: 'Open Settings',
      handler: () => router.push('/settings'),
      category: 'Navigation'
    },

    // Action shortcuts
    {
      key: 'cmd+n',
      action: '⌘+N',
      description: 'New Goal',
      handler: () => router.push('/goals/new'),
      category: 'Actions'
    },
    {
      key: 'cmd+shift+n',
      action: '⌘+⇧+N',
      description: 'Quick Add',
      handler: () => router.push('/quick-add'),
      category: 'Actions'
    },

    // Search shortcuts
    {
      key: 'cmd+k',
      action: '⌘+K',
      description: 'Open Command Palette',
      handler: () => setIsCommandPaletteOpen(true),
      category: 'Search'
    },
    {
      key: 'cmd+f',
      action: '⌘+F',
      description: 'Search',
      handler: () => {
        const searchInput = document.querySelector('[placeholder*="Search"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      category: 'Search'
    },

    // Help shortcuts
    {
      key: 'cmd+shift+slash',
      action: '⌘+⇧+?',
      description: 'Show Keyboard Shortcuts',
      handler: () => showShortcutsModal(),
      category: 'Help'
    }
  ];

  // Handle keyboard events
  React.useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Convert event to shortcut key
      let shortcutKey = '';
      if (cmdKey) shortcutKey += 'cmd+';
      if (event.shiftKey) shortcutKey += 'shift+';
      if (event.altKey) shortcutKey += 'alt+';

      // Handle special keys
      const key = event.key.toLowerCase();
      if (key === ',') shortcutKey += 'comma';
      else if (key === '/') shortcutKey += 'slash';
      else if (key >= '1' && key <= '9') shortcutKey += key;
      else shortcutKey += key;

      // Find and execute matching shortcut
      const matchingShortcut = shortcuts.find(s => s.key === shortcutKey);
      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, shortcuts, router]);

  // Show shortcuts help modal
  const showShortcutsModal = () => {
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    openModal({
      id: 'keyboard-shortcuts',
      title: 'Keyboard Shortcuts',
      description: 'Speed up your workflow with these keyboard shortcuts',
      size: 'lg',
      content: (
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between py-2">
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {shortcut.action.replace('cmd', navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Press <Badge variant="secondary" className="mx-1">⌘+K</Badge> to open the command palette for quick access to all features.
            </p>
          </div>
        </div>
      ),
      footer: (
        <Button onClick={() => setIsCommandPaletteOpen(true)}>
          <Keyboard className="w-4 h-4 mr-2" />
          Open Command Palette
        </Button>
      )
    });
  };

  // Command palette items
  const commandItems = [
    { id: 'dashboard', title: 'Dashboard', subtitle: 'View your overview', icon: Home, action: () => router.push('/') },
    { id: 'goals', title: 'Goals', subtitle: 'Manage your goals', icon: Target, action: () => router.push('/goals') },
    { id: 'progress', title: 'Progress', subtitle: 'Track your progress', icon: TrendingUp, action: () => router.push('/progress') },
    { id: 'new-goal', title: 'New Goal', subtitle: 'Create a new goal', icon: Plus, action: () => router.push('/goals/new') },
    { id: 'settings', title: 'Settings', subtitle: 'Application settings', icon: Settings, action: () => router.push('/settings') },
  ];

  return (
    <>
      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 w-full max-w-lg">
            <Command className="rounded-lg border shadow-md bg-background">
              <div className="flex items-center border-b px-3">
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                <CommandInput
                  placeholder="Search commands..."
                  className="border-0 focus:ring-0"
                  autoFocus
                />
              </div>
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                
                <CommandGroup heading="Quick Actions">
                  {commandItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandItem
                        key={item.id}
                        onSelect={() => {
                          item.action();
                          setIsCommandPaletteOpen(false);
                        }}
                        className="flex items-center space-x-3 px-3 py-2"
                      >
                        <Icon className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.subtitle}</div>
                        </div>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Modules">
                  <CommandItem onSelect={() => { router.push('/modules/fitness'); setIsCommandPaletteOpen(false); }}>
                    <span>🏃‍♂️ Fitness Module</span>
                  </CommandItem>
                  <CommandItem onSelect={() => { router.push('/modules/learning'); setIsCommandPaletteOpen(false); }}>
                    <span>📚 Learning Module</span>
                  </CommandItem>
                  <CommandItem onSelect={() => { router.push('/modules/home'); setIsCommandPaletteOpen(false); }}>
                    <span>🏠 Home Projects</span>
                  </CommandItem>
                  <CommandItem onSelect={() => { router.push('/modules/bible'); setIsCommandPaletteOpen(false); }}>
                    <span>📖 Bible Study</span>
                  </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Help">
                  <CommandItem onSelect={() => { showShortcutsModal(); setIsCommandPaletteOpen(false); }}>
                    <Keyboard className="w-4 h-4 mr-2" />
                    <span>Keyboard Shortcuts</span>
                    <Badge variant="secondary" className="ml-auto">⌘+⇧+?</Badge>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          <div 
            className="fixed inset-0 -z-10" 
            onClick={() => setIsCommandPaletteOpen(false)}
          />
        </div>
      )}

      {/* Global keyboard shortcut hint */}
      <div className="fixed bottom-4 right-4 hidden lg:block">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Keyboard className="w-3 h-3 mr-2" />
          <Badge variant="secondary" className="text-xs">⌘K</Badge>
        </Button>
      </div>
    </>
  );
}

export default KeyboardShortcuts;