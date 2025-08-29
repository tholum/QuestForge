# P3-301: Offline Support

## Task Overview

**Priority**: P3 (Nice-to-Have)  
**Status**: Not Started  
**Effort**: 13 Story Points  
**Sprint**: Future Enhancements  

## Description

Implement comprehensive offline support using Service Workers, IndexedDB, and background sync to enable users to continue working with their goals when internet connectivity is unavailable. This includes offline data storage, conflict resolution, and seamless synchronization when connectivity is restored.

## Dependencies

- ✅ P1-101: Goal Management CRUD (core functionality must be complete)
- ✅ P1-102: Progress Tracking (progress updates need offline support)
- ✅ All API endpoints implemented and stable
- ❌ PWA configuration
- ❌ Background sync infrastructure

## Definition of Done

### Core Offline Features
- [ ] Service Worker implementation for caching
- [ ] IndexedDB storage for offline data
- [ ] Offline goal creation and editing
- [ ] Offline progress tracking
- [ ] Queue system for pending actions
- [ ] Background sync when connectivity restored
- [ ] Conflict resolution for concurrent edits

### Data Synchronization
- [ ] Automatic sync detection and initiation
- [ ] Incremental sync to reduce bandwidth
- [ ] Conflict resolution strategies (last-write-wins, merge, user choice)
- [ ] Sync progress indicators
- [ ] Failed sync retry mechanisms
- [ ] Data integrity validation after sync

### User Experience
- [ ] Clear offline status indicators
- [ ] Offline mode UI adaptations
- [ ] Sync status notifications
- [ ] Offline-first design patterns
- [ ] Graceful degradation of features
- [ ] Data usage optimization

### Technical Infrastructure
- [ ] IndexedDB schema and migration system
- [ ] Service Worker lifecycle management
- [ ] Background sync registration and handling
- [ ] Network state detection and monitoring
- [ ] Cache management and invalidation
- [ ] Error handling and recovery

## User Stories

### US-301.1: Offline Goal Management
```
As a user with poor internet connectivity
I want to create and edit goals while offline
So that I can continue being productive regardless of network status
```

**Acceptance Criteria:**
- Goals can be created, edited, and deleted while offline
- All changes are stored locally and queued for sync
- Visual indicators show offline status and pending changes
- Offline actions work identically to online actions
- No data loss occurs during offline periods
- Sync happens automatically when connectivity returns

### US-301.2: Offline Progress Tracking
```
As a user who travels frequently
I want to track my progress even without internet
So that I can maintain my habits and momentum anywhere
```

**Acceptance Criteria:**
- Progress entries work fully offline
- XP calculations happen locally
- Achievement notifications work offline
- Progress charts update with offline data
- All offline progress syncs correctly when online
- Gamification features remain functional offline

### US-301.3: Conflict Resolution
```
As a user who works across multiple devices
I want conflicts between offline changes to be handled gracefully
So that I don't lose work when changes conflict
```

**Acceptance Criteria:**
- System detects conflicting changes during sync
- User is presented with clear conflict resolution options
- Merge strategies are available for compatible changes
- Manual resolution UI is intuitive and clear
- All conflicting versions are preserved until resolved
- Resolution choices are consistent and predictable

### US-301.4: Sync Status Visibility
```
As a user working offline
I want to understand what changes are pending and sync status
So that I know when my data is safely synchronized
```

**Acceptance Criteria:**
- Clear visual indicators for offline status
- List of pending changes is always accessible
- Sync progress is shown with meaningful progress bars
- Sync failures are clearly communicated
- Manual sync option is always available
- Network status is prominently displayed

## Technical Implementation

### Service Worker Architecture

#### Service Worker Registration
```typescript
// src/lib/offline/service-worker.ts
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              showUpdateNotification();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  }
  return null;
}
```

