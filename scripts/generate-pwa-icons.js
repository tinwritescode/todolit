#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon as a placeholder
const createSVGIcon = (/** @type {number} */ size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ffffff" font-family="Arial, sans-serif" font-size="${size * 0.3}">L</text>
</svg>`;
};

// Convert SVG to PNG using a simple approach (this is a placeholder)
// In a real scenario, you'd use a library like sharp or canvas
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('Creating placeholder PWA icons...');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(svgPath, svgContent);
  console.log(`Created ${svgPath}`);
});

console.log('PWA icons created successfully!');
console.log('Note: These are SVG placeholders. For production, convert them to PNG using a tool like sharp or an online converter.');
