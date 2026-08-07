import { asyncComputed } from '@vueuse/core'
import { defineStore } from 'pinia'
import semver from 'semver/preload'

export const useVersion = defineStore('version', {
  state: () => ({}),
  getters: {
    version: () => {
      const meili = useMeiliClient()
      return asyncComputed(() => meili.getVersion())
    },
  },
  actions: {
    /**
     * Prereleases are matched on purpose: dev and RC builds report versions like
     * `1.52.0-rc.1`, which semver otherwise considers outside of every range — so a
     * `>=1.52.0` gate would hide 1.52 features from someone actually running 1.52.
     *
     * `version` is an `asyncComputed` and stays `undefined` until the instance answers;
     * `semver.satisfies(undefined, ...)` returns `false` on its own, so callers can gate
     * without guarding. Features simply read as unavailable for one tick.
     */
    satisfiesVersion(version: string) {
      return semver.satisfies(unref(this.version)?.pkgVersion, version, { includePrerelease: true })
    },
  },
})
