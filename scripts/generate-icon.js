/**
 * Generates resources/icon.png — a 256x256 blue PNG with a "W" monogram.
 * Uses only Node.js built-in modules. Run via: node scripts/generate-icon.js
 */
const { deflateSync, crc32 } = require('zlib')
const { writeFileSync, mkdirSync } = require('fs')
const { join } = require('path')

const SZ = 256

function uint32BE(n) {
  const b = Buffer.alloc(4)
  b.writeUInt32BE(n >>> 0)
  return b
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const crcVal = crc32(Buffer.concat([typeBuf, data]))
  return Buffer.concat([uint32BE(data.length), typeBuf, data, uint32BE(crcVal)])
}

const IHDR = Buffer.alloc(13)
IHDR.writeUInt32BE(SZ, 0)
IHDR.writeUInt32BE(SZ, 4)
IHDR[8] = 8; IHDR[9] = 2 // bit depth, RGB
IHDR[10] = IHDR[11] = IHDR[12] = 0

const BG = [41, 98, 255]   // #2962FF
const FG = [255, 255, 255] // white
const RADIUS = SZ / 2      // rounded corners: full circle? no — just square with slight rounding
const CX = SZ / 2
const CY = SZ / 2
const CORNER_R = 40

function inRoundedRect(x, y) {
  const margin = 0
  const left = margin, right = SZ - 1 - margin
  const top = margin, bottom = SZ - 1 - margin
  if (x < left || x > right || y < top || y > bottom) return false
  // Check corner roundness
  const corners = [[left + CORNER_R, top + CORNER_R], [right - CORNER_R, top + CORNER_R],
                   [left + CORNER_R, bottom - CORNER_R], [right - CORNER_R, bottom - CORNER_R]]
  for (const [cx, cy] of corners) {
    if (x < cx && y < cy && (x - cx) ** 2 + (y - cy) ** 2 > CORNER_R ** 2) return false
    if (x > right - CORNER_R + (cx - (left + CORNER_R)) && y < cy && (x - cx) ** 2 + (y - cy) ** 2 > CORNER_R ** 2) return false
    if (x < cx && y > bottom - CORNER_R && (x - cx) ** 2 + (y - cy) ** 2 > CORNER_R ** 2) return false
  }
  return true
}

// Draw a thick W using line segments (anti-alias not needed — pixel art style)
const wPixels = new Set()
function drawLine(x0, y0, x1, y1, thickness) {
  const dx = x1 - x0, dy = y1 - y0
  const len = Math.sqrt(dx * dx + dy * dy)
  const steps = Math.ceil(len * 2)
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const cx = Math.round(x0 + t * dx)
    const cy = Math.round(y0 + t * dy)
    for (let ox = -thickness; ox <= thickness; ox++) {
      for (let oy = -thickness; oy <= thickness; oy++) {
        if (ox * ox + oy * oy <= thickness * thickness) {
          wPixels.add(`${cx + ox},${cy + oy}`)
        }
      }
    }
  }
}

// W letterform — scale to fit 256x256 with generous margins
const m = 38 // margin
const t = 16 // stroke thickness (radius)
const mid = SZ / 2
const top_y = m
const bot_y = SZ - m
const inner_y = bot_y - 50

drawLine(m, top_y, m + 36, bot_y, t)             // left leg down
drawLine(m + 36, bot_y, mid, inner_y, t)          // left V up-right
drawLine(mid, inner_y, SZ - m - 36, bot_y, t)    // right V down-right
drawLine(SZ - m - 36, bot_y, SZ - m, top_y, t)   // right leg up

// Build scanlines
const rows = []
for (let y = 0; y < SZ; y++) {
  const row = Buffer.alloc(1 + SZ * 3)
  row[0] = 0
  for (let x = 0; x < SZ; x++) {
    const inBg = inRoundedRect(x, y)
    const inFg = wPixels.has(`${x},${y}`)
    const col = inFg ? FG : (inBg ? BG : [255, 255, 255])
    row[1 + x * 3] = col[0]
    row[1 + x * 3 + 1] = col[1]
    row[1 + x * 3 + 2] = col[2]
  }
  rows.push(row)
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  makeChunk('IHDR', IHDR),
  makeChunk('IDAT', deflateSync(Buffer.concat(rows))),
  makeChunk('IEND', Buffer.alloc(0))
])

const outDir = join(__dirname, '..', 'resources')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'icon.png'), png)
console.log(`✓ Icon written to resources/icon.png (${SZ}x${SZ}, ${png.length} bytes)`)
