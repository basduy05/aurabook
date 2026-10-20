# Rule: Inline & Button Nesting Invariants in React 19

## 1. Inline Element Safety for Loaders & Spinners
- Reusable `<Loader />` or spinner components must wrap their root element in a `<span>` (e.g. `inline-flex items-center`) rather than a `<div>` or `<p>`.
- Never render block-level elements (`<div>`, `<p>`, `<h1>`–`<h6>`) directly inside an HTML `<button>`.

## 2. Stable Keys in Conditional Button Children
- When conditionally toggling between a loader and a button icon/label inside a `<button>`, always provide explicit, stable `key` attributes:
  ```tsx
  {pending ? (
    <Loader key="btn-loader" />
  ) : (
    <Icon key="btn-icon" />
  )}
  <span key="btn-text">{label}</span>
  ```
- **Rationale**: In React 19, the React DevTools hook (`installHook.js`) reconciles virtual fiber trees strictly. Omitting keys or nesting invalid block elements inside inline buttons can trigger fiber tree corruption:
  ```
  The children should not have changed if we pass in the same set.
  at updateFiberRecursively (chrome-extension://.../installHook.js)
  ```
