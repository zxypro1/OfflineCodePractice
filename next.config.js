/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support both server and static output
  output: process.env.NEXT_OUTPUT === 'export' ? 'export' : undefined,
  // Disable image optimization for Electron compatibility
  images: {
    unoptimized: true
  },
  // i18n 国际化配置
  i18n: {
    locales: ['zh', 'en'],
    defaultLocale: 'zh',
    localeDetection: false
  },
  // Webpack configuration for WASM support
  webpack: (config, { isServer }) => {
    // Enable WebAssembly
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Handle .wasm files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    
    return config;
  },
  // Transpile packages that need it
  transpilePackages: [],
  // Disable telemetry for desktop app
  env: {
    NEXT_TELEMETRY_DISABLED: '1'
  }
};

module.exports = nextConfig;
