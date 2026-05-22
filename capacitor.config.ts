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
    backgroundColor: '#0f1117',
  },
  ios: {
    backgroundColor: '#0f1117',
  },
};

export default config;
