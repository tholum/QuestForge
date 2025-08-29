import type { StorybookConfig } from "@storybook/nextjs-vite";
import path from "path";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "viteFinal": async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": path.resolve(__dirname, "../src"),
        // Mock Next.js navigation modules
        "next/navigation": path.resolve(__dirname, "./next-navigation-mock.js"),
      };
    }

    // Define environment variables
    config.define = {
      ...config.define,
      'process.env.__NEXT_ROUTER_BASEPATH': '""',
      'process.env.NODE_ENV': '"development"',
    };

    return config;
  },
  "staticDirs": [
    "../public"
  ],
  "features": {
    "buildStoriesJson": true
  },
  "typescript": {
    "check": false,
    "reactDocgen": "react-docgen-typescript",
    "reactDocgenTypescriptOptions": {
      "shouldExtractLiteralValuesFromEnum": true,
      "propFilter": (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    }
  }
};
export default config;