import React, { ReactNode } from 'react'
import { Observable, Subscription } from 'rxjs'

type MaybeSubscription = Subscription | undefined
type MaybeObservable<T> = Observable<T> | undefined
type ValueSetter<T> = (value: T) => void

interface IValue<T> {
  value: T
}

export interface IRxComp1Props<T> {
  render: (value1: T) => ReactNode
  o1?: Observable<T>
}

interface IRxComp1State<T> {
  value1?: IValue<T>
}

interface IRxComp1Subscription {
  o1?: Subscription
}

export interface IRxComp2Props<T1, T2> {
  render: (value1: T1, value2: T2) => ReactNode
  o1?: Observable<T1>
  o2?: Observable<T2>
}

interface IRxComp2State<T1, T2> extends IRxComp1State<T1> {
  value2?: IValue<T2>
}

interface IRxComp2Subscription extends IRxComp1Subscription {
  o2?: Subscription
}

export interface IRxComp3Props<T1, T2, T3> {
  render: (value1: T1, value2: T2, value3: T3) => ReactNode
  o1?: Observable<T1>
  o2?: Observable<T2>
  o3?: Observable<T3>
}

interface IRxComp3State<T1, T2, T3> extends IRxComp2State<T1, T2> {
  value3?: IValue<T3>
}

interface IRxComp3Subscription extends IRxComp2Subscription {
  o3?: Subscription
}

const unsubscribeIf = (subscription: MaybeSubscription) => {
  if (subscription) {
    subscription.unsubscribe()
  }
}

const renewSub = <T>(
  fn: ValueSetter<T>,
  next: MaybeObservable<T>,
  current?: MaybeObservable<T>,
  currentSub?: MaybeSubscription,
): MaybeSubscription => {
  if (current === next) {
    return
  }

  unsubscribeIf(currentSub)
  return next ? next.subscribe(fn) : undefined
}

const makeValue = <T>(value: T): IValue<T> => ({
  value,
})

const valueEquals = <T>(value1?: IValue<T>, value2?: IValue<T>): boolean =>
  value1 && value2 ? value1.value === value2.value : !value1 && !value2

export class RxComp1<T> extends React.Component<IRxComp1Props<T>, IRxComp1State<T>> {
  private readonly subscriptions: IRxComp1Subscription = {}
  public readonly state: IRxComp1State<T> = {}
  private readonly setValue1: ValueSetter<T>

  constructor(props: IRxComp1Props<T>) {
    super(props)
    this.setValue1 = v =>
      this.setState({
        value1: makeValue(v),
      })
  }

  UNSAFE_componentWillReceiveProps(nextProps: IRxComp1Props<T>) {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, nextProps.o1, this.props.o1, s.o1)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, this.props.o1)
  }

  componentWillUnmount() {
    unsubscribeIf(this.subscriptions.o1)
  }

  shouldComponentUpdate(nextProps: IRxComp1Props<T>, nextState: IRxComp1State<T>) {
    return (
      nextProps.render !== this.props.render || !valueEquals(this.state.value1, nextState.value1)
    )
  }

  render() {
    const { value1 } = this.state
    return value1 ? this.props.render(value1.value) : null
  }
}

export class RxComp2<T1, T2> extends React.Component<IRxComp2Props<T1, T2>, IRxComp2State<T1, T2>> {
  private readonly subscriptions: IRxComp2Subscription = {}
  public readonly state: IRxComp2State<T1, T2> = {}
  private readonly setValue1: ValueSetter<T1>
  private readonly setValue2: ValueSetter<T2>

  constructor(props: IRxComp2Props<T1, T2>) {
    super(props)
    this.setValue1 = v =>
      this.setState({
        value1: makeValue(v),
      })

    this.setValue2 = v =>
      this.setState({
        value2: makeValue(v),
      })
  }

  UNSAFE_componentWillReceiveProps(nextProps: IRxComp2Props<T1, T2>) {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, nextProps.o1, this.props.o1, s.o1)
    s.o2 = renewSub(this.setValue2, nextProps.o2, this.props.o2, s.o2)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, this.props.o1)
    s.o2 = renewSub(this.setValue2, this.props.o2)
  }

  componentWillUnmount() {
    unsubscribeIf(this.subscriptions.o1)
    unsubscribeIf(this.subscriptions.o2)
  }

  shouldComponentUpdate(nextProps: IRxComp2Props<T1, T2>, nextState: IRxComp2State<T1, T2>) {
    return (
      nextProps.render !== this.props.render ||
      !valueEquals(this.state.value1, nextState.value1) ||
      !valueEquals(this.state.value2, nextState.value2)
    )
  }

  render() {
    const { value1, value2 } = this.state
    return value1 && value2 ? this.props.render(value1.value, value2.value) : null
  }
}

export class RxComp3<T1, T2, T3> extends React.Component<
  IRxComp3Props<T1, T2, T3>,
  IRxComp3State<T1, T2, T3>
> {
  private readonly subscriptions: IRxComp3Subscription = {}
  public readonly state: IRxComp3State<T1, T2, T3> = {}
  private readonly setValue1: ValueSetter<T1>
  private readonly setValue2: ValueSetter<T2>
  private readonly setValue3: ValueSetter<T3>

  constructor(props: IRxComp3Props<T1, T2, T3>) {
    super(props)
    this.setValue1 = v =>
      this.setState({
        value1: makeValue(v),
      })

    this.setValue2 = v =>
      this.setState({
        value2: makeValue(v),
      })

    this.setValue3 = v =>
      this.setState({
        value3: makeValue(v),
      })
  }

  UNSAFE_componentWillReceiveProps(nextProps: IRxComp3Props<T1, T2, T3>) {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, nextProps.o1, this.props.o1, s.o1)
    s.o2 = renewSub(this.setValue2, nextProps.o2, this.props.o2, s.o2)
    s.o3 = renewSub(this.setValue3, nextProps.o3, this.props.o3, s.o3)
  }

  componentDidMount() {
    const s = this.subscriptions
    s.o1 = renewSub(this.setValue1, this.props.o1)
    s.o2 = renewSub(this.setValue2, this.props.o2)
    s.o3 = renewSub(this.setValue3, this.props.o3)
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
      !valueEquals(this.state.value1, nextState.value1) ||
      !valueEquals(this.state.value2, nextState.value2) ||
      !valueEquals(this.state.value3, nextState.value3)
    )
  }

  render() {
    const { value1, value2, value3 } = this.state
    return value1 && value2 && value3
      ? this.props.render(value1.value, value2.value, value3.value)
      : null
  }
}
