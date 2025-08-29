# P0-003: Storybook Configuration Fixes

## Task Overview

**Priority**: P0 (Critical)  
**Status**: Not Started  
**Effort**: 2 Story Points  
**Sprint**: MVP Foundation  

## Description

Fix and complete the Storybook configuration to ensure all components are properly documented and working in the Storybook environment. This is critical for component development workflow, design system consistency, and enabling proper visual testing.

## Dependencies

- ✅ Storybook packages installed
- ✅ Basic Storybook configuration exists
- ✅ Component library structure in place
- ❌ Working Storybook build
- ❌ All components have stories
- ❌ Proper addon configuration

## Definition of Done

### Core Requirements
- [ ] Storybook builds and runs without errors
- [ ] All existing components have working stories
- [ ] Proper addon configuration (a11y, docs, controls)
- [ ] Mobile viewport configurations
- [ ] Dark mode support in Storybook
- [ ] Component documentation generation
- [ ] Visual regression testing setup

### Technical Requirements
- [ ] TypeScript support working in Storybook
- [ ] Tailwind CSS properly loaded in Storybook
- [ ] All shadcn/ui components accessible
- [ ] Base components fully documented
- [ ] Layout components working in stories
- [ ] No console errors in Storybook

### Testing Integration
- [ ] Storybook tests running via Vitest
- [ ] Interaction testing enabled
- [ ] Accessibility testing in stories
- [ ] Visual regression testing configured
- [ ] Component test coverage reporting

### Documentation
- [ ] Component documentation standards
- [ ] Story writing guidelines
- [ ] Usage examples for all components
- [ ] Design token documentation
- [ ] Contribution guidelines

## Current Issues

### Configuration Problems
Based on the existing setup, likely issues include:
- Tailwind CSS not loading properly in Storybook
- TypeScript path resolution issues
- Missing story files for components
- Addon configuration incomplete

### Component Coverage
Components missing stories:
- Layout components (AppLayout, AppHeader, etc.)
- Mobile components (SwipeActions, TouchFriendlyCard, etc.)
- Desktop components (KeyboardShortcuts)
- Accessibility components (SkipLinks, FocusManagement)

## Technical Implementation

### Storybook Configuration

#### Main Configuration Update
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs-vite';
import { resolve } from 'path';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|ts|tsx|mdx)',
    '../src/**/*.stories.mdx',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-essentials',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  viteFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': resolve(__dirname, '../src'),
      };
    }
    return config;
  },
};

export default config;
```

#### Preview Configuration
```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css'; // Tailwind CSS

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'mobile', value: '#f8f9fa' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '768px' },
        },
        widescreen: {
          name: 'Widescreen',
          styles: { width: '1440px', height: '900px' },
        },
      },
      defaultViewport: 'mobile',
    },
    docs: {
      toc: true,
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;
```

### Missing Component Stories

#### Layout Component Stories
```typescript
// src/components/layout/AppLayout.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { AppLayout } from './AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main application layout with responsive sidebar and mobile navigation',
      },
    },
  },
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display in the main area',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Main application content goes here</p>
      </div>
    ),
  },
};

export const MobileView: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'mobile' },
  },
};

export const DesktopView: Story = {
  ...Default,
  parameters: {
    viewport: { defaultViewport: 'desktop' },
  },
};
```

#### Mobile Component Stories
```typescript
// src/components/mobile/TouchFriendlyCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { TouchFriendlyCard } from './TouchFriendlyCard';

