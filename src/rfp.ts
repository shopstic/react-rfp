import React, { ReactNode, ChangeEvent } from 'react'
import { isDate } from './compareUtils'
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  ConnectableObservable,
  concat,
  of,
} from 'rxjs'
import { distinctUntilChanged, filter, publishReplay, map, take, first } from 'rxjs/operators'
// @ts-ignore
import RxComp from './rxComp'
import { shallowCompare, deepEquals } from './compareUtils'

const STYLE_PROP = 'style'
const CLASSES_PROP = 'classes'

function compareProps(prev: any, next: any) {
  const keys = Object.keys(next)

  if (keys.length !== Object.keys(prev).length) {
    return false
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const prevValue = prev[key]
    const nextValue = next[key]

    if (key === STYLE_PROP || key === CLASSES_PROP) {
      if (!deepEquals(nextValue, prevValue)) {
        return false
      }
    } else if (
      nextValue !==
      prevValue /*  ||
      (!(nextValue instanceof Observable) && isNotNullObject(nextValue)) */
    ) {
      if (
        !isDate(nextValue) ||
        !isDate(prevValue) ||
        (nextValue as Date).getTime() !== (prevValue as Date).getTime()
      ) {
        return false
      }
    }
  }

  return true
}

/**
 * The observable that wraps the React node.
 */
export type VdomStream = Observable<ReactNode>

/**
 * A function that creates the necessary subscriptions
 * to perform a side effect
 */
export type Effect = () => Subscription

/**
 * Represents a Rx Component along with any effects.
 */
export interface VdomStreamWithEffects {
  /**
   * The node
   */
  vdom: VdomStream

  /**
   * The effects
   */
  effects?: Effect[]
}

/**
 * A factory function for creating a Rx component.
 * @param toVdomStream The function that transforms the props observable
 * into a React component.
 *
 * @returns The component type.
 */
export function createRxComponent<Props>(
  toVdomStream: (props: Observable<Props>) => VdomStream | VdomStreamWithEffects,
): React.ComponentType<Props> {
  interface IState {
    vdom: ReactNode
  }

  class ComponentFromStream extends React.Component<Props, IState> {
    private readonly props$: BehaviorSubject<Props>
    private subscriptions: Subscription[]

    constructor(props: Props) {
      super(props)
      this.state = { vdom: null }
      this.subscriptions = []
      this.props$ = new BehaviorSubject(props)
    }

    componentWillReceiveProps(nextProps: Props) {
      this.props$.next(nextProps)
    }

    // @ts-ignore
    shouldComponentUpdate(nextProps: Props, nextState: IState) {
      return nextState.vdom !== this.state.vdom
    }

    componentWillMount() {
      const ret = toVdomStream(this.props$.pipe(distinctUntilChanged(compareProps)))

      const { vdom, effects } = (function() {
        if ('vdom' in ret) {
          return ret as VdomStreamWithEffects
        } else {
          return {
            vdom: ret as VdomStream,
          }
        }
      })()

      this.subscriptions.push(
        vdom.subscribe(v => {
          this.setState({ vdom: v })
        }),
      )

      if (Array.isArray(effects)) {
        const subscriptions = effects.map(e => e())
        this.subscriptions.push.apply(this.subscriptions, subscriptions)
      }
    }

    componentWillUnmount() {
      this.props$.complete()
      this.subscriptions.forEach(s => s.unsubscribe())
    }

    render() {
      return this.state.vdom
    }
  }

  // @ts-ignore
  ComponentFromStream.displayName = toVdomStream.name
  return ComponentFromStream
}

/**
 * Creates a handler with no value that is tied to the lifetime of the passed observable.
 * Will be unbound when the `life` is complete.
 * @param life The lifetime to bind to.
 * @returns A setter to advance the value and the observable to subscribe to.
 */
export function createHandler0(life: Observable<any>): [() => void, Observable<any>] {
  const subject = new Subject<any>()
  life.subscribe({
    complete() {
      subject.complete()
    },
  })
  return [
    function() {
      subject.next(undefined)
    },
    subject,
  ]
}

/**
 * Creates a handler with 1 value that is tied to the lifetime of the passed observable.
 * Will be unbound when the `life` is complete.
 * @param life The lifetime to bind to.
 * @returns A setter to advance the value and the observable to subscribe to.
 */
export function createHandler<E>(life: Observable<any>): [(e: E) => void, Observable<E>] {
  const subject = new Subject<E>()
  life.subscribe({
    complete() {
      subject.complete()
    },
  })
  return [
    function(e: E) {
      subject.next(e)
    },
    subject,
  ]
}

/**
 * Creates a handler with 2 values that is tied to the lifetime of the passed observable.
 * Will be unbound when the `life` is complete.
 * @param life The lifetime to bind to.
 * @returns A setter to advance the value and the observable to subscribe to.
 */
