/**
 * Adversoft Application Configuration
 * Provides centralized, typed access to environment variables.
 */

export const siteConfig = {
  name: 'Adversoft',
  tagline: 'Manage every billboard. Every booking. Every campaign.',
  description: 'The all-in-one outdoor advertising business management platform.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  links: {
    github: 'https://github.com',
  },
}

export const envConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL || '',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
}
