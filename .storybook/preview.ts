import type { Preview } from '@storybook/nextjs-vite'
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
    },
    docs: {
      toc: true,
    },
    layout: "centered",
    backgrounds: {
      default: "light",
      values: [
        {
          name: "light",
          value: "#ffffff",
        },
        {
          name: "dark",
          value: "#0f172a",
        },
        {
          name: "neutral",
          value: "#f8fafc",
        },
      ],
    },
    viewport: {
      viewports: {
        mobile1: {
          name: "Small Mobile",
          styles: {
            width: "320px",
            height: "568px",
          },
        },
        mobile2: {
          name: "Large Mobile",
          styles: {
            width: "414px",
            height: "896px",
          },
        },
        tablet: {
          name: "Tablet",
          styles: {
            width: "768px",
            height: "1024px",
          },
        },
        desktop: {
          name: "Desktop",
          styles: {
            width: "1024px",
            height: "768px",
          },
        },
        largeDesktop: {
          name: "Large Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
      },
    },
    a11y: {
      element: "#root",
      config: {},
      options: {},
      manual: true,
      test: 'todo'
    },
  },
  globalTypes: {
    theme: {
      name: "Theme",
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: ["light", "dark"],
        showName: true,
        dynamicTitle: true,
      },
    },
    locale: {
      name: "Locale",
      description: "Internationalization locale",
      defaultValue: "en",
      toolbar: {
        icon: "globe",
        items: [
          { value: "en", title: "English" },
          { value: "es", title: "Español" },
          { value: "fr", title: "Français" },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";
      
      // Add theme class to html element
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
      }

      return (
        <div className={`min-h-screen transition-colors duration-200 ${theme}`}>
          <div className="bg-background text-foreground p-4">
            <Story />
          </div>
        </div>
      );
    },
  ],
  tags: ["autodocs"],
};

export default preview;