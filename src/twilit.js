const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    --twilit-divider-color: rgba(255, 255, 255, 0.9);
    --twilit-divider-width: 2px;
    --twilit-handle-size: 40px;
    --twilit-handle-bg: #fff;
    --twilit-handle-fg: #111;
    --twilit-radius: 16px;
    position: relative;
    display: block;
    overflow: hidden;
    border-radius: var(--twilit-radius);
    touch-action: pan-y;
    user-select: none;
    -webkit-user-select: none;
    cursor: ew-resize;
    --pos: 50;
  }
  .layer { position: absolute; inset: 0; }
  .base { position: relative; inset: auto; height: 100%; }
  .top { clip-path: inset(0 0 0 calc(var(--pos) * 1%)); }
  ::slotted(*) { max-width: 100%; }
  .divider {
    position: absolute; top: 0; bottom: 0;
    left: calc(var(--pos) * 1%);
    width: var(--twilit-divider-width);
    margin-left: calc(var(--twilit-divider-width) / -2);
    background: var(--twilit-divider-color);
    pointer-events: none;
  }
  .handle {
    position: absolute; top: 50%;
    left: calc(var(--pos) * 1%);
    width: var(--twilit-handle-size); height: var(--twilit-handle-size);
    margin: calc(var(--twilit-handle-size) / -2) 0 0 calc(var(--twilit-handle-size) / -2);
    border-radius: 50%;
    background: var(--twilit-handle-bg);
    color: var(--twilit-handle-fg);
    display: grid; place-items: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.35);
    outline: none;
    transition: transform 0.15s ease;
  }
  .handle:focus-visible { box-shadow: 0 0 0 3px #6c8cff, 0 2px 12px rgba(0, 0, 0, 0.35); }
  :host([dragging]) .handle { transform: scale(1.1); }
  svg { width: 55%; height: 55%; }
  @media (prefers-reduced-motion: reduce) { .handle { transition: none; } }
</style>
<div class="layer base"><slot name="light"></slot></div>
<div class="layer top"><slot name="dark"></slot></div>
<div class="divider" part="divider"></div>
<div class="handle" part="handle" role="slider" tabindex="0"
     aria-valuemin="0" aria-valuemax="100" aria-orientation="horizontal">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/>
  </svg>
</div>`;

const clamp = (n) => Math.min(100, Math.max(0, n));

/**
 * <twilit-compare position="50" label="Theme comparison">
 *   <div slot="light">…</div>
 *   <div slot="dark">…</div>
 * </twilit-compare>
 *
 * The light slot shows left of the divider, the dark slot right of it.
 * Fires a `change` event ({ detail: { position } }) as the split moves.
 */
export class TwilitCompare extends HTMLElement {
  static observedAttributes = ["position", "label"];

  #handle;
  #position = 50;
  #pointerId = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#handle = this.shadowRoot.querySelector(".handle");
  }

  connectedCallback() {
    this.#render();
    this.addEventListener("pointerdown", this.#onDown);
    this.addEventListener("pointermove", this.#onMove);
    this.addEventListener("pointerup", this.#onUp);
    this.addEventListener("pointercancel", this.#onUp);
    this.#handle.addEventListener("keydown", this.#onKey);
  }

  disconnectedCallback() {
    this.removeEventListener("pointerdown", this.#onDown);
    this.removeEventListener("pointermove", this.#onMove);
    this.removeEventListener("pointerup", this.#onUp);
    this.removeEventListener("pointercancel", this.#onUp);
    this.#handle.removeEventListener("keydown", this.#onKey);
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "position") this.#set(Number(value), false);
    else this.#render();
  }

  get position() {
    return this.#position;
  }

  set position(value) {
    this.#set(Number(value), false);
  }

  #set(value, emit) {
    if (Number.isNaN(value)) return;
    const next = clamp(value);
    if (next === this.#position) return;
    this.#position = next;
    this.#render();
    if (emit) {
      this.dispatchEvent(new CustomEvent("change", { detail: { position: next } }));
    }
  }

  #render() {
    this.style.setProperty("--pos", this.#position);
    this.#handle.setAttribute("aria-valuenow", Math.round(this.#position));
    this.#handle.setAttribute("aria-label", this.getAttribute("label") || "Light and dark comparison");
  }

  #fromPointer(e) {
    const rect = this.getBoundingClientRect();
    if (rect.width === 0) return;
    this.#set(((e.clientX - rect.left) / rect.width) * 100, true);
  }

  #onDown = (e) => {
    if (e.button !== 0) return;
    this.#pointerId = e.pointerId;
    this.setPointerCapture(e.pointerId);
    this.setAttribute("dragging", "");
    this.#fromPointer(e);
  };

  #onMove = (e) => {
    if (e.pointerId === this.#pointerId) this.#fromPointer(e);
  };

  #onUp = (e) => {
    if (e.pointerId !== this.#pointerId) return;
    this.#pointerId = null;
    this.removeAttribute("dragging");
  };

  #onKey = (e) => {
    const step = e.shiftKey ? 10 : 2;
    const keys = {
      ArrowLeft: this.#position - step,
      ArrowDown: this.#position - step,
      ArrowRight: this.#position + step,
      ArrowUp: this.#position + step,
      Home: 0,
      End: 100,
    };
    if (!(e.key in keys)) return;
    e.preventDefault();
    this.#set(keys[e.key], true);
  };
}

if (!customElements.get("twilit-compare")) {
  customElements.define("twilit-compare", TwilitCompare);
}
