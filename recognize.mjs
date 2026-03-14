import { Jimp } from 'jimp'
import fs from 'fs'
import path from 'path'

const tileDir = 'src/assets/mahjong'
const patternDir = 'src/assets/hand-patterns'

async function getImageHash(image) {
  const gray = await Jimp.grayscale(image)
  const hash = []
  for (let y = 0; y < gray.height; y += 4) {
    for (let x = 0; x < gray.width; x += 4) {
      const pixel = gray.getPixelColor(x, y)
      hash.push(Jimp.intToRGBA(pixel).r > 127 ? 1 : 0)
    }
  }
  return hash
}

async function compareHash(h1, h2) {
  let diff = 0
  for (let i = 0; i < h1.length; i++) {
    if (h1[i] !== h2[i]) diff++
  }
  return diff / h1.length
}

async function recognize() {
  const patternImg = await Jimp.read(`${patternDir}/一番-1.jpg`)
  const patternHash = await getImageHash(patternImg)
  
  const tileFiles = fs.readdirSync(tileDir).filter(f => f.endsWith('.jpg'))
  const results = []
  
  for (const tileFile of tileFiles) {
    const tileImg = await Jimp.read(`${tileDir}/${tileFile}`)
    tileImg.resize(patternImg.width, patternImg.height)
    const tileHash = await getImageHash(tileImg)
    const similarity = 1 - await compareHash(patternHash, tileHash)
    results.push({ file: tileFile, similarity })
  }
  
  results.sort((a, b) => b.similarity - a.similarity)
  console.log('Top 5 matches:')
  results.slice(0, 5).forEach(r => console.log(r.file, r.similarity))
}

recognize()
