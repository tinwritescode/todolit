declare module '@ducanh2912/next-pwa' {
  import type { NextConfig } from 'next';
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    buildExcludes?: RegExp[];
  }
  
  function withPWA(config: NextConfig & { pwa?: PWAConfig }): NextConfig;
  
  export default withPWA;
}