#### Service Worker Implementation
```javascript
// public/sw.js
const CACHE_NAME = 'goal-assistant-v1';
const OFFLINE_CACHE = 'goal-assistant-offline-v1';

// Resources to cache for offline use
const CACHE_RESOURCES = [
  '/',
  '/goals',
  '/progress',
  '/offline.html',
  '/_next/static/css/',
  '/_next/static/js/',
  '/api/v1/goals', // Cache API responses
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(OFFLINE_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(event.request).then((response) => {
            if (response) {
              return response;
            }
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
            throw new Error('Network error and no cache available');
          });
        })
    );
  }
});

// Background sync for pending data
self.addEventListener('sync', (event) => {
  if (event.tag === 'goal-sync') {
    event.waitUntil(syncPendingGoals());
  }
  if (event.tag === 'progress-sync') {
    event.waitUntil(syncPendingProgress());
  }
});

async function syncPendingGoals() {
  try {
    const pendingGoals = await getPendingGoalsFromIndexedDB();
    for (const goal of pendingGoals) {
      await syncGoalToServer(goal);
    }
  } catch (error) {
    console.error('Goal sync failed:', error);
  }
}
```

### IndexedDB Storage System

#### Database Schema
```typescript
// src/lib/offline/indexed-db.ts
interface OfflineDBSchema {
  goals: {
    key: string;
    value: Goal & {
      syncStatus: 'pending' | 'synced' | 'conflict';
      lastModified: number;
      pendingChanges?: Partial<Goal>;
    };
  };
  progress: {
    key: string;
    value: Progress & {
      syncStatus: 'pending' | 'synced' | 'conflict';
      lastModified: number;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'goal' | 'progress';
      data: any;
      timestamp: number;
      retryCount: number;
    };
  };
  metadata: {
    key: string;
    value: {
      lastSyncTime: number;
      syncInProgress: boolean;
      conflictCount: number;
    };
  };
}

export class OfflineDB {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'GoalAssistantOffline';
  private readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Goals store
        if (!db.objectStoreNames.contains('goals')) {
          const goalStore = db.createObjectStore('goals', { keyPath: 'id' });
          goalStore.createIndex('syncStatus', 'syncStatus');
          goalStore.createIndex('lastModified', 'lastModified');
        }

        // Progress store
        if (!db.objectStoreNames.contains('progress')) {
          const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
          progressStore.createIndex('goalId', 'goalId');
          progressStore.createIndex('syncStatus', 'syncStatus');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp');
          syncStore.createIndex('type', 'type');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async addToSyncQueue(action: {
    type: 'create' | 'update' | 'delete';
    entity: 'goal' | 'progress';
    data: any;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['syncQueue'], 'readwrite');
    const store = transaction.objectStore('syncQueue');
    
    const queueItem = {
      id: crypto.randomUUID(),
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.add(queueItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(`${action.entity}-sync`);
    }
  }

  async storeGoalOffline(goal: Goal): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['goals'], 'readwrite');
    const store = transaction.objectStore('goals');

    const offlineGoal = {
      ...goal,
      syncStatus: 'pending' as const,
      lastModified: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(offlineGoal);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getOfflineGoals(): Promise<Goal[]> {
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['goals'], 'readonly');
    const store = transaction.objectStore('goals');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
```

### Offline Goal Management