export function createHandler2<A, B>(
  life: Observable<any>,
): [(a: A, b: B) => void, Observable<[A, B]>] {
  const subject = new Subject<[A, B]>()
  life.subscribe({
    complete() {
      subject.complete()
    },
  })
  return [
    function(a: A, b: B) {
      subject.next([a, b])
    },
    subject,
  ]
}

/**
 * An operator that filters out `undefined` values.
 */
export function defined<T>(): (source: Observable<T | undefined>) => Observable<T> {
  return function(source: Observable<T | undefined>) {
    return source.pipe(filter(u => u !== undefined)) as Observable<T>
  }
}

/**
 * An operator that filters out `undefined` values.
 */
export function notNull<T>(): (source: Observable<T | null>) => Observable<T> {
  return function(source: Observable<T | null>) {
    return source.pipe(filter(u => u !== null)) as Observable<T>
  }
}

/**
 * Ensures the passed observable is a `ConnectableObservable`.
 * Used to work around this issue: https://github.com/ReactiveX/rxjs/issues/2972
 * @param o The observable
 * @returns The `ConnectableObservable`
 */
export function asConnectable<T>(o: Observable<T>): ConnectableObservable<T> {
  if (process.env.NODE_ENV !== 'production') {
    if (!('connect' in o)) {
      throw new Error('Observable is not connectable')
    }
  }
  return o as any
}

/**
 * A factory function for creating side-effect that is tied to the lifetime
 * of the passed observable.
 * @param effect The creator of the effect.
 * @returns The function
 */
export function createEffect(effect: () => Subscription) {
  return function(life: Observable<any>) {
    let sub: Subscription | null = null
    life.pipe(take(1)).subscribe(function() {
      sub = effect()
    })

    life.subscribe({
      complete() {
        if (sub) {
          sub.unsubscribe()
        }
      },
    })
  }
}

const noop = () => {}

function rememberLast<T>(o: Observable<T>): [Observable<T>, () => void] {
  if ('connect' in o || o instanceof BehaviorSubject) {
    return [o, noop]
  }

  const p = o.pipe(publishReplay(1))
  const sub = asConnectable(p).connect()
  return [p, () => sub.unsubscribe()]
}

/**
 * Creates a renderer factory for a controlled standalone component that will render
 * when the value changes. The lifetime of this component is bound to the
 * inner observable.
 * @param o1 The observable that is the source of the value.
 * @returns The rendering function and the observable that represents the current value.
 */
export function createRx1<O1>(o1: Observable<O1>) {
  return function(life: Observable<any>) {
    const [p1, c1] = rememberLast(o1)

    if (c1 !== noop) {
      life.subscribe({
        complete() {
          c1()
        },
      })
    }

    const ret: [(render: (o1: O1) => ReactNode) => ReactNode, Observable<O1>] = [
      function(render: (o1: O1) => ReactNode) {
        return React.createElement(RxComp, {
          o1: p1,
          render(s: any) {
            if (!('o1' in s)) {
              return null
            }
            return render(s.o1)
          },
        })
      },
      p1,
    ]

    return ret
  }
}

/**
 * Creates a renderer factory for a controlled  standalone component that will render
 * when the values change. The lifetime of this component is bound to the
 * inner observable.
 * @param o1 The observable that is the source of the first value.
 * @param o2 The observable that is the source of the second value.
 * @returns The rendering function and the observable that represents the current value.
 */
export function createRx2<O1, O2>(o1: Observable<O1>, o2: Observable<O2>) {
  return function(life: Observable<any>) {
    const [p1, c1] = rememberLast(o1)
    const [p2, c2] = rememberLast(o2)

    if (c1 !== noop || c2 !== noop) {
      life.subscribe({
        complete() {
          c1()
          c2()
        },
      })
    }

    const ret: [
      (render: (o1: O1, o2: O2) => ReactNode) => ReactNode,
      Observable<O1>,
      Observable<O2>
    ] = [
      function(render: (o1: O1, o2: O2) => ReactNode) {
        return React.createElement(RxComp, {
          o1: p1,
          o2: p2,
          render(s: any) {
            if (!('o1' in s) || !('o2' in s)) {
              return null
            }
            return render(s.o1, s.o2)
          },
        })
      },
      p1,
      p2,
    ]

    return ret
  }
}

/**
 * Creates a renderer factory for a controlled  standalone component that will render
 * when the values change. The lifetime of this component is bound to the
 * inner observable.
 * @param o1 The observable that is the source of the first value.
 * @param o2 The observable that is the source of the second value.
 * @param o3 The observable that is the source of the third value.
 * @returns The rendering function and the observable that represents the current value.
 */
