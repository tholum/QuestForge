import type { Meta, StoryObj } from '@storybook/nextjs'
import { SkipLinks } from './SkipLinks'

const meta: Meta<typeof SkipLinks> = {
  title: 'Accessibility/SkipLinks',
  component: SkipLinks,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
SkipLinks provides keyboard navigation shortcuts for accessibility:
- Only visible when focused (press Tab to see them)
- High contrast styling for visibility
- Skip to main content, navigation, and search
- Essential for screen reader and keyboard users
- Fixed positioning to stay visible when focused
- WCAG 2.1 compliant implementation
        `
      }
    }
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const SampleLayout = ({ showSkipLinks = true }: { showSkipLinks?: boolean }) => (
  <div className="min-h-screen bg-background">
    {showSkipLinks && <SkipLinks />}
    
    {/* Header */}
    <header className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold">Goal Assistant</h1>
        <p className="text-sm opacity-90">Your personal goal tracking companion</p>
      </div>
    </header>
    
    <div className="flex">
      {/* Navigation */}
      <nav id="main-navigation" className="w-64 bg-muted p-4 min-h-screen" tabIndex={-1}>
        <h2 className="font-semibold mb-4">Navigation</h2>
        <ul className="space-y-2">
          <li><a href="#" className="block p-2 hover:bg-background rounded">Dashboard</a></li>
          <li><a href="#" className="block p-2 hover:bg-background rounded">Goals</a></li>
          <li><a href="#" className="block p-2 hover:bg-background rounded">Progress</a></li>
          <li><a href="#" className="block p-2 hover:bg-background rounded">Settings</a></li>
        </ul>
        
        {/* Search in navigation */}
        <div id="search" className="mt-6">
          <label htmlFor="nav-search" className="block text-sm font-medium mb-2">Search</label>
          <input 
            id="nav-search"
            type="search" 
            placeholder="Search goals..." 
            className="w-full p-2 border rounded"
          />
        </div>
      </nav>
      
      {/* Main content */}
      <main id="main-content" className="flex-1 p-6" tabIndex={-1}>
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Today&apos;s Goals</h3>
            <p className="text-3xl font-bold text-primary">3/5</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Weekly Streak</h3>
            <p className="text-3xl font-bold text-green-600">7</p>
            <p className="text-sm text-muted-foreground">Days</p>
          </div>
          
          <div className="bg-card p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">Total XP</h3>
            <p className="text-3xl font-bold text-yellow-600">1,250</p>
            <p className="text-sm text-muted-foreground">Points</p>
          </div>
        </div>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4">Recent Goals</h2>
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-medium">Morning Workout</h3>
              <p className="text-sm text-muted-foreground">30-minute cardio session</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Completed
                </span>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-medium">Read 20 Pages</h3>
              <p className="text-sm text-muted-foreground">Continue with current book</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  In Progress
                </span>
              </div>
            </div>
            
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-medium">Meal Preparation</h3>
              <p className="text-sm text-muted-foreground">Prepare healthy lunch</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                  Pending
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
)

/**
 * Default skip links in a sample layout
 */
export const Default: Story = {
  render: () => <SampleLayout />,
  parameters: {
    docs: {
      description: {
        story: 'Press Tab to focus the skip links. They appear at the top-left when focused and allow jumping to main content sections.'
      }
    }
  }
}

/**
 * Mobile layout with skip links
 */
export const Mobile: Story = {
  render: () => <SampleLayout />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Skip links work the same on mobile devices, helping users navigate quickly with external keyboards.'
      }
    }
  }
}

/**
 * Focused state demonstration
 */
export const FocusedState: Story = {
  render: () => (
    <div className="relative min-h-[400px] bg-background p-8">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Skip Links Focused State</h2>
        <p className="text-muted-foreground">
          This shows how skip links appear when focused
        </p>
      </div>
      
      {/* Simulate focused state */}
      <div className="fixed top-2 left-2 z-[9999] flex flex-col space-y-2">
        <a
          href="#main-content"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm border-2 border-primary-foreground/20 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg backdrop-blur-sm ring-2 ring-primary-foreground"
        >
          Skip to main content
        </a>
        
        <a
          href="#main-navigation"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm border-2 border-primary-foreground/20 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg backdrop-blur-sm"
        >
          Skip to navigation
        </a>
        
        <a
          href="#search"
          className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm border-2 border-primary-foreground/20 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-primary-foreground hover:bg-primary/90 hover:scale-105 shadow-lg backdrop-blur-sm"
        >
          Skip to search
        </a>
      </div>
      
      <div className="mt-16 space-y-4">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Accessibility Benefits</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Allows keyboard users to skip repetitive navigation</li>
            <li>• Helps screen reader users navigate efficiently</li>
            <li>• Provides quick access to main content areas</li>
            <li>• Meets WCAG 2.1 Level A requirements</li>
            <li>• Invisible until focused, maintaining clean design</li>
          </ul>
        </div>
        
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">Usage Instructions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Press Tab when page loads to reveal skip links</li>
            <li>• Press Enter on a skip link to jump to that section</li>
            <li>• Links are positioned at top-left for easy access</li>
            <li>• High contrast styling ensures visibility</li>
          </ul>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual demonstration of skip links in their focused state, showing styling and positioning.'
      }
    }
  }
}

/**
 * Without skip links comparison
 */
export const WithoutSkipLinks: Story = {
  render: () => <SampleLayout showSkipLinks={false} />,
  parameters: {
    docs: {
      description: {
        story: 'Layout without skip links for comparison. Keyboard users would need to tab through all navigation items to reach main content.'
      }
    }
  }
}

/**
 * High contrast theme
 */
export const HighContrast: Story = {
  render: () => <SampleLayout />,
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Skip links maintain high contrast in dark theme for accessibility compliance.'
      }
    }
  }
}

/**
 * Custom styling
 */
export const CustomStyling: Story = {
  args: {
    className: "custom-skip-links"
  },
  render: (args) => (
    <div className="min-h-screen bg-background">
      <style jsx>{`
        .custom-skip-links a {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          border: 2px solid #ffffff !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
      `}</style>
      
      <SkipLinks className={args.className} />
      
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Custom Styled Skip Links</h1>
        <p className="text-muted-foreground mb-8">
          Press Tab to see the custom gradient styling on the skip links.
        </p>
        
        <div id="main-navigation" className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Navigation Section</h2>
          <nav>
            <ul className="flex space-x-4">
              <li><a href="#" className="text-primary hover:underline">Dashboard</a></li>
              <li><a href="#" className="text-primary hover:underline">Goals</a></li>
              <li><a href="#" className="text-primary hover:underline">Progress</a></li>
            </ul>
          </nav>
        </div>
        
        <div id="search" className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Section</h2>
          <input 
            type="search" 
            placeholder="Search goals..." 
            className="w-full max-w-md p-3 border rounded-lg"
          />
        </div>
        
        <main id="main-content">
          <h2 className="text-xl font-semibold mb-4">Main Content</h2>
          <p className="text-muted-foreground">
            This demonstrates how skip links can be customized while maintaining accessibility.
          </p>
        </main>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of custom styling applied to skip links while maintaining accessibility requirements.'
      }
    }
  }
}

/**
 * Keyboard navigation demonstration
 */
export const KeyboardNavigation: Story = {
  render: () => (
    <div className="min-h-screen bg-background">
      <SkipLinks />
      
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Keyboard Navigation Demo</h1>
          
          <div className="bg-card p-6 rounded-lg border mb-8">
            <h2 className="text-xl font-semibold mb-4">How to Test Skip Links</h2>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>
                <strong>Load the page:</strong> Skip links are initially hidden
              </li>
              <li>
                <strong>Press Tab:</strong> The first skip link becomes visible and focused
              </li>
              <li>
                <strong>Press Tab again:</strong> Move to the next skip link
              </li>
              <li>
                <strong>Press Enter:</strong> Activate the focused skip link to jump to that section
              </li>
              <li>
                <strong>Press Tab:</strong> Continue navigating from the target section
              </li>
            </ol>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-3">For Keyboard Users</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Skip repetitive navigation links</li>
                <li>• Jump directly to main content</li>
                <li>• Access search functionality quickly</li>
                <li>• Navigate more efficiently</li>
              </ul>
            </div>
            
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="font-semibold mb-3">For Screen Readers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Announced as navigation landmarks</li>
                <li>• Reduce cognitive load</li>
                <li>• Improve user experience</li>
                <li>• Meet accessibility standards</li>
              </ul>
            </div>
          </div>
          
          <nav id="main-navigation" className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-4">Sample Navigation</h3>
            <ul className="flex flex-wrap gap-4">
              <li><a href="#" className="text-primary hover:underline">Home</a></li>
              <li><a href="#" className="text-primary hover:underline">About</a></li>
              <li><a href="#" className="text-primary hover:underline">Services</a></li>
              <li><a href="#" className="text-primary hover:underline">Portfolio</a></li>
              <li><a href="#" className="text-primary hover:underline">Blog</a></li>
              <li><a href="#" className="text-primary hover:underline">Contact</a></li>
            </ul>
          </nav>
          
          <div id="search" className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="font-semibold mb-4">Search Section</h3>
            <div className="flex gap-4">
              <input 
                type="search" 
                placeholder="Search..." 
                className="flex-1 p-3 border rounded-lg"
              />
              <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                Search
              </button>
            </div>
          </div>
          
          <main id="main-content" className="mt-8 p-6 bg-card rounded-lg border">
            <h3 className="font-semibold mb-4">Main Content Area</h3>
            <p className="text-muted-foreground">
              This is where the main content of the page would be displayed. 
              Skip links help users jump directly here, bypassing navigation.
            </p>
          </main>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration showing how to test and use skip links for keyboard navigation.'
      }
    }
  }
}