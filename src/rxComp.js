import React from 'react'

class RxComp extends React.Component {
  constructor(props) {
    super(props)
    this.state = {}
    this.subscriptions = {}
  }

  detach(k) {
    const subs = this.subscriptions[k]
    if (subs && subs.length > 0) {
      subs.forEach(s => s.unsubscribe())
      this.subscriptions[k] = []
    }
  }

  attach(k, o) {
    this.subscriptions[k] = [o.subscribe(this.onNext.bind(this, k))]
  }

  componentWillReceiveProps(nextProps) {
    const keys = Object.keys(nextProps).filter(k => k !== 'render')
    const currentProps = this.props

    keys.forEach(k => {
      if (nextProps[k] !== currentProps[k]) {
        if (currentProps[k]) {
          this.detach(k)
        }
        if (nextProps[k]) {
          this.attach(k, nextProps[k])
        }
      }
    })
  }

  componentDidMount() {
    const keys = Object.keys(this.props).filter(k => k !== 'render')
    keys.forEach(k => {
      if (this.props[k]) {
        this.attach(k, this.props[k])
      }
    })
  }

  componentWillUnmount() {
    Object.keys(this.subscriptions).forEach(k => {
      this.detach(k)
    })
  }

  onNext = (k, o) => {
    this.setState({ [k]: o })
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.render !== this.props.render) {
      return true
    }

    const prevState = this.state
    const keys = Object.keys(nextState)

    if (keys.length !== Object.keys(prevState).length) {
      return true
    }

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const prevValue = prevState[key]
      const nextValue = nextState[key]

      if (nextValue !== prevValue) {
        return true
      }
    }

    return false
  }

  render() {
    return this.props.render(this.state)
  }
}

export default RxComp
