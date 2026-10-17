// Script ponctuel : génère les icônes PNG de la PWA à partir de scripts/icon.svg.
// Pas de dépendance dans package.json : il utilise Playwright s'il est déjà installé
// sur la machine (ex. : PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node scripts/generate-icons.mjs).
// Les PNG produits sont commités dans public/icons/ ; ce script n'est pas lancé au build.
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright')

const svg = readFileSync(new URL('./icon.svg', import.meta.url), 'utf8')
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname

// scale < 1 : le dessin est réduit au centre (zone sûre des icônes maskable : 80 %).
const page = (size, scale) => `<html><body style="margin:0;background:#C2410C">
<div style="width:${size}px;height:${size}px;overflow:hidden;background:#C2410C">
<div style="width:${size}px;height:${size}px;transform:scale(${scale});transform-origin:center">
${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></div></body></html>`

const targets = [
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['icon-maskable-512.png', 512, 0.78],
  ['apple-touch-icon.png', 180, 0.9], // iOS arrondit lui-même les coins
]

const browser = await chromium.launch()
for (const [name, size, scale] of targets) {
  const p = await browser.newPage({ viewport: { width: size, height: size } })
  await p.setContent(page(size, scale))
  await p.screenshot({ path: out(name), clip: { x: 0, y: 0, width: size, height: size } })
  await p.close()
  console.log('écrit', name)
}
await browser.close()
