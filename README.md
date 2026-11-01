# Twilit

A tiny, dependency-free web component that compares two UIs with a draggable split: light vs dark, before vs after, old vs new.

- **~150 lines**, no dependencies, no build step
- Works in plain HTML, React, Vue, Svelte, anything that renders custom elements
- Pointer, touch and keyboard support, with `role="slider"` for screen readers
- Respects `prefers-reduced-motion`
- Styleable with CSS variables and `::part()`

## Install

```bash
npm install twilit
```

```js
import "twilit";
```

Or straight from a module script:

```html
<script type="module" src="https://unpkg.com/twilit"></script>
```

## Use

```html
<twilit-compare position="50" label="Light and dark theme comparison" style="height: 340px">
  <div slot="light">…your light UI…</div>
  <div slot="dark">…your dark UI…</div>
</twilit-compare>
```

The `light` slot shows left of the divider and the `dark` slot shows right of it. Give the element a height (or let the light slot size it).

### Attributes and properties

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | number 0–100 | `50` | Divider position, as a percentage from the left. Also a JS property. |
| `label` | string | `Light and dark comparison` | Accessible name for the handle. |

### Events

`change` fires as the user moves the divider: `event.detail.position` is a number from 0 to 100. Setting `position` from code does not fire it.

### Keyboard

Focus the handle, then use `←`/`→` (or `↓`/`↑`) to move by 2, hold `Shift` for 10, `Home` and `End` for the edges.

### Styling

| CSS variable | Default |
| --- | --- |
| `--twilit-divider-color` | `rgba(255, 255, 255, 0.9)` |
| `--twilit-divider-width` | `2px` |
| `--twilit-handle-size` | `40px` |
| `--twilit-handle-bg` / `--twilit-handle-fg` | `#fff` / `#111` |
| `--twilit-radius` | `16px` |

Shadow parts: `divider`, `handle`.

## Demo

Serve the repo root with any static server and open `demo/index.html`:

```bash
npx serve .
```

## Roadmap

- Vertical orientation
- Optional autoplay "peek" animation
- Framework wrappers if there is demand

## License

MIT
