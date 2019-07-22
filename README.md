# react-rfp
Utilities to assist with using RxJS and React.

## Main Goals
This library serves 2 main purposes:

#### Rx Integration
Reactive programming (Rx) fits well with React development paradigm. This library aims to provide utility to do common tasks easily and provide a simpler experience that allows users to take advantage of using Rx with React.

#### Optimization
This library bypasses the default state management offered by React. It provides an alternative approach that allows for isolated component rendering. State changes that would typically cause an entire component to re-render can be narrowed down to specific component areas.

## Core Concepts
The items below form the core building blocks of `react-rfp`.

### `createRxComponent`
This function creates an Rx component type. It should be used for components that have state, though that is not a requirement. The props that our component receives is an `Observable`. The function passed to `createRxComponent` should transform the props into a renderable node.

```tsx
interface IGreeterProps {
  greeting: string
}
const Component = createRxComponent<IGreeterProps>(function Greeter(props$) {
  return props$.pipe(
    map(({ greeting }) => <div>{greeting}, how are you going today?</div>),
  )
})
```

Usage of the new component is like any other React component:
```tsx
<Greeter greeting="Hi" />
```

The above is a very simple example and does not use state. We need more of the building blocks for that.

### `createHandler`
This function gives us a way to track changes in values. `createHandler` acts to store state within our main Rx component.

```tsx
const Component = createRxComponent<IGreeterProps>(function Greeter(props$) {
  const [onNameChange, name$] = createHandler<ChangeEvent<HTMLInputElement>>(props$)
  return props$.pipe(
    map(({ greeting }) => <div>{greeting}, how are you going today?</div>),
  )
}
```
First, note that we pass the `props$` to `createHandler`. This is to tie the lifetime of the handler to the current component. When the component is unmounted, the handler will automatically be cleaned up.

Secondly, we are given two things in return:
- A function that we can use as a change handler. In this case, we will use it in conjunction with a text field.
- An observable that stores the change events.\

Now let's do something with the value.

```tsx
const Component = createRxComponent<IHelloWorldProps>(function HelloWorld(props$) {
  const [onNameChange, name$] = createHandler<ChangeEvent<HTMLInputElement>>(props$)

  // Take the value from the event.
  const nameValue$ = name$.pipe(
    map(e => e.target.value),
    startWith(''),
  )


  return combineLatest(props$, nameValue$).pipe(
    map(([props, name]) => {
      console.log('render')
      return (
        <div>
          <input value={name} onChange={onNameChange} />
          <div>
            {props.greeting} {name}!
          </div>
        </div>
      )
    }),
  )
})
```

Now, as you type into the textbox, you'll see that the component is maintaining the state for the name. Also take note that the entire component is re-rendering as the value changes.

### `createRx1/createRxN`
This function creates a small isolated renderable component that can consume a value from one of the state observables, independently of the main component.

```tsx
const [withName, nameValue$] = createRx1(
    name$.pipe(
      map(e => e.target.value),
      startWith(''),
    ),
  )(props$)
```

We pass the observable that produces the value. Note that we pass `props$`, for the same reason as in `createHandler`.

It returns two values:
- A rendering function that will trigger when the `name` changes.
- An `Observable` that holds the current value provided by the underlying `Observable`.

Let's see it in action:

```tsx
const Component = createRxComponent<IHelloWorldProps>(function HelloWorld(props$) {
  const [onNameChange, name$] = createHandler<ChangeEvent<HTMLInputElement>>(props$)
  const [withName] = createRx1(
    name$.pipe(
      map(e => e.target.value),
      startWith(''),
    ),
  )(props$)
  return props$.pipe(
    map(props => {
      console.log('render')
      return (
        <div>
          {/* A bunch of other complicated components*/}
          {withName(name => {
            console.log('rendering name portion')
            return (
              <>
                <input value={name} onChange={onNameChange} />
                <div>
                  {props.greeting} {name}!
                </div>
              </>
            )
          })}
        </div>
      )
    }),
  )
})
```

The functionality is the same, except for one difference. Note that as you change the text field, the entire component no longer re-renders. Rather, only the portion depending on the name value is executed. This highlights the power of these isolated components as a performance tool.

### `createEffect`
An effect is an action that doesn't contribute to the rendering of the current component. Some examples might are:
- Making an API call
- Logging
- Passing values to parent handlers

In `react-rfp` we use these effects in the same way.

```tsx
createEffect(() => {
  return nameValue$.subscribe(v => {
      document.title = 'Name is: ' + v;
  })
})(props$);
```

The initializer function must return a subscription, because we're operating on our state variables. In this case, we are changing the title when the name `Observable` changes.

Also note passing `props$` to handle the lifetime of the effect.

Let's use `createEffect` in our sample component. We'll modify the props to take a submit function from the parent.

```tsx
interface IHelloWorldProps {
  greeting: string
  onSubmit: (name: string) => void
}

const Component = createRxComponent<IHelloWorldProps>(function HelloWorld(props$) {
  const [onNameChange, name$] = createHandler<ChangeEvent<HTMLInputElement>>(props$)
  const [withName, nameValue$] = createRx1(
    name$.pipe(
      map(e => e.target.value),
      startWith(''),
    ),
  )(props$)

  const [onSubmitClick, submitClick$] = createHandler<React.MouseEvent<HTMLElement, MouseEvent>>(
    props$,
  )

  createEffect(() => {
    return submitClick$
      .pipe(withLatestFrom(props$, nameValue$))
      .subscribe(([_, props, nameValue]) => {
        props.onSubmit(nameValue)
      })
  })(props$)

  createEffect(() => {
    return nameValue$.subscribe(v => {
      document.title = 'Name is: ' + v
    })
  })(props$)

  return props$.pipe(
    map(({ greeting, onSubmit }) => {
      console.log('render')
      return (
        <div>
          {/* A bunch of other complicated components*/}
          {withName(name => {
            console.log('rendering name portion')
            return (
              <>
                <input value={name} onChange={onNameChange} />
                <div>
                  {greeting} {name}!
                </div>
              </>
            )
          })}
          <button onClick={onSubmitClick}>Submit Value</button>
        </div>
      )
    }),
  )
})
```

In this case, when the user clicks the button, we gather the latest values from both the props (for the callback) and the name, then we call `onSubmit` to notify any interested parties.

### Utility functions
There are several utility functions that provide some shortcuts for writing boilerplate. For example:

`rxInput`, which helps to deal with text inputs:
```tsx
const Component = createRxComponent<IHelloWorldProps>(function HelloWorld(props$) {
  const [withName, name$] = rxInput(props$, of(''))

  return props$.pipe(
    map(() => withName((name, onChange) => <input value={name} onChange={onChange} />)),
  )
})
```

There are other utility functions such as `rxSwitch` and `rxSelect` to deal with other input types.

### When Not To Use Rx Features
Typically, Rx features aren't needed for stateless components:

```tsx
interface IListItemProps {
  text: string
  onClick: () => void
}
function ListItem({ onClick, text }: IListItemProps) {
  // No Rx
  return <li onClick={onClick}>{text}</li>
}
```

