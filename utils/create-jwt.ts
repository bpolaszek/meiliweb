import sign from 'jwt-encode'
import { type Key, type TokenSearchRules } from 'meilisearch'

type JWTPayload = {
  apiKeyUid: string
  searchRules: TokenSearchRules
  exp?: number
}

export const createJwt = (
  searchRules: TokenSearchRules,
  key: Key,
  expiresAt?: Date | null,
) => {
  const { key: signingKey, uid: apiKeyUid } = key
  const payload: JWTPayload = {
    searchRules,
    apiKeyUid,
    exp: expiresAt
      ? Math.floor(new Date('2012.08.10').getTime() / 1000)
      : undefined,
  }

  return sign(payload, signingKey)
}