const meta: Meta<typeof TouchFriendlyCard> = {
  title: 'Mobile/TouchFriendlyCard',
  component: TouchFriendlyCard,
  parameters: {
    viewport: { defaultViewport: 'mobile' },
    docs: {
      description: {
        component: 'Mobile-optimized card with touch interactions and swipe gestures',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Complete morning workout',
    subtitle: 'Fitness Goal',
    description: '30 minutes of cardio and strength training',
    progress: 75,
    onTap: () => console.log('Card tapped'),
    onLongPress: () => console.log('Card long pressed'),
    onSwipeLeft: () => console.log('Swiped left'),
    onSwipeRight: () => console.log('Swiped right'),
  },
};

export const WithActions: Story = {
  args: {
    ...Default.args,
    showSwipeActions: true,
    leftAction: { icon: 'check', label: 'Complete', color: 'green' },
    rightAction: { icon: 'edit', label: 'Edit', color: 'blue' },
  },
};
```

### Testing Integration

#### Storybook Test Setup
```typescript
// .storybook/vitest.setup.ts
import { beforeAll } from 'vitest';
import { setProjectAnnotations } from '@storybook/react';
import * as projectAnnotations from './preview';

const project = setProjectAnnotations(projectAnnotations);

beforeAll(project.beforeAll);
```

#### Component Tests from Stories
```typescript
// src/components/base/Button.test.tsx (enhanced)
import { composeStories } from '@storybook/react';
import { render, screen } from '@/test/utils';
import * as stories from './Button.stories';

const { Default, Primary, Secondary, Disabled } = composeStories(stories);

describe('Button Stories', () => {
  it('renders default button', () => {
    render(<Default />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders primary button with correct styling', () => {
    render(<Primary />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
  });

  it('handles disabled state correctly', async () => {
    const { user } = render(<Disabled />);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    await user.click(button);
    // Verify no action was triggered
  });
});
```

### Accessibility Testing

#### A11y Addon Configuration
```typescript
// .storybook/preview.ts (addition)
import { configure } from '@storybook/addon-a11y';

configure({
  element: '#storybook-root',
  config: {
    rules: [
      {
        id: 'color-contrast',
        enabled: true,
      },
      {
        id: 'focus-order-semantics',
        enabled: true,
      },
      {
        id: 'keyboard-navigation',
        enabled: true,
      },
    ],
  },
  options: {
    checks: { 'color-contrast': { options: { noScroll: true } } },
    restoreScroll: true,
  },
});
```

### Visual Regression Testing

#### Chromatic Integration
```json
// package.json additions
{
  "scripts": {
    "chromatic": "npx chromatic --project-token=<PROJECT_TOKEN>",
    "visual-test": "npm run build-storybook && npm run chromatic"
  }
}
```

## Implementation Plan

### Phase 1: Configuration Fix (0.5 SP)
- [ ] Fix Storybook build errors
- [ ] Configure TypeScript and path resolution
- [ ] Set up proper CSS loading
- [ ] Configure essential addons

### Phase 2: Component Stories (1 SP)
- [ ] Create stories for all base components
- [ ] Add stories for layout components
- [ ] Create mobile component stories
- [ ] Add accessibility component stories

### Phase 3: Testing Integration (0.5 SP)
- [ ] Set up Storybook tests with Vitest
- [ ] Configure accessibility testing
- [ ] Add interaction testing
- [ ] Set up visual regression testing

## Testing Strategy

### Story Testing
```typescript
// Test all stories render without errors
describe('All Stories', () => {
  const storyFiles = require.context('../src', true, /\.stories\.tsx?$/);
  
  storyFiles.keys().forEach((filename) => {
    const stories = storyFiles(filename);
    const { default: meta, ...namedExports } = stories;
    
    describe(meta.title, () => {
      Object.entries(namedExports).forEach(([storyName, story]) => {
        it(`${storyName} renders without errors`, () => {
          const Story = story as any;
          render(<Story />);
          expect(screen.getByRole('main')).toBeInTheDocument();
        });
      });
    });
  });
});
```

### Accessibility Testing
- Automated a11y checks in all stories
- Keyboard navigation testing
- Screen reader compatibility
- Color contrast validation
- Focus management verification

## Success Metrics

### Functional Metrics
- 100% of components have working stories
- Zero console errors in Storybook
- All addons working correctly
- Build time < 30 seconds
- Story rendering time < 2 seconds

### Coverage Metrics
- 100% component story coverage
- 90%+ accessibility score across all components
- All interaction scenarios covered
- Documentation completion rate > 95%

### User Experience Metrics
- Developer satisfaction with documentation > 4.5/5
- Time to understand component usage < 5 minutes
- Design system consistency score > 90%

## Risk Mitigation

### Technical Risks
- **TypeScript compilation errors**: Set up proper type checking
- **CSS not loading**: Configure Tailwind integration properly
- **Performance issues**: Optimize story loading and rendering

### Process Risks
- **Incomplete documentation**: Establish story writing standards
- **Inconsistent stories**: Create reusable story templates
- **Maintenance overhead**: Set up automated story validation

---

**Created**: 2025-08-29  
**Last Updated**: 2025-08-29  
**Assigned**: TBD  
**Sprint**: MVP Foundation