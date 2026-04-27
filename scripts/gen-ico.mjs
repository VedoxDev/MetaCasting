import pngToIco from 'png-to-ico'
import sharp from 'sharp'
import { writeFileSync } from 'fs'

// Resize to 512x512 square (contain, transparent background)
const squarePng = await sharp('resources/icon.png')
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer()

const buf = await pngToIco(squarePng)
writeFileSync('build/icon.ico', buf)
console.log('build/icon.ico generated')
