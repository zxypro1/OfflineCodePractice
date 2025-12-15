/**
 * Electron Builder Configuration
 * 支持 Windows、macOS 和 Linux 的跨平台构建
 */
module.exports = {
  // 应用标识
  appId: 'com.algorithm.practice',
  productName: 'Algorithm Practice',
  
  // 应用元数据
  copyright: 'Copyright © 2024 zxypro1',
  
  // 构建目录
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  
  // 打包文件
  files: [
    'electron-main.js',
    'electron-preload.js',
    'next.config.js',
    'package.json',
    'pages/**/*',
    'src/**/*',
    'styles/**/*',
    '.next/**/*',
    'public/**/*',
    'problems/**/*',
    'locales/**/*',
    'node_modules/@swc/helpers/**/*',
    'node_modules/**/*',
    '!node_modules/**/test/**',
    '!node_modules/**/tests/**',
    '!node_modules/**/*.md',
    '!node_modules/**/LICENSE*',
    '!node_modules/**/.github/**',
    '!node_modules/**/*.map'
  ],
  
  // 额外资源
  extraResources: [
    {
      from: 'problems',
      to: 'problems',
      filter: ['**/*']
    }
  ],
  
  // ASAR 配置（为避免 React 重复实例导致 useContext 为空，先关闭 asar）
  asar: false,
  asarUnpack: [],

  // ==================== Windows 配置 ====================
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      },
      {
        target: 'portable',
        arch: ['x64']
      }
    ],
    // Windows 需要 .ico 格式，electron-builder 会自动从 png 转换
    icon: 'build/icon.ico',
    artifactName: '${productName}-${version}-Windows-${arch}.${ext}',
    // 文件关联
    fileAssociations: [
      {
        ext: 'algo',
        name: 'Algorithm Problem',
        description: 'Algorithm Practice Problem File',
        role: 'Editor'
      }
    ]
  },
  
  // NSIS 安装程序配置
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Algorithm Practice',
    // 安装语言
    language: 2052, // 简体中文
    multiLanguageInstaller: true,
    // 安装包命名
    artifactName: '${productName}-${version}-Windows-Setup.${ext}'
  },

  // 便携版配置
  portable: {
    artifactName: '${productName}-${version}-Windows-Portable.${ext}'
  },

  // ==================== macOS 配置 ====================
  mac: {
    // target 不指定 arch，由 CLI 参数 (--x64 / --arm64) 控制
    target: ['dmg', 'zip'],
    icon: 'public/icon.png',
    category: 'public.app-category.developer-tools',
    artifactName: '${productName}-${version}-macOS-${arch}.${ext}',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'build/entitlements.mac.plist',
    entitlementsInherit: 'build/entitlements.mac.plist',
    // 签名配置：如果提供了证书则签名，否则跳过
    // 注意：不设置 identity: null，让 electron-builder 自动检测证书
    // 应用捆绑 ID
    bundleVersion: '1',
    bundleShortVersion: '0.0.9',
    // 文件关联
    fileAssociations: [
      {
        ext: 'algo',
        name: 'Algorithm Problem',
        role: 'Editor'
      }
    ],
    // Dock 图标弹跳
    darkModeSupport: true,
    // 公证配置
    notarize: process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD ? {
      teamId: process.env.APPLE_TEAM_ID
    } : false
  },
  
  // DMG 配置
  dmg: {
    contents: [
      {
        x: 130,
        y: 220
      },
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications'
      }
    ],
    window: {
      width: 540,
      height: 380
    },
    backgroundColor: '#1a1a2e',
    // 使用简化标题避免 CI 中的挂载问题
    title: 'AlgorithmPractice',
    artifactName: '${productName}-${version}-macOS-${arch}.${ext}'
  },

  // ==================== Linux 配置 ====================
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    icon: 'public/icon.png',
    category: 'Development',
    artifactName: '${productName}-${version}-Linux-${arch}.${ext}',
    maintainer: 'zxypro1 <zxypro@example.com>',
    vendor: 'Algorithm Practice',
    synopsis: '离线算法练习应用',
    description: '基于 WASM 的离线算法练习应用，支持 JavaScript、TypeScript 和 Python',
    // 桌面文件
    desktop: {
      Name: 'Algorithm Practice',
      Comment: '离线算法练习',
      Categories: 'Development;IDE;',
      Keywords: 'algorithm;code;practice;programming;'
    },
    // 文件关联
    fileAssociations: [
      {
        ext: 'algo',
        name: 'Algorithm Problem',
        mimeType: 'application/x-algorithm-problem'
      }
    ]
  },

  // AppImage 配置
  appImage: {
    artifactName: '${productName}-${version}-Linux.${ext}',
    category: 'Development'
  },

  // Deb 包配置
  deb: {
    depends: ['libnotify4', 'libxtst6', 'libnss3'],
    artifactName: '${productName}-${version}-Linux.${ext}'
  },

  // RPM 包配置
  rpm: {
    depends: ['libnotify', 'libXtst', 'nss'],
    artifactName: '${productName}-${version}-Linux.${ext}'
  },

  // 发布配置（可选，用于自动更新）
  publish: null
};