#### Offline Goal Service
```typescript
// src/lib/offline/offline-goal-service.ts
export class OfflineGoalService {
  constructor(
    private offlineDB: OfflineDB,
    private onlineService: GoalService,
    private networkStatus: NetworkStatusService
  ) {}

  async createGoal(goalData: CreateGoalRequest): Promise<Goal> {
    // Generate temporary ID for offline creation
    const tempGoal: Goal = {
      ...goalData,
      id: `temp_${crypto.randomUUID()}`,
      userId: await this.getCurrentUserId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isCompleted: false,
    };

    if (this.networkStatus.isOnline()) {
      try {
        // Try online creation first
        const onlineGoal = await this.onlineService.createGoal(goalData);
        return onlineGoal;
      } catch (error) {
        // Fall back to offline if online fails
        console.warn('Online goal creation failed, falling back to offline');
      }
    }

    // Store offline
    await this.offlineDB.storeGoalOffline(tempGoal);
    await this.offlineDB.addToSyncQueue({
      type: 'create',
      entity: 'goal',
      data: goalData,
    });

    // Show offline indicator
    this.showOfflineNotification('Goal created offline - will sync when connected');

    return tempGoal;
  }

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    if (this.networkStatus.isOnline()) {
      try {
        return await this.onlineService.updateGoal(goalId, updates);
      } catch (error) {
        console.warn('Online goal update failed, storing offline');
      }
    }

    // Get current offline version
    const offlineGoals = await this.offlineDB.getOfflineGoals();
    const existingGoal = offlineGoals.find(g => g.id === goalId);
    
    if (!existingGoal) {
      throw new Error('Goal not found offline');
    }

    // Apply updates
    const updatedGoal = {
      ...existingGoal,
      ...updates,
      updatedAt: new Date(),
    };

    await this.offlineDB.storeGoalOffline(updatedGoal);
    await this.offlineDB.addToSyncQueue({
      type: 'update',
      entity: 'goal',
      data: { id: goalId, ...updates },
    });

    return updatedGoal;
  }

  async getGoals(filters?: GoalFilters): Promise<Goal[]> {
    if (this.networkStatus.isOnline()) {
      try {
        const onlineGoals = await this.onlineService.getGoals(filters);
        // Cache for offline use
        for (const goal of onlineGoals) {
          await this.offlineDB.storeGoalOffline({
            ...goal,
            syncStatus: 'synced',
            lastModified: Date.now(),
          });
        }
        return onlineGoals;
      } catch (error) {
        console.warn('Failed to fetch online goals, using offline cache');
      }
    }

    // Return offline goals
    const offlineGoals = await this.offlineDB.getOfflineGoals();
    return this.applyFilters(offlineGoals, filters);
  }

  private applyFilters(goals: Goal[], filters?: GoalFilters): Goal[] {
    if (!filters) return goals;

    return goals.filter(goal => {
      if (filters.moduleId && goal.moduleId !== filters.moduleId) return false;
      if (filters.isCompleted !== undefined && goal.isCompleted !== filters.isCompleted) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = goal.title.toLowerCase().includes(searchLower);
        const matchesDescription = goal.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      return true;
    });
  }
}
```

### Sync and Conflict Resolution

#### Sync Manager
```typescript
// src/lib/offline/sync-manager.ts
export class SyncManager {
  constructor(
    private offlineDB: OfflineDB,
    private apiClient: APIClient,
    private conflictResolver: ConflictResolver
  ) {}

  async performFullSync(): Promise<SyncResult> {
    const syncResult: SyncResult = {
      success: true,
      synced: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Set sync in progress
      await this.setSyncStatus(true);

      // Sync goals
      const goalSyncResult = await this.syncGoals();
      syncResult.synced += goalSyncResult.synced;
      syncResult.conflicts += goalSyncResult.conflicts;
      syncResult.errors.push(...goalSyncResult.errors);

      // Sync progress
      const progressSyncResult = await this.syncProgress();
      syncResult.synced += progressSyncResult.synced;
      syncResult.conflicts += progressSyncResult.conflicts;
      syncResult.errors.push(...progressSyncResult.errors);

      // Update last sync time
      await this.updateLastSyncTime();

    } catch (error) {
      syncResult.success = false;
      syncResult.errors.push(error.message);
    } finally {
      await this.setSyncStatus(false);
    }

    return syncResult;
  }

  private async syncGoals(): Promise<Partial<SyncResult>> {
    const pendingGoals = await this.offlineDB.getPendingGoals();
    const result = { synced: 0, conflicts: 0, errors: [] };

    for (const offlineGoal of pendingGoals) {
      try {
        if (offlineGoal.id.startsWith('temp_')) {
          // Handle new goal creation
          const serverGoal = await this.apiClient.createGoal(offlineGoal);
          await this.offlineDB.replaceGoal(offlineGoal.id, serverGoal);
          result.synced++;
        } else {
          // Handle goal updates
          const serverGoal = await this.apiClient.getGoal(offlineGoal.id);
          
          if (this.hasConflict(offlineGoal, serverGoal)) {
            // Conflict detected
            const resolution = await this.conflictResolver.resolveGoalConflict(
              offlineGoal,
              serverGoal
            );
            
            if (resolution.type === 'merge' || resolution.type === 'local') {
              await this.apiClient.updateGoal(offlineGoal.id, resolution.resolvedGoal);
              await this.offlineDB.markSynced(offlineGoal.id);
              result.synced++;
            } else {
              // User chose server version
              await this.offlineDB.replaceGoal(offlineGoal.id, serverGoal);
              result.synced++;
            }
            
            result.conflicts++;
          } else {
            // No conflict, sync normally
            await this.apiClient.updateGoal(offlineGoal.id, offlineGoal);
            await this.offlineDB.markSynced(offlineGoal.id);
            result.synced++;
          }
        }
      } catch (error) {
        result.errors.push(`Goal ${offlineGoal.id}: ${error.message}`);
      }
    }

    return result;
  }

  private hasConflict(offlineVersion: any, serverVersion: any): boolean {
    // Simple last-modified comparison
    return offlineVersion.lastModified < new Date(serverVersion.updatedAt).getTime();
  }
}
```

