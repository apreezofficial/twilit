# Twilit

A tiny, dependency-free web component that compares two UIs with a draggable split: light vs dark, before vs after, old vs new.

- **~150 lines**, no dependencies, no build step
- Works in plain HTML, React, Vue, Svelte, anything that renders custom elements
- Pointer, touch and keyboard support, with `role="slider"` for screen readers
- Respects `prefers-reduced-motion`
- Styleable with CSS variables and `::part()`

## Install

From GitHub:

```bash
npm install github:apreezofficial/twilit
```

```js
import "twilit";
```

Or with no install, from a CDN (pin a release tag so it never changes under you):

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/apreezofficial/twilit@v0.2.0/src/twilit.js"></script>
```

Or copy `src/twilit.js` into your project. It has no dependencies.

## Use

```html
<twilit-compare position="50" label="Light and dark theme comparison" style="height: 340px">
  <div slot="light">…your light UI…</div>
  <div slot="dark">…your dark UI…</div>
</twilit-compare>
```

The `light` slot shows left of the divider and the `dark` slot shows right of it. Give the element a height (or let the light slot size it).

### Attributes and properties

| Name | Values | Default | Description |
| --- | --- | --- | --- |
| `position` | 0–100 | `50` | Divider position, as a percentage. Also a JS property. |
| `orientation` | `horizontal`, `vertical` | `horizontal` | `vertical` reveals from the top: light above, dark below. |
| `autoplay` | boolean | off | Sweeps back and forth on its own. Pauses while hovered, focused or dragged, and while offscreen. Ignored under `prefers-reduced-motion`. |
| `duration` | ms | `4000` | Time for one full autoplay cycle. |
| `trigger` | `drag`, `hover` | `drag` | `hover` makes the divider follow the mouse with no click. Touch still drags. |
| `handle` | `hidden` | shown | Removes the round handle and leaves just the divider. |
| `light-label`, `dark-label` | text | none | Small corner chips naming each side. |
| `label` | text | `Light and dark comparison` | Accessible name for the handle. |

```html
<twilit-compare orientation="vertical" autoplay duration="5000"
                light-label="Before" dark-label="After">
  <img slot="light" src="before.jpg" alt="">
  <img slot="dark" src="after.jpg" alt="">
</twilit-compare>
```

Methods: `play()` and `pause()` toggle autoplay from code.

### Events

`change` fires as the user moves the divider: `event.detail.position` is a number from 0 to 100. Setting `position` from code does not fire it.

### Keyboard

Focus the handle, then use the arrow keys to move by 2 (hold `Shift` for 10), `Home` and `End` for the edges. In vertical mode `↑`/`↓` move the divider.

### Styling

| CSS variable | Default |
| --- | --- |
| `--twilit-divider-color` | `rgba(255, 255, 255, 0.9)` |
| `--twilit-divider-width` | `2px` |
| `--twilit-handle-size` | `40px` |
| `--twilit-handle-bg` / `--twilit-handle-fg` | `#fff` / `#111` |
| `--twilit-radius` | `16px` |

Shadow parts: `divider`, `handle`, `chip`. Extra variables: `--twilit-chip-bg`, `--twilit-chip-fg`.

## Demo

Serve the repo root with any static server and open `demo/index.html`:

```bash
npx serve .
```

## Roadmap

- Click-to-jump with easing
- Angled (diagonal) split
- Framework wrappers if there is demand

## License

MIT