export function createRx3<O1, O2, O3>(o1: Observable<O1>, o2: Observable<O2>, o3: Observable<O3>) {
  return function(life: Observable<any>) {
    const [p1, c1] = rememberLast(o1)
    const [p2, c2] = rememberLast(o2)
    const [p3, c3] = rememberLast(o3)

    if (c1 !== noop || c2 !== noop || c3 !== noop) {
      life.subscribe({
        complete() {
          c1()
          c2()
          c3()
        },
      })
    }

    const ret: [
      (render: (o1: O1, o2: O2, o3: O3) => ReactNode) => ReactNode,
      Observable<O1>,
      Observable<O2>,
      Observable<O3>
    ] = [
      function(render: (o1: O1, o2: O2, o3: O3) => ReactNode) {
        return React.createElement(RxComp, {
          o1: p1,
          o2: p2,
          o3: p3,
          render(s: any) {
            if (!('o1' in s) || !('o2' in s) || !('o3' in s)) {
              return null
            }
            return render(s.o1, s.o2, s.o3)
          },
        })
      },
      p1,
      p2,
      p3,
    ]

    return ret
  }
}

// React.ChangeEventHandler<T>
type RxInputRender<V, E> = (value: V, onChange: (e: E) => void) => ReactNode

/**
 * Helper function that use [[createRx1]] for a controlled input field.
 * @param getValue The function to map from the event to the value
 * @param life The observable to control the lifetime of this component.
 * @param startValue$ The initial value.
 * @returns A rendering function and an observable that represents the current value.
 */
export function rxControlledInput<V, E>(
  getValue: (e: E) => V,
  life: Observable<any>,
  startValue$: Observable<V>,
): [(render: RxInputRender<V, E>) => ReactNode, Observable<V>] {
  const [onChange, event$] = createHandler<E>(life)

  const value$: Observable<V> = concat(startValue$.pipe(first()), event$.pipe(map(getValue)))

  const [withValue] = createRx1(value$)(life)

  return [
    function(render: RxInputRender<V, E>) {
      return withValue(function(v: V) {
        return render(v, onChange)
      })
    },
    value$,
  ]
}

/**
 * Helper function to create a controlled input for a text value. See [[rxControlledInput]]
 * @param life The observable to control the lifetime of this component.
 * @param startValue$ The initial value.
 */
export function rxInput(life: Observable<any>, startValue$: Observable<string> = of('')) {
  return rxControlledInput<string, ChangeEvent<HTMLInputElement>>(
    e => e.target.value,
    life,
    startValue$,
  )
}

/**
 * Helper function to create a controlled input for a checkbox value. See [[rxControlledInput]]
 * @param life The observable to control the lifetime of this component.
 * @param startValue$ The initial value.
 */
export function rxSwitch(life: Observable<any>, startValue$: Observable<boolean> = of(false)) {
  return rxControlledInput<boolean, ChangeEvent<HTMLInputElement>>(
    e => e.target.checked,
    life,
    startValue$,
  )
}

/**
 * Helper function to create a controlled input for a select value. See [[rxControlledInput]]
 * @param life The observable to control the lifetime of this component.
 * @param startValue$ The initial value.
 */
export function rxSelect(life: Observable<any>, startValue$: Observable<string> = of('')) {
  return rxControlledInput<string, ChangeEvent<HTMLSelectElement>>(
    e => e.target.value,
    life,
    startValue$,
  )
}

/**
 * Helper function to create a controlled input for a text field with the initial value
 * coming from the props of the outer component. See [[rxControlledInput]]
 * @param props The outer props.
 * @param mapper The mapping function to transform the props to a value
 */
export function rxInputFromProps<PropsType>(
  props: Observable<PropsType>,
  mapper: (props: PropsType) => string,
) {
  return rxControlledInput<string, ChangeEvent<HTMLInputElement>>(
    e => e.target.value,
    props,
    props.pipe(
      first(),
      map(mapper),
    ),
  )
}

/**
 * An operator that does a shallow object comparison for changes.
 */
export function distinctUntilActuallyChanged() {
  return distinctUntilChanged(shallowCompare)
}

/**
 * Takes the passed observable and publishes the value when
 * the component first mounts. Ties the lifetime to
 * the passed observable.
 * @param life The lifetime.
 * @returns The transofmration function to complete publish.
 */
export function publishOnMount<T>(life: Observable<any>) {
  // notice that we return a function here
  return function(source: Observable<T>) {
    const s = source.pipe(publishReplay(1))
    let subscription: Subscription | null = null

    life.pipe(take(1)).subscribe({
      next() {
        subscription = asConnectable(s).connect()
      },
    })

    life.subscribe({
      complete() {
        if (subscription) {
          subscription.unsubscribe()
        }
      },
    })

    return s
  }
}

/**
 * Factory for memoize an observable value.
 * @param init The function to initialize the value.
 * @returns The function to get or calculate the memoized value.
 */
export function memoizeObservable<T>(init: () => Observable<T>) {
  let value: Observable<T> | null = null

  return function() {
    if (!value) {
      value = init().pipe(publishReplay(1))
      asConnectable(value).connect()
    }
    return value
  }
}
