export const randomInt = (min: number, max: number, seed?: string): number => {
  if (undefined === seed) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  let seedNumber = 0
  for (let i = 0; i < seed.length; i++) {
    seedNumber = (seedNumber << 5) - seedNumber + seed.charCodeAt(i)
    seedNumber = seedNumber & seedNumber // Conversion en 32 bits
  }

  let t = (seedNumber += 0x6d2b79f5)
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  const result = ((t ^ (t >>> 14)) >>> 0) / 4294967296

  return Math.floor(result * (max - min + 1)) + min
}
