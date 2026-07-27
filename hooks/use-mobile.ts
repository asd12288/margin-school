import * as React from "react"

const MOBILE_BREAKPOINT = 768

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Rewritten from the shadcn default, which set state synchronously inside an
 * effect — that fails `react-hooks/set-state-in-effect` and costs an extra
 * render on every mount. `useSyncExternalStore` is what this hook always
 * wanted: the media query is an external store, and the server snapshot is
 * simply "not mobile" because a server has no viewport.
 *
 * Re-running `shadcn add sidebar` will overwrite this file with the upstream
 * version and reintroduce the lint error.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  )
}
