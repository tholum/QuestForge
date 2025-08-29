import type { Meta, StoryObj } from "@storybook/nextjs"
import { useState } from "react"
import { FormField, useFormFieldState } from "./FormField"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "./Button"

const meta: Meta<typeof FormField> = {
  title: "Base Components/FormField",
  component: FormField,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "A comprehensive form field wrapper with validation states, error handling, and accessibility features. Designed for ADHD-friendly interfaces with clear visual feedback."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "success", "warning"],
      description: "Visual variant for validation states"
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size variant for the field"
    },
    label: {
      control: "text",
      description: "Label text for the field"
    },
    description: {
      control: "text",
      description: "Helper text description"
    },
    error: {
      control: "text",
      description: "Error message to display"
    },
    success: {
      control: "text", 
      description: "Success message to display"
    },
    warning: {
      control: "text",
      description: "Warning message to display"
    },
    info: {
      control: "text",
      description: "Info message to display"
    },
    required: {
      control: "boolean",
      description: "Mark field as required with asterisk"
    },
    disabled: {
      control: "boolean",
      description: "Disable the field"
    },
    loading: {
      control: "boolean",
      description: "Show loading state"
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    label: "Goal Title",
    description: "Enter a clear, specific title for your goal",
    children: <Input placeholder="e.g., Complete 30-day fitness challenge" />
  }
}

export const Required: Story = {
  args: {
    label: "Goal Title",
    description: "This field is required",
    required: true,
    children: <Input placeholder="Enter your goal title" />
  }
}

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <FormField label="Valid Input" success="Looks good!" required>
        <Input placeholder="Valid input" defaultValue="My fitness goal" />
      </FormField>
      
      <FormField label="Invalid Input" error="Goal title must be at least 5 characters" required>
        <Input placeholder="Enter goal title" defaultValue="Run" className="border-red-300" />
      </FormField>
      
      <FormField label="Warning State" warning="This goal category is getting crowded">
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fitness">Fitness</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="home">Home Projects</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField label="Info State" info="Pro tip: Specific goals are more likely to be achieved">
        <Input placeholder="Make it specific..." />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different validation states with appropriate colors and messaging for clear user feedback."
      }
    }
  }
}

export const WithDifferentInputs: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <FormField 
        label="Goal Title" 
        description="What do you want to achieve?"
        required
      >
        <Input placeholder="e.g., Learn Spanish basics" />
      </FormField>
      
      <FormField 
        label="Goal Description"
        description="Provide more details about your goal"
      >
        <Textarea 
          placeholder="Describe your goal in detail..."
          rows={3}
        />
      </FormField>
      
      <FormField 
        label="Priority Level"
        description="How important is this goal?"
      >
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "FormField works with different input components - Input, Textarea, Select, and more."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <FormField 
        label="Small Field" 
        description="Compact size for secondary information"
        size="sm"
      >
        <Input placeholder="Small input" className="h-8" />
      </FormField>
      
      <FormField 
        label="Default Field"
        description="Standard size for most use cases"
        size="default"
      >
        <Input placeholder="Default input" />
      </FormField>
      
      <FormField 
        label="Large Field"
        description="Prominent size for important inputs"
        size="lg"
      >
        <Input placeholder="Large input" className="h-12 text-lg" />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different sizes for various UI contexts and importance levels."
      }
    }
  }
}

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <FormField 
        label="Validating Input"
        description="Checking if this goal title is unique..."
        loading
      >
        <Input placeholder="Unique goal title" defaultValue="Learn TypeScript" />
      </FormField>
      
      <FormField 
        label="Loading Options"
        loading
      >
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading categories..." />
          </SelectTrigger>
        </Select>
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading states for async validation and data fetching scenarios."
      }
    }
  }
}

export const Disabled: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <FormField 
        label="Disabled Field"
        description="This field is currently disabled"
        disabled
      >
        <Input disabled placeholder="Disabled input" />
      </FormField>
      
      <FormField 
        label="Conditionally Disabled"
        description="Complete the previous goal first"
        disabled
        info="Available after completing your current fitness goal"
      >
        <Input disabled placeholder="Next fitness goal" />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Disabled states with clear messaging about why the field is unavailable."
      }
    }
  }
}

// Interactive example with state management
export const Interactive: Story = {
  render: function InteractiveExample() {
    const fieldState = useFormFieldState()
    const [value, setValue] = useState("")

    const handleSubmit = async () => {
      fieldState.setLoading(true)
      
      // Simulate validation
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      if (value.length < 5) {
        fieldState.setError("Goal title must be at least 5 characters")
      } else if (value.toLowerCase().includes("test")) {
        fieldState.setWarning("Consider making this goal more specific")
      } else {
        fieldState.setSuccess("Great goal title!")
      }
    }

    return (
      <div className="space-y-4 w-full max-w-md">
        <FormField 
          label="Interactive Validation"
          description="Type a goal title and click validate"
          required
          {...fieldState}
        >
          <Input 
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              fieldState.clearState()
            }}
            placeholder="Enter your goal title..."
          />
        </FormField>
        
        <Button 
          onClick={handleSubmit}
          loading={fieldState.loading}
          disabled={!value.trim()}
          className="w-full"
        >
          Validate Goal Title
        </Button>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive example showing real-time validation with the useFormFieldState hook."
      }
    }
  }
}

// Goal Assistant specific examples
export const GoalCreationForm: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div className="text-lg font-semibold text-foreground mb-4">Create New Goal</div>
      
      <FormField 
        label="Goal Title" 
        description="Be specific and measurable"
        required
        info="Good goals are specific, measurable, and time-bound"
      >
        <Input placeholder="e.g., Run 5k in under 30 minutes" />
      </FormField>
      
      <FormField 
        label="Category"
        description="Which area of your life does this goal belong to?"
        required
      >
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fitness">🏃 Fitness</SelectItem>
            <SelectItem value="learning">📚 Learning</SelectItem>
            <SelectItem value="home">🏠 Home Projects</SelectItem>
            <SelectItem value="work">💼 Work</SelectItem>
            <SelectItem value="bible">✝️ Bible Study</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField 
        label="Target Date"
        description="When do you want to achieve this?"
      >
        <Input type="date" />
      </FormField>
      
      <FormField 
        label="Notes"
        description="Any additional details or motivation"
      >
        <Textarea 
          placeholder="Write down why this goal matters to you..."
          rows={3}
        />
      </FormField>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Real-world example of a goal creation form using FormField components."
      }
    }
  }
}

export const MobileFriendly: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <div className="text-base font-medium text-foreground mb-3">Quick Goal Entry</div>
      
      <FormField 
        label="Goal" 
        required
        size="lg"
      >
        <Input 
          placeholder="What's your goal?"
          className="h-12 text-base"
        />
      </FormField>
      
      <FormField 
        label="Category"
        size="lg"
      >
        <Select>
          <SelectTrigger className="h-12">
            <SelectValue placeholder="Pick a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fitness">Fitness</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="home">Home</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <Button size="lg" className="w-full mt-6">
        Create Goal
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized form with larger touch targets and simplified layout."
      }
    }
  }
}