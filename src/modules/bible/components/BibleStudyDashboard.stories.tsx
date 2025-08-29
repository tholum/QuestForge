/**
 * Bible Study Dashboard Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { BibleModule } from '../BibleModule';
import { BibleDashboardData } from '../types';

// Extract the dashboard component for Storybook
const BibleStudyDashboard = BibleModule.components.dashboard;

const mockDashboardData: BibleDashboardData = {
  activePlans: [
    {
      id: '1',
      userId: 'user1',
      name: 'One Year Chronological',
      description: 'Read the Bible in historical order',
      planType: 'preset',
      presetId: 'one-year-chronological',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      readings: [],
      user: { id: 'user1', name: 'Demo User' }
    }
  ],
  todaysReadings: [
    {
      id: '1',
      planId: '1',
      userId: 'user1',
      assignedDate: new Date(),
      passages: ['Genesis 1:1-31', 'Psalm 1'],
      isCompleted: false,
      completedAt: null,
      readingTimeMinutes: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      plan: { id: '1', name: 'One Year Chronological' }
    }
  ],
  recentStudySessions: [
    {
      id: '1',
      userId: 'user1',
      goalId: 'goal1',
      title: 'Romans 8 Study',
      description: 'Deep dive into life in the Spirit',
      passages: ['Romans 8:1-17'],
      durationMinutes: 45,
      studyDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      notes: 'Explored themes of freedom from condemnation',
      tags: ['Romans', 'Holy Spirit'],
      createdAt: new Date(),
      updatedAt: new Date(),
      goal: { id: 'goal1', title: 'Study Paul\'s Letters' }
    }
  ],
  activePrayerRequests: [
    {
      id: '1',
      userId: 'user1',
      title: 'Wisdom for career decision',
      description: 'Praying for guidance in choosing the right path',
      category: 'personal',
      priority: 'high',
      isPrivate: true,
      isAnswered: false,
      answeredAt: null,
      answerDescription: null,
      requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  recentBookmarks: [
    {
      id: '1',
      userId: 'user1',
      reference: 'John 3:16',
      version: 'ESV',
      text: 'For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.',
      notes: 'The most famous verse about God\'s love',
      highlights: null,
      tags: ['salvation', 'love', 'eternal life'],
      isPrivate: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  readingStreak: 7,
  stats: {
    totalPlans: 1,
    completedReadingsThisWeek: 5,
    studySessionsThisMonth: 8,
    answeredPrayers: 3
  }
};

const meta: Meta<typeof BibleStudyDashboard> = {
  title: 'Modules/Bible/BibleStudyDashboard',
  component: BibleStudyDashboard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    moduleId: 'bible',
    userId: 'user1',
    config: {
      preferredVersion: 'ESV',
      enableReadingReminders: true,
      reminderTime: '07:00'
    }
  },
  parameters: {
    mockData: [
      {
        url: '/api/v1/modules/bible?type=dashboard',
        method: 'GET',
        status: 200,
        response: {
          success: true,
          data: mockDashboardData
        }
      }
    ]
  }
};

export const WithCompletedReading: Story = {
  args: {
    moduleId: 'bible',
    userId: 'user1',
    config: {
      preferredVersion: 'ESV'
    }
  },
  parameters: {
    mockData: [
      {
        url: '/api/v1/modules/bible?type=dashboard',
        method: 'GET',
        status: 200,
        response: {
          success: true,
          data: {
            ...mockDashboardData,
            todaysReadings: [
              {
                ...mockDashboardData.todaysReadings[0],
                isCompleted: true,
                completedAt: new Date(),
                readingTimeMinutes: 25,
                notes: 'Great start to the Bible! Creation is amazing.'
              }
            ]
          }
        }
      }
    ]
  }
};

export const HighStreak: Story = {
  args: {
    moduleId: 'bible',
    userId: 'user1',
    config: {
      preferredVersion: 'ESV'
    }
  },
  parameters: {
    mockData: [
      {
        url: '/api/v1/modules/bible?type=dashboard',
        method: 'GET',
        status: 200,
        response: {
          success: true,
          data: {
            ...mockDashboardData,
            readingStreak: 30,
            stats: {
              ...mockDashboardData.stats,
              completedReadingsThisWeek: 7,
              studySessionsThisMonth: 15
            }
          }
        }
      }
    ]
  }
};

export const EmptyState: Story = {
  args: {
    moduleId: 'bible',
    userId: 'user1',
    config: {
      preferredVersion: 'ESV'
    }
  },
  parameters: {
    mockData: [
      {
        url: '/api/v1/modules/bible?type=dashboard',
        method: 'GET',
        status: 200,
        response: {
          success: true,
          data: {
            activePlans: [],
            todaysReadings: [],
            recentStudySessions: [],
            activePrayerRequests: [],
            recentBookmarks: [],
            readingStreak: 0,
            stats: {
              totalPlans: 0,
              completedReadingsThisWeek: 0,
              studySessionsThisMonth: 0,
              answeredPrayers: 0
            }
          }
        }
      }
    ]
  }
};

export const Loading: Story = {
  args: {
    moduleId: 'bible',
    userId: 'user1',
    config: {
      preferredVersion: 'ESV'
    }
  },
  parameters: {
    mockData: [
      {
        url: '/api/v1/modules/bible?type=dashboard',
        method: 'GET',
        delay: 2000, // 2 second delay to show loading state
        status: 200,
        response: {
          success: true,
          data: mockDashboardData
        }
      }
    ]
  }
};