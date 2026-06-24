/**
 * Local types for the Meilisearch Network topology (>= 1.37).
 *
 * The installed `meilisearch` client (v0.51.0) ships an OLDER `Network`/`Remote`
 * shape (only `self` + `remotes{url, searchApiKey}`). The 1.37+ topology adds
 * `leader`, `writeApiKey` on remotes, and `shards`. We define our own types here
 * rather than editing node_modules or relying on the stale client types, and cast
 * the client's `getNetwork()` / `updateNetwork()` results to these.
 *
 * @see https://www.meilisearch.com/docs/reference/api/network
 */

export type Remote = {
  url: string
  searchApiKey: string | null
  writeApiKey: string | null
}

export type Shard = {
  remotes: string[]
}

export type NetworkTopology = {
  self: string | null
  leader: string | null
  remotes: Record<string, Remote>
  shards: Record<string, Shard>
}

/**
 * Partial payload for PATCH /network.
 *
 * - `remotes`: a `null` value removes that remote (auto-removed from shards too).
 * - `shards`: each entry supports `remotes` (replace all), `addRemotes`, `removeRemotes`,
 *   applied in that order. A `null` shard value removes the shard.
 */
export type NetworkUpdate = {
  self?: string | null
  leader?: string | null
  remotes?: Record<string, Partial<Remote> | null>
  shards?: Record<string, { remotes?: string[]; addRemotes?: string[]; removeRemotes?: string[] } | null>
}
