There is no boilerplate and there are no contexts, actions, reducers, dispatchers, sagas, thunks, or epics. You can structure your data however you want in local or global stores. It doesn’t modify your data at all, and you can just call get() to get the raw data and set() to change it.


```tsx
import { observable, observe } from "@legendapp/state"
import { observer } from "@legendapp/state/react"

const settings$ = observable({ theme: 'dark' })

// get returns the raw data
settings$.theme.get() // 'dark'
// set sets
settings$.theme.set('light')

// Computed observables with just a function
const isDark$ = observable(() => settings$.theme.get() === 'dark')

// observing contexts re-run when tracked observables change
observe(() => {
  console.log(settings$.theme.get())
})

const Component = observer(function Component() {
    const theme = state$.settings.theme.get()

    return <div>Theme: {theme}</div>
})
```


```tsx
import { observable } from "@legendapp/state"
import { Memo, useObservable } from "@legendapp/state/react"
import { useRef, useState } from "react"
import { useInterval } from "usehooks-ts"

function NormalComponent() {
  const [count, setCount] = useState(1)
  const renderCount = useRef(1).current++

  useInterval(() => {
    setCount((v) => v + 1)
  }, 600)

  // This re-renders when count changes
  return (
    <FlashingDiv pad>
      <h5>Normal</h5>
      <div>Renders: {renderCount}</div>
      <div>Count: {count}</div>
    </FlashingDiv>
  )
}
function FineGrained() {
  const count$ = useObservable(1)
  const renderCount = useRef(1).current++

  useInterval(() => {
    count$.set((v) => v + 1)
  }, 600)

  // The text updates itself so the component doesn't re-render
  return (
    <FlashingDiv pad>
      <h5>Fine-grained</h5>
      <div>Renders: {renderCount}</div>
      <div>Count: <Memo>{count$}</Memo></div>
    </FlashingDiv>
  )
}
```