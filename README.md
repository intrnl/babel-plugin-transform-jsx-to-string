# babel-plugin-transform-jsx-to-string

Transforms JSX into HTML string equivalent

```jsx
function App () {
  return (
    <>
      <div>Hello world!</div>
      <Counter count={0} />
    </>
  );
}

function Counter ({ count }) {
  return (
    <x-counter>
      <div>count: <span x-target='x-counter.display'>{count}</span></div>
      <button x-action='click:x-counter#increment'>+</button>
      <button x-action='click:x-counter#decrement'>-</button>
    </x-counter>
  );
}
```

```js
import { text as $l3h3$text } from '@intrnl/babel-plugin-transform-jsx-to-string/runtime';

function App() {
  return '<div>Hello world!</div>' + Counter({ count: 0 }) + '';
}

function Counter({ count }) {
  return '<x-counter><div>count: <span x-target="x-counter.display">' + $l3h3$text(count) + '</span></div><button x-action="click:x-counter#increment">+</button><button x-action="click:x-counter#decrement">-</button></x-counter>';
}
```
