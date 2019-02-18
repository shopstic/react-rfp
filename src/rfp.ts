import React, { ReactNode, ChangeEvent } from 'react'
import {
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
  ConnectableObservable,
  of,
  concat,
} from 'rxjs'
import { distinctUntilChanged, filter, publishReplay, map, take, first } from 'rxjs/operators'
import { RxComp1, IRxComp1Props, RxComp2, IRxComp2Props, RxComp3, IRxComp3Props } from './rxComp'
import { shallowCompare } from './compareUtils'
import { Constructor } from './types'

const STYLE_PROP = 'style'
const CLASSES_PROP = 'classes'
const DATE_TYPE = '[object Date]'

function isDate(value: any) {
  return Object.prototype.toString.call(value) === DATE_TYPE
}

function equals(origin: any, target: any): boolean {
  const originType = typeof origin
  const targetType = typeof target

  if (originType === targetType) {
    if (originType === 'object') {
      for (const key in origin) {
        if (!(key in target)) {
          return false
        }

        if (!equals(origin[key], target[key])) {
          return false
        }
      }

      for (const key in target) {
        if (!(key in origin)) {
          return false
        }
      }

      return true
    } else {
      return origin === target
    }
  }

  return false
}

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
      if (!equals(nextValue, prevValue)) {
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

export type VdomStream = Observable<ReactNode>
export type Effect = () => Subscription
export interface VdomStreamWithEffects {
  vdom: VdomStream
  effects?: Effect[]
}

export interface IRxState {
  vdom: ReactNode
}

export abstract class ComponentFromStream<Props> extends React.Component<Props, IRxState> {
  private readonly props$: BehaviorSubject<Props>
  private subscriptions: Subscription[]

  constructor(props: Props) {
    super(props)
    this.state = { vdom: null }
    this.subscriptions = []
    this.props$ = new BehaviorSubject(props)
  }

  protected abstract toVdomStream(props: Observable<Props>): VdomStream | VdomStreamWithEffects

  componentWillReceiveProps(nextProps: Props) {
    this.props$.next(nextProps)
  }

  // @ts-ignore
  shouldComponentUpdate(nextProps: Props, nextState: IRxState) {
    return nextState.vdom !== this.state.vdom
  }

  componentWillMount() {
    const ret = this.toVdomStream(this.props$.pipe(distinctUntilChanged(compareProps)))

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

export function createRxComponent<Props>(
  toVdomStream: (props: Observable<Props>) => VdomStream | VdomStreamWithEffects,
): Constructor<ComponentFromStream<Props>> {
  class C extends ComponentFromStream<Props> {
    toVdomStream(props: Observable<Props>) {
      return toVdomStream(props)
    }
  }

  // @ts-ignore
  C.displayName = toVdomStream.name
  return C
}

export function createHandler0(life: Observable<any>): [() => void, Subject<any>] {
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

export function createHandler<E>(life: Observable<any>): [(e: E) => void, Subject<E>] {
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

export function createHandler2<A, B>(
  life: Observable<any>,
): [(a: A, b: B) => void, Subject<[A, B]>] {
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
export function defined<T>(): (source: Observable<T | undefined>) => Observable<T> {
  return function(source: Observable<T | undefined>) {
    return source.pipe(filter(u => u !== undefined)) as Observable<T>
  }
}

export function notNull<T>(): (source: Observable<T | null>) => Observable<T> {
  return function(source: Observable<T | null>) {
    return source.pipe(filter(u => u !== null)) as Observable<T>
  }
}

export function asConnectable<T>(o: Observable<T>): ConnectableObservable<T> {
  if (process.env.NODE_ENV !== 'production') {
    if (!('connect' in o)) {
      throw new Error('Observable is not connectable')
    }
  }
  return o as any
}

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

export function createRx1<O1>(o1: Observable<O1>) {
  class Comp extends RxComp1<O1> {}
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
        const props: IRxComp1Props<O1> = {
          o1: p1,
          render(value) {
            if (value === undefined) {
              return null
            }
            return render(value)
          },
        }
        return React.createElement(Comp, props)
      },
      p1,
    ]

    return ret
  }
}

export function createRx2<O1, O2>(o1: Observable<O1>, o2: Observable<O2>) {
  class Comp extends RxComp2<O1, O2> {}
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
        const props: IRxComp2Props<O1, O2> = {
          o1: p1,
          o2: p2,
          render(value1, value2) {
            if (value1 === undefined || value2 === undefined) {
              return null
            }
            return render(value1, value2)
          },
        }
        return React.createElement(Comp, props)
      },
      p1,
      p2,
    ]

    return ret
  }
}

export function createRx3<O1, O2, O3>(o1: Observable<O1>, o2: Observable<O2>, o3: Observable<O3>) {
  class Comp extends RxComp3<O1, O2, O3> {}
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
        const props: IRxComp3Props<O1, O2, O3> = {
          o1: p1,
          o2: p2,
          o3: p3,
          render(value1, value2, value3) {
            if (value1 === undefined || value2 === undefined || value3 === undefined) {
              return null
            }
            return render(value1, value2, value3)
          },
        }
        return React.createElement(Comp, props)
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

export function rxInput(life: Observable<any>, startValue: string = '') {
  return rxControlledInput<string, ChangeEvent<HTMLInputElement>>(
    e => e.target.value,
    life,
    of(startValue),
  )
}

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

export function rxSwitch(life: Observable<any>, startValue: boolean = false) {
  return rxControlledInput<boolean, ChangeEvent<HTMLInputElement>>(
    e => e.target.checked,
    life,
    of(startValue),
  )
}

export function rxSelect(life: Observable<any>, startValue: string = '') {
  return rxControlledInput<string, ChangeEvent<HTMLSelectElement>>(
    e => e.target.value,
    life,
    of(startValue),
  )
}

export function distinctUntilActuallyChanged() {
  return distinctUntilChanged(shallowCompare)
}

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
