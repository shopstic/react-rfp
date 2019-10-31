import ResizeObserver from 'resize-observer-polyfill'
import { Observable } from 'rxjs'

export { ResizeObserverEntry }

/**
 * Observe changes in size for 1 or more elements.
 * @param nodes The nodes to observe.
 * @returns The size observable.
 */
export function observeSize(...nodes: Element[]) {
  return new Observable<ResizeObserverEntry>(ob => {
    const ro = new ResizeObserver(entries => {
      entries.forEach(entry => {
        ob.next(entry)
      })
    })

    for (const n of nodes) {
      ro.observe(n)
    }

    return () => {
      for (const n of nodes) {
        ro.unobserve(n)
      }
    }
  })
}
