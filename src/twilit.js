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
    --twilit-chip-bg: rgba(0, 0, 0, 0.55);
    --twilit-chip-fg: #fff;
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
  :host([orientation="vertical"]) { touch-action: pan-x; cursor: ns-resize; }
  :host([handle="hidden"]) .handle { display: none; }
  .layer { position: absolute; inset: 0; }
  .base { position: relative; inset: auto; height: 100%; }
  .top { clip-path: inset(0 0 0 calc(var(--pos) * 1%)); }
  :host([orientation="vertical"]) .top { clip-path: inset(calc(var(--pos) * 1%) 0 0 0); }
  ::slotted(*) { max-width: 100%; }

  .divider {
    position: absolute; top: 0; bottom: 0;
    left: calc(var(--pos) * 1%);
    width: var(--twilit-divider-width);
    margin-left: calc(var(--twilit-divider-width) / -2);
    background: var(--twilit-divider-color);
    pointer-events: none;
  }
  :host([orientation="vertical"]) .divider {
    top: calc(var(--pos) * 1%); bottom: auto; left: 0; right: 0; width: auto;
    height: var(--twilit-divider-width);
    margin: calc(var(--twilit-divider-width) / -2) 0 0 0;
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
  :host([orientation="vertical"]) .handle { top: calc(var(--pos) * 1%); left: 50%; }
  :host([orientation="vertical"]) .handle svg { transform: rotate(90deg); }
  .handle:focus-visible { box-shadow: 0 0 0 3px #6c8cff, 0 2px 12px rgba(0, 0, 0, 0.35); }
  :host([dragging]) .handle { transform: scale(1.1); }
  svg { width: 55%; height: 55%; }

  .chip {
    position: absolute; padding: 4px 10px; border-radius: 999px;
    font: 600 11px/1.4 system-ui, sans-serif; letter-spacing: .06em; text-transform: uppercase;
    background: var(--twilit-chip-bg); color: var(--twilit-chip-fg);
    pointer-events: none; opacity: 0; transition: opacity .2s ease;
  }
  .chip.on { opacity: 1; }
  .chip.a { top: 12px; left: 12px; }
  .chip.b { top: 12px; right: 12px; }
  :host([orientation="vertical"]) .chip.b { top: auto; right: auto; bottom: 12px; left: 12px; }

  @media (prefers-reduced-motion: reduce) { .handle, .chip { transition: none; } }
</style>
<div class="layer base"><slot name="light"></slot></div>
<div class="layer top"><slot name="dark"></slot></div>
<div class="divider" part="divider"></div>
<span class="chip a" part="chip chip-light"></span>
<span class="chip b" part="chip chip-dark"></span>
<div class="handle" part="handle" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="100">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/>
  </svg>
</div>`;

const clamp = (n) => Math.min(100, Math.max(0, n));
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * <twilit-compare position="50" orientation="vertical" autoplay trigger="hover">
 *   <div slot="light">…</div>
 *   <div slot="dark">…</div>
 * </twilit-compare>
 *
 * Attributes
 *   position      0–100, divider position (default 50)
 *   orientation   "horizontal" (default) or "vertical" (light on top, dark below)
 *   autoplay      sweeps back and forth on its own; pauses while hovered, focused or dragged,
 *                 and while offscreen. Ignored under prefers-reduced-motion.
 *   duration      ms for one full sweep cycle (default 4000)
 *   trigger       "drag" (default) or "hover" (the divider follows the pointer)
 *   handle        "hidden" removes the round handle
 *   light-label / dark-label   optional corner chips naming each side
 *   label         accessible name for the handle
 *
 * Events: `change` ({ detail: { position } }) when the user moves the divider.
 * Methods: play(), pause().
 */
export class TwilitCompare extends HTMLElement {
  static observedAttributes = [
    "position", "label", "orientation", "autoplay", "duration", "light-label", "dark-label",
  ];

  #handle;
  #chipA;
  #chipB;
  #position = 50;
  #pointerId = null;
  #raf = 0;
  #phase = 0;
  #last = 0;
  #held = false; // hovered, focused or dragged
  #visible = true;
  #io;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(template.content.cloneNode(true));
    this.#handle = this.shadowRoot.querySelector(".handle");
    this.#chipA = this.shadowRoot.querySelector(".chip.a");
    this.#chipB = this.shadowRoot.querySelector(".chip.b");
  }

  connectedCallback() {
    this.#render();
    this.addEventListener("pointerdown", this.#onDown);
    this.addEventListener("pointermove", this.#onMove);
    this.addEventListener("pointerup", this.#onUp);
    this.addEventListener("pointercancel", this.#onUp);
    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.#handle.addEventListener("keydown", this.#onKey);
    this.#handle.addEventListener("focus", this.#onFocus);
    this.#handle.addEventListener("blur", this.#onBlur);
    if (typeof IntersectionObserver !== "undefined") {
      this.#io = new IntersectionObserver(([entry]) => {
        this.#visible = entry.isIntersecting;
        this.#sync();
      });
      this.#io.observe(this);
    }
    this.#sync();
  }

  disconnectedCallback() {
    this.removeEventListener("pointerdown", this.#onDown);
    this.removeEventListener("pointermove", this.#onMove);
    this.removeEventListener("pointerup", this.#onUp);
    this.removeEventListener("pointercancel", this.#onUp);
    this.removeEventListener("pointerenter", this.#onEnter);
    this.removeEventListener("pointerleave", this.#onLeave);
    this.#handle.removeEventListener("keydown", this.#onKey);
    this.#handle.removeEventListener("focus", this.#onFocus);
    this.#handle.removeEventListener("blur", this.#onBlur);
    this.#io?.disconnect();
    cancelAnimationFrame(this.#raf);
    this.#raf = 0;
  }

  attributeChangedCallback(name, _old, value) {
    if (name === "position") this.#set(Number(value), false);
    else this.#render();
    if (name === "autoplay") this.#sync();
  }

  get position() {
    return this.#position;
  }

  set position(value) {
    this.#set(Number(value), false);
  }

  get #vertical() {
    return this.getAttribute("orientation") === "vertical";
  }

  get #hoverMode() {
    return this.getAttribute("trigger") === "hover";
  }

  /** Start (or resume) the automatic sweep. */
  play() {
    this.setAttribute("autoplay", "");
  }

  /** Stop the automatic sweep. */
  pause() {
    this.removeAttribute("autoplay");
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
    this.#handle.setAttribute("aria-orientation", this.#vertical ? "vertical" : "horizontal");
    this.#handle.setAttribute("aria-label", this.getAttribute("label") || "Light and dark comparison");
    for (const [chip, attr] of [[this.#chipA, "light-label"], [this.#chipB, "dark-label"]]) {
      const text = this.getAttribute(attr);
      chip.textContent = text || "";
      chip.classList.toggle("on", !!text);
    }
  }

  // Autoplay: a sine sweep so it eases at both ends. Starts from wherever the divider is.
  #sync() {
    const run = this.hasAttribute("autoplay") && !this.#held && this.#visible && !reducedMotion() && this.isConnected;
    if (run && !this.#raf) {
      this.#phase = Math.asin(Math.max(-1, Math.min(1, (this.#position - 50) / 50)));
      this.#last = 0;
      this.#raf = requestAnimationFrame(this.#tick);
    } else if (!run && this.#raf) {
      cancelAnimationFrame(this.#raf);
      this.#raf = 0;
    }
  }

  #tick = (now) => {
    const dur = Number(this.getAttribute("duration")) || 4000;
    if (this.#last) this.#phase += ((now - this.#last) / dur) * Math.PI * 2;
    this.#last = now;
    this.#set(50 + 50 * Math.sin(this.#phase), false);
    this.#raf = requestAnimationFrame(this.#tick);
  };

  #fromPointer(e) {
    const rect = this.getBoundingClientRect();
    const size = this.#vertical ? rect.height : rect.width;
    if (size === 0) return;
    const offset = this.#vertical ? e.clientY - rect.top : e.clientX - rect.left;
    this.#set((offset / size) * 100, true);
  }

  #hold(on) {
    this.#held = on;
    this.#sync();
  }

  #onEnter = () => this.#hold(true);

  #onLeave = () => {
    if (this.#pointerId === null && document.activeElement !== this) this.#hold(false);
  };

  #onFocus = () => this.#hold(true);

  #onBlur = () => {
    if (!this.matches(":hover")) this.#hold(false);
  };

  #onDown = (e) => {
    if (e.button !== 0) return;
    this.#pointerId = e.pointerId;
    try {
      this.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone (e.g. a synthetic event); dragging still works while it stays over us.
    }
    this.setAttribute("dragging", "");
    this.#hold(true);
    this.#fromPointer(e);
  };

  #onMove = (e) => {
    if (e.pointerId === this.#pointerId) this.#fromPointer(e);
    else if (this.#hoverMode && e.pointerType === "mouse") this.#fromPointer(e);
  };

  #onUp = (e) => {
    if (e.pointerId !== this.#pointerId) return;
    this.#pointerId = null;
    this.removeAttribute("dragging");
    if (!this.matches(":hover")) this.#hold(false);
  };

  #onKey = (e) => {
    const step = e.shiftKey ? 10 : 2;
    const less = this.#position - step;
    const more = this.#position + step;
    const keys = this.#vertical
      ? { ArrowUp: less, ArrowLeft: less, ArrowDown: more, ArrowRight: more, Home: 0, End: 100 }
      : { ArrowLeft: less, ArrowDown: less, ArrowRight: more, ArrowUp: more, Home: 0, End: 100 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    this.#set(keys[e.key], true);
  };
}

if (!customElements.get("twilit-compare")) {
  customElements.define("twilit-compare", TwilitCompare);
}
