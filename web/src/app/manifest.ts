import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IT Asset Management',
    short_name: 'ITAM',
    description: 'Track and manage your IT assets easily.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f1115',
    theme_color: '#3b82f6',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
  };
}
