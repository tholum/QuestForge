import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add experimental flag control for Turbopack with fallback
  experimental: {
    // Only add turbo config if not disabled
    ...(process.env.DISABLE_TURBOPACK !== 'true' && {
      turbo: {
        // Turbopack configuration for better HMR stability
        resolveAlias: {
          // Add explicit aliases for problematic imports
          '@/components/fitness': './src/components/fitness',
          '@/hooks': './src/hooks',
          '@/lib/fitness': './src/lib/fitness',
          '@/modules/fitness': './src/modules/fitness',
        }
      }
    })
  },

  // Webpack fallback configuration for development stability
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Better handling of dynamic imports in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            fitness: {
              test: /[\\/]components[\\/]fitness[\\/]/,
              name: 'fitness-components',
              chunks: 'all',
              priority: 10,
            },
            modules: {
              test: /[\\/]modules[\\/]/,
              name: 'modules',
              chunks: 'all',
              priority: 8,
            }
          }
        }
      }
    }
    
    return config
  },

  // Add fallback development command environment
  env: {
    DISABLE_TURBOPACK: process.env.DISABLE_TURBOPACK || 'false',
  }
};

export default nextConfig;
