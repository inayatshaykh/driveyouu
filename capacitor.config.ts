import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.urschauffeur.app',
  appName: "UR's Chauffeur",
  webDir: 'dist',
  server: {
    // For development — point to your live Vercel URL
    // Remove this for production builds
    // url: 'https://your-vercel-url.vercel.app',
    // cleartext: true,
  },
  android: {
    backgroundColor: '#020617',
    initialPath: '/booking',
    navigationBarColor: '#020617',
  },
  ios: {
    backgroundColor: '#020617',
    initialPath: '/booking',
  },
};

export default config;