#### Conflict Resolution UI
```typescript
// src/components/offline/ConflictResolver.tsx
'use client';

interface ConflictResolverProps {
  conflicts: Array<{
    localVersion: Goal;
    serverVersion: Goal;
    onResolve: (resolution: ConflictResolution) => void;
  }>;
}

export function ConflictResolver({ conflicts }: ConflictResolverProps) {
  const [currentConflict, setCurrentConflict] = useState(0);
  
  if (conflicts.length === 0) return null;

  const conflict = conflicts[currentConflict];

  const handleResolution = (type: 'local' | 'server' | 'merge') => {
    let resolvedGoal: Goal;

    switch (type) {
      case 'local':
        resolvedGoal = conflict.localVersion;
        break;
      case 'server':
        resolvedGoal = conflict.serverVersion;
        break;
      case 'merge':
        resolvedGoal = mergeGoals(conflict.localVersion, conflict.serverVersion);
        break;
    }

    conflict.onResolve({ type, resolvedGoal });
    
    if (currentConflict < conflicts.length - 1) {
      setCurrentConflict(currentConflict + 1);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Resolve Sync Conflict ({currentConflict + 1} of {conflicts.length})
          </DialogTitle>
          <DialogDescription>
            This goal was modified both locally and on the server. Choose how to resolve:
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-6">
          <Card className="border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">Your Changes (Local)</CardTitle>
              <CardDescription>
                Modified {format(new Date(conflict.localVersion.updatedAt), 'PPp')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalComparisonView goal={conflict.localVersion} />
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Server Version</CardTitle>
              <CardDescription>
                Modified {format(new Date(conflict.serverVersion.updatedAt), 'PPp')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GoalComparisonView goal={conflict.serverVersion} />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => handleResolution('local')}
            className="border-blue-200 text-blue-700"
          >
            Keep My Changes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleResolution('server')}
            className="border-green-200 text-green-700"
          >
            Use Server Version
          </Button>
          <Button 
            onClick={() => handleResolution('merge')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Merge Both
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Mobile Optimizations

### Offline-First Mobile Experience
- Aggressive caching of UI components
- Optimized IndexedDB operations for mobile
- Battery-conscious background sync
- Minimal data usage during sync

### Network Detection
```typescript
// src/hooks/useNetworkStatus.ts
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');
      
      connection.addEventListener('change', () => {
        setConnectionType(connection.effectiveType || 'unknown');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}
```

## Testing Strategy

### Offline Testing
- Service Worker testing with MSW
- IndexedDB operations testing
- Network state simulation
- Sync conflict scenarios
- Data integrity verification

### Performance Testing
- Large dataset offline storage
- Sync performance with thousands of records
- Battery usage during background sync
- Memory usage with offline data

## Success Metrics

### Functionality Metrics
- 100% core features work offline
- Sync success rate > 99%
- Conflict resolution accuracy > 95%
- Zero data loss incidents

### User Experience Metrics
- Offline mode awareness > 90% of users
- User satisfaction with offline features > 4.0/5
- Reduced bounce rate during connectivity issues
- Increased app usage in low-connectivity areas

### Technical Metrics
- Background sync completion rate > 95%
- IndexedDB operation response time < 50ms
- Service Worker cache hit rate > 80%
- Sync bandwidth usage optimization

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: Future Enhancements