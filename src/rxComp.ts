import React, { ReactNode } from 'react'
import { Observable, Subscription } from 'rxjs'

function fixSubscription<T>(
  current?: Observable<T>,
  next?: Observable<T>,
  currentSub?: Subscription,
): Subscription | undefined {
  if (current === next) {
    return
  }

  unsubscribeIf(currentSub)
  return subscribeIf(() => {}, next)
}

function subscribeIf<T>(fn: (value: T) => void, o?: Observable<T>): Subscription | undefined {
  return o ? o.subscribe(fn) : undefined
}

function unsubscribeIf(s?: Subscription) {
  if (s) {
    s.unsubscribe()
  }
}

export interface IRxComp1Props<T> {
  render: (value1?: T) => ReactNode
  o1?: Observable<T>
}

export interface IRxComp2Props<T1, T2> {
  render: (value1?: T1, value2?: T2) => ReactNode
  o1?: Observable<T1>
  o2?: Observable<T2>
}

export interface IRxComp3Props<T1, T2, T3> {
  render: (value1?: T1, value2?: T2, value3?: T3) => ReactNode
  o1?: Observable<T1>
  o2?: Observable<T2>
  o3?: Observable<T3>
}

interface IRxComp1State<T> {
  value1?: T
}

interface IRxComp2State<T1, T2> extends IRxComp1State<T1> {
  value2?: T2
}

interface IRxComp3State<T1, T2, T3> extends IRxComp2State<T1, T2> {
  value3?: T3
}

interface IRxComp1Subscription {
  o1?: Subscription
}

interface IRxComp2Subscription extends IRxComp1Subscription {
  o2?: Subscription
}

interface IRxComp3Subscription extends IRxComp2Subscription {
  o3?: Subscription
}

class RxComp1<T> extends React.Component<IRxComp1Props<T>, IRxComp1State<T>> {
  readonly state: IRxComp1State<T> = {}
  private subscriptions: IRxComp1Subscription = {}

  componentWillReceiveProps(nextProps: IRxComp1Props<T>) {
    const s = this.subscriptions
    s.o1 = fixSubscription(this.props.o1, nextProps.o1, s.o1)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = subscribeIf(value1 => this.setState({ value1 }), this.props.o1)
  }

  componentWillUnmount() {
    unsubscribeIf(this.subscriptions.o1)
  }

  shouldComponentUpdate(nextProps: IRxComp1Props<T>, nextState: IRxComp1State<T>) {
    return nextProps.render !== this.props.render || this.state.value1 !== nextState.value1
  }

  render() {
    const { value1 } = this.state
    return this.props.render(value1)
  }
}

class RxComp2<T1, T2> extends React.Component<IRxComp2Props<T1, T2>, IRxComp2State<T1, T2>> {
  readonly state: IRxComp2State<T1, T2> = {}
  private subscriptions: IRxComp2Subscription = {}

  componentWillReceiveProps(nextProps: IRxComp2Props<T1, T2>) {
    const s = this.subscriptions
    s.o1 = fixSubscription(this.props.o1, nextProps.o1, s.o1)
    s.o2 = fixSubscription(this.props.o2, nextProps.o2, s.o2)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = subscribeIf(value1 => this.setState({ value1 }), this.props.o1)
    s.o2 = subscribeIf(value2 => this.setState({ value2 }), this.props.o2)
  }

  componentWillUnmount() {
    unsubscribeIf(this.subscriptions.o1)
    unsubscribeIf(this.subscriptions.o2)
  }

  shouldComponentUpdate(nextProps: IRxComp2Props<T1, T2>, nextState: IRxComp2State<T1, T2>) {
    return (
      nextProps.render !== this.props.render ||
      this.state.value1 !== nextState.value1 ||
      this.state.value2 !== nextState.value2
    )
  }

  render() {
    const { value1, value2 } = this.state
    return this.props.render(value1, value2)
  }
}

class RxComp3<T1, T2, T3> extends React.Component<
  IRxComp3Props<T1, T2, T3>,
  IRxComp3State<T1, T2, T3>
> {
  readonly state: IRxComp3State<T1, T2, T3> = {}
  private subscriptions: IRxComp3Subscription = {}

  componentWillReceiveProps(nextProps: IRxComp3Props<T1, T2, T3>) {
    const s = this.subscriptions
    s.o1 = fixSubscription(this.props.o1, nextProps.o1, s.o1)
    s.o2 = fixSubscription(this.props.o2, nextProps.o2, s.o2)
    s.o3 = fixSubscription(this.props.o3, nextProps.o3, s.o3)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = subscribeIf(value1 => this.setState({ value1 }), this.props.o1)
    s.o2 = subscribeIf(value2 => this.setState({ value2 }), this.props.o2)
    s.o2 = subscribeIf(value3 => this.setState({ value3 }), this.props.o3)
  }

  componentWillUnmount() {
    unsubscribeIf(this.subscriptions.o1)
    unsubscribeIf(this.subscriptions.o2)
    unsubscribeIf(this.subscriptions.o3)
  }

  shouldComponentUpdate(
    nextProps: IRxComp3Props<T1, T2, T3>,
    nextState: IRxComp3State<T1, T2, T3>,
  ) {
    return (
      nextProps.render !== this.props.render ||
      this.state.value1 !== nextState.value1 ||
      this.state.value2 !== nextState.value2 ||
      this.state.value3 !== nextState.value3
    )
  }

  render() {
    const { value1, value2, value3 } = this.state
    return this.props.render(value1, value2, value3)
  }
}

export { RxComp1, RxComp2, RxComp3 }
