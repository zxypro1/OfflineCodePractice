#!/usr/bin/env node
/**
 * Icon Generator Script
 * 
 * 生成 Electron 应用所需的各种图标格式
 * 
 * 依赖：需要安装 sharp
 * npm install sharp --save-dev
 * 
 * 使用方法：
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.log('Installing sharp for image processing...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
    sharp = require('sharp');
  }

  const svgPath = path.join(__dirname, '../public/favicon.svg');
  const buildDir = path.join(__dirname, '../build');
  const publicDir = path.join(__dirname, '../public');

  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }

  // Create icons subdirectory
  const iconsDir = path.join(buildDir, 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgBuffer = fs.readFileSync(svgPath);

  // Icon sizes needed for different platforms
  const sizes = {
    // macOS
    mac: [16, 32, 64, 128, 256, 512, 1024],
    // Windows
    win: [16, 24, 32, 48, 64, 128, 256],
    // Linux
    linux: [16, 24, 32, 48, 64, 128, 256, 512]
  };

  console.log('🎨 Generating application icons...\n');

  try {
    // Generate main icon.png (512x512)
    console.log('📱 Creating main icon (512x512)...');
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon.png'));
    console.log('   ✅ public/icon.png');

    // Generate macOS icons
    console.log('\n🍎 Creating macOS icons...');
    for (const size of sizes.mac) {
      const filename = `icon_${size}x${size}.png`;
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, filename));
      console.log(`   ✅ ${filename}`);
    }

    // Generate @2x versions for macOS
    for (const size of [16, 32, 128, 256, 512]) {
      const filename = `icon_${size}x${size}@2x.png`;
      await sharp(svgBuffer)
        .resize(size * 2, size * 2)
        .png()
        .toFile(path.join(iconsDir, filename));
      console.log(`   ✅ ${filename}`);
    }

    // Generate Windows icon sizes
    console.log('\n🪟 Creating Windows icons...');
    for (const size of sizes.win) {
      const filename = `icon_${size}.png`;
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, filename));
      console.log(`   ✅ ${filename}`);
    }

    // Generate favicon.ico (multi-size) - simplified version
    console.log('\n🌐 Creating favicon...');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
    console.log('   ✅ favicon-32.png');

    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(publicDir, 'favicon-16.png'));
    console.log('   ✅ favicon-16.png');

    // Linux icons
    console.log('\n🐧 Creating Linux icons...');
    for (const size of sizes.linux) {
      const filename = `${size}x${size}.png`;
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, filename));
      console.log(`   ✅ ${filename}`);
    }

    console.log('\n✨ Icon generation complete!');
    console.log('\n📁 Generated files:');
    console.log('   - public/icon.png (main app icon)');
    console.log('   - build/icons/ (platform-specific icons)');
    console.log('\n💡 Note: For Windows .ico and macOS .icns files,');
    console.log('   electron-builder will automatically convert from PNG.');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

