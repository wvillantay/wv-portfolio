/**
 * Sections that animate on scroll must not create their ScrollTriggers until the
 * hero pin exists and the page has been re-measured; otherwise their start positions
 * are computed without the pin spacer and reveals fire immediately at load.
 */
let ready = false
const waiters = new Set()

export function markSiteReady() {
  ready = true
  waiters.forEach((cb) => cb())
  waiters.clear()
}

export function whenSiteReady(cb) {
  if (ready) {
    cb()
    return () => {}
  }
  waiters.add(cb)
  return () => waiters.delete(cb)
}
