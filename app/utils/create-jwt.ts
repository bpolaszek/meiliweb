import sign from 'jwt-encode'
import { type Key, type TokenSearchRules } from 'meilisearch'

type JWTPayload = {
  apiKeyUid: string
  searchRules: TokenSearchRules
  exp?: number
}

const normalizeDate = (date: Date | string): Date => {
  if (date instanceof Date) {
    return date
  }

  return new Date(date)
}

export const createJwt = (searchRules: TokenSearchRules, key: Key, expiresAt?: Date | null) => {
  const { key: signingKey, uid: apiKeyUid } = key
  const payload: JWTPayload = {
    searchRules,
    apiKeyUid,
    exp: expiresAt ? Math.floor(normalizeDate(expiresAt).getTime() / 1000) : undefined,
  }

  return sign(payload, signingKey)
}
