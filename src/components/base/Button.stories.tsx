import type { Meta, StoryObj } from "@storybook/nextjs"
import { 
  Plus, 
  Download, 
  Trash2, 
  Heart, 
  Star, 
  Search,
  Settings,
  ArrowRight,
  Check
} from "lucide-react"
import { Button } from "./Button"

const meta: Meta<typeof Button> = {
  title: "Base Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Enhanced Button component with loading states, icons, and comprehensive variants for the Goal Assistant project. Built on top of shadcn/ui with additional features for ADHD-friendly design."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link", "success", "warning"],
      description: "Visual variant of the button"
    },
    size: {
      control: "select", 
      options: ["xs", "sm", "default", "lg", "xl", "icon", "icon-sm", "icon-lg", "icon-xl"],
      description: "Size variant of the button"
    },
    rounded: {
      control: "select",
      options: ["default", "sm", "lg", "xl", "full", "none"],
      description: "Border radius variant"
    },
    loading: {
      control: "boolean",
      description: "Show loading spinner and disable interaction"
    },
    loadingText: {
      control: "text",
      description: "Alternative text to show when loading"
    },
    fullWidth: {
      control: "boolean",
      description: "Make button full width"
    },
    disabled: {
      control: "boolean",
      description: "Disable button interaction"
    },
    badge: {
      control: "text",
      description: "Badge number or text to display"
    },
    tooltip: {
      control: "text",
      description: "Tooltip text on hover"
    },
    onClick: { action: "clicked" }
  },
  args: {
    children: "Button"
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic variants
export const Default: Story = {
  args: {
    children: "Default Button"
  }
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button variants including the new success and warning variants for better user feedback."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different size variants for various use cases, from compact UI elements to prominent call-to-action buttons."
      }
    }
  }
}

export const IconButtons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button size="icon" variant="outline">
        <Plus />
      </Button>
      <Button size="icon-sm" variant="secondary">
        <Settings />
      </Button>
      <Button size="icon-lg" variant="default">
        <Heart />
      </Button>
      <Button size="icon-xl" variant="success">
        <Check />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon-only buttons in different sizes. Perfect for toolbars and compact interfaces."
      }
    }
  }
}

export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button leftIcon={<Plus />}>Add Item</Button>
      <Button rightIcon={<ArrowRight />}>Continue</Button>
      <Button leftIcon={<Download />} rightIcon={<ArrowRight />}>Download & Continue</Button>
      <Button leftIcon={<Trash2 />} variant="destructive">Delete</Button>
      <Button leftIcon={<Search />} variant="outline" size="sm">Search</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Buttons with left and/or right icons for better visual communication and user guidance."
      }
    }
  }
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button loading>Loading...</Button>
      <Button loading loadingText="Saving..." variant="success">Save Changes</Button>
      <Button loading leftIcon={<Download />}>Download</Button>
      <Button loading size="icon" variant="outline">
        <Plus />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading states with spinner animations. Essential for providing feedback during async operations."
      }
    }
  }
}

export const WithBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button badge={5}>Messages</Button>
      <Button badge={99} variant="outline">Notifications</Button>
      <Button badge="NEW" variant="success">Features</Button>
      <Button badge={1} size="icon" variant="secondary">
        <Settings />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Buttons with notification badges for indicating counts or status updates."
      }
    }
  }
}

export const Rounded: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button rounded="none">Square</Button>
      <Button rounded="sm">Small Radius</Button>
      <Button rounded="default">Default</Button>
      <Button rounded="lg">Large Radius</Button>
      <Button rounded="xl">Extra Large</Button>
      <Button rounded="full">Pill</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different border radius options for various design aesthetics."
      }
    }
  }
}

export const FullWidth: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <Button fullWidth>Full Width Button</Button>
      <Button fullWidth variant="outline" leftIcon={<Plus />}>Add New Goal</Button>
      <Button fullWidth variant="success" loading loadingText="Creating...">Create Goal</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Full-width buttons perfect for mobile interfaces and form submissions."
      }
    }
  }
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
      <Button variant="destructive" disabled>Disabled Destructive</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different interactive states including disabled and loading states."
      }
    }
  }
}

// Interactive examples
export const Interactive: Story = {
  args: {
    children: "Click me!",
    tooltip: "This is a helpful tooltip"
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive button with tooltip. Click to see the action in the Actions panel."
      }
    }
  }
}

export const GameifiedExample: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="text-sm font-medium text-muted-foreground">Gamified Goal Actions</div>
      <div className="flex gap-2">
        <Button variant="success" leftIcon={<Check />} badge={5}>Complete (+5 XP)</Button>
        <Button variant="outline" leftIcon={<Star />}>Favorite</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="warning" size="sm">Skip Today</Button>
        <Button variant="destructive" size="sm" leftIcon={<Trash2 />}>Delete</Button>
      </div>
      <Button fullWidth variant="default" leftIcon={<Plus />} rounded="lg">
        Add New Goal
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of buttons in a gamified goal management interface with XP rewards and clear visual hierarchy."
      }
    }
  }
}

// Mobile-focused examples
export const MobileFriendly: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-3">
      <div className="text-sm font-medium text-muted-foreground">Mobile Interface Example</div>
      <Button fullWidth size="lg" leftIcon={<Plus />}>Quick Add Goal</Button>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg">View Progress</Button>
        <Button variant="success" size="lg">Complete Task</Button>
      </div>
      <div className="flex justify-center">
        <Button size="icon-xl" variant="default" rounded="full">
          <Plus />
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized button layouts with larger touch targets and full-width designs."
      }
    }
  }
}

// Accessibility example
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">Accessibility Features</div>
      <Button tooltip="Save your current progress">
        Save Progress
      </Button>
      <Button 
        disabled 
        tooltip="Complete the current goal before adding a new one"
        leftIcon={<Plus />}
      >
        Add Goal (Disabled)
      </Button>
      <Button 
        loading 
        loadingText="Saving changes..."
        aria-label="Saving your goal changes"
      >
        Save Changes
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Accessibility features including tooltips, proper ARIA labels, and clear loading states."
      }
    }
  }
}