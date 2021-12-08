/*!
  ISC License

  Copyright (c) 2021, Giuseppe Scotto Lavina

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted, provided that the above
  copyright notice and this permission notice appear in all copies.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE
  OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
*/

// noinspection JSUnusedGlobalSymbols,JSCheckFunctionSignatures

import { debounce } from './libs/debounce.js';
import { RESIZE_DEBOUNCE_TIME, ATTRIBUTES, assign, freeze, seal } from './galaxy-cursor.shared.js';

document.head.append(assign(document.createElement('style'), {
  textContent: 'canvas[is="galaxy-cursor"]{touch-action:pinch-zoom!important;background:#000}'
}));

const STOP = freeze({ call: 'stop' });
const START = freeze({ call: 'start' });
const EVENTS = ['pointerenter', 'pointerdown', 'pointermove'];
const WORKERS_REGISTRY = new FinalizationRegistry(worker => worker.terminate());
const OFFSCREEN_OBSERVER = new IntersectionObserver(entries => {
  for (const { isIntersecting, target: { active, post }} of entries) {
    active && post(isIntersecting ? START : STOP);
  }
}, {
  threshold: '.1'
});

export class HTMLGalaxyCursorElement extends HTMLCanvasElement {

  static get observedAttributes() { return ATTRIBUTES; }

  #post; #resizeObserver; #elastic; #offscreen; #active = true;
  #pointer = seal({ set: { x: 0, y: 0 }});
  #size = seal({ set: { width: 0, height: 0 }});

  get active() { return this.#active; }
  get post() { return this.#post; }

  constructor() {
    super();
    const worker = new Worker('galaxy-cursor/galaxy-cursor.worker.js', {
      type: 'module'
    });

    WORKERS_REGISTRY.register(this, worker);
    this.#post = worker.postMessage.bind(worker);
    this.addEventListener('contextmenu', e => e.preventDefault());
    this.#elastic = !this.hasAttribute('width') || !this.hasAttribute('width');
    if (this.#elastic) {
      this.#resizeObserver = new ResizeObserver(debounce(([{ contentRect: { width, height }}]) => {
        if (this.width !== width || this.height !== height) {
          this.#size.set.width = width;
          this.#size.set.height = height;
          this.#post(this.#size);
        }
      }, RESIZE_DEBOUNCE_TIME));
    }
  }

  handleEvent({ offsetX: x, offsetY: y }) {
    if (this.#pointer.set.x !== x || this.#pointer.set.y !== y) {
      this.#pointer.set.x = x;
      this.#pointer.set.y = y;
      this.#post(this.#pointer);
    }
  }

  connectedCallback() {
    const transfered = !!this.#offscreen;

    if (!transfered) {
      this.#offscreen = this.transferControlToOffscreen();
      this.#post({ set: { canvas: this.#offscreen }}, [ this.#offscreen ]);
    }
    this.#size.set.width = this.offsetWidth;
    this.#size.set.height = this.offsetHeight;
    this.#post(this.#size);
    this.#elastic && this.#resizeObserver.observe(this);
    EVENTS.forEach(ev => this.addEventListener(ev, this, { passive: true }));
    OFFSCREEN_OBSERVER.observe(this);
  }

  disconnectedCallback() {
    this.#post(STOP);
    OFFSCREEN_OBSERVER.unobserve(this);
    this.#elastic && this.#resizeObserver.unobserve(this);
    EVENTS.forEach(ev => this.removeEventListener(ev, this));
  }

  attributeChangedCallback(name, old, val) {
    if (old !== val && (!this.#elastic || !this[name])) {
      this.#post({ set: { [name]: parseInt(val, 10) }});
    }
  }

  start() {
    if (!this.#active) {
      this.#post(START);
      this.#active = true;
    }
  }

  stop() {
    if (this.#active) {
      this.#post(STOP);
      this.#active = false;
    }
  }
}

customElements.define(
  'galaxy-cursor',
  freeze(HTMLGalaxyCursorElement),
  { extends: 'canvas' }
);
