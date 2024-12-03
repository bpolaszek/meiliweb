import { xxh32 as hash } from 'xxh32'

export const xxh32 = (input: string): string => {
  return hash(input, 0).toString(16).padStart(8, '0')
}
