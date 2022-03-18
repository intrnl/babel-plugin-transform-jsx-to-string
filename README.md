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
import { html as $html, text as $text } from '@intrnl/babel-plugin-transform-jsx-to-string/runtime';

function App() {
  return $html('<div>Hello world!</div>' + $text(Counter({ count: 0 })) + '');
}

function Counter({ count }) {
  return $html('<x-counter><div>count: <span x-target="x-counter.display">' + $text(count) + '</span></div><button x-action="click:x-counter#increment">+</button><button x-action="click:x-counter#decrement">-</button></x-counter>');
}
```

## DOM property conversion

DOM/IDL properties are transformed equivalent HTML content attributes, however
this currently does not apply to spread attributes.
