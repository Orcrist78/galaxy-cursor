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


// noinspection FallThroughInSwitchStatementJS

import { ATTRIBUTES, RESIZE_DEBOUNCE_TIME } from './galaxy-cursor.shared.js';
import { EasingFunctions } from './libs/easing-functions.js';
import { debounce } from './libs/debounce.js';
import { tween } from './libs/tween.js';

const METHODS = [ 'start', 'stop' ];
const PROPS = [ 'x', 'y', 'canvas' ].concat(ATTRIBUTES);

(SCOPE => {
  tween.noraf = true;
  tween.easeDefault = 'easeInOutCirc';

  addEventListener('message', async ({ data: { set, call } }) => {
    if (typeof set === 'object') {
      for (const name in set) {
        if (PROPS.includes(name)) {
          await SCOPE.setProperty(name, set[name]);
          if (name === 'canvas') {
            SCOPE.ctx = SCOPE.canvas.getContext('2d');
          }
        }
      }
    }
    if (call && METHODS.includes(call)) {
      SCOPE[call]();
    }
  });
})({
  x: 0,
  y: 0,
  lx: 0,
  ly: 0,
  now: 1,
  rafID: 0,
  links: 5,
  width: 0,
  height: 0,
  ctx: null,
  tick: null,
  points: [],
  sradius: 2,
  density: 30,
  radius: 130,
  canvas: null,
  pause: false,
  speed: 1_000,
  distance: 30,
  accuracy: 10,
  cellWidth: 0,
  cellHeight: 0,
  active: false,
  gradient: false,
  offsetMargin: 0,
  ctxBuffer: null,
  canvasBuffer: null,
  drawBuffer: new Map(),
  async generatePoints() {
    const len = this.density * this.density;
    let id = 0;

    // tween.clear();
    this.points.length = len;
    for (let x = 0; x < this.density; x++) {
      for (let y = 0; y < this.density; y++) {
        const px = ((x * this.cellWidth) + (Math.random() * this.cellWidth)) | 0;
        const py = ((y * this.cellHeight) + (Math.random() * this.cellHeight)) | 0;
        let p = this.points[id];

        if (p) {
          p.x = p.ox = px;
          p.y = p.oy = py;
        } else {
          this.points[id] = p = {
            x: px, ox: px, y: py, oy: py, ca: 0, ty: 0, tx: 0, id,
            r: (this.sradius + (Math.random() * this.sradius)) | 0
          };
        }
        this.shiftPoint(p, 'x');
        this.shiftPoint(p, 'y');
        id++;
      }
    }
  },
  generateClosest() {
    const ret = [];

    if (this.width && this.height && this.links && this.density) {
      const buff = (this.density * ((this.density / 100) * this.accuracy)) | 0;
      const { length } = this.points;

      for (let i = 0; i < length; i++) {
        const sS = i - buff;
        const eE = i + buff;
        const s = sS >= 0 ? sS : 0;
        const e = eE <= length ? eE : length;
        const p1 = this.points[i];
        const { closest = [] } = p1;
        const genJob = res => setTimeout(() => {
          for (let j = s; j < e; j++) {
            const p2 = this.points[j];

            if (p1 !== p2) {
              const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              let placed = false;

              for (let k = 0; k < this.links; k++) {
                if (!closest[k]) {
                  closest[k] = p2;
                  placed = true;
                  break;
                }
              }
              if (!placed) {
                for (let x = 0; x < closest.length; x++) {
                  const near = closest[x];
                  const cdist = Math.hypot(near.x - p1.x, near.y - p1.y);

                  if (dist < cdist) {
                    closest[x] = p2;
                    break;
                  }
                }
              }
            }
          }
          p1.closest = closest;
          res();
        });

        ret.push(new Promise(genJob));
      }
    }
    return ret;
  },
  animate(now) {
    this.now = now;
    if (!this.pause) {
      let sX = ((this.x - this.offsetMargin) / this.cellWidth) | 0;
      let eX = ((this.x + this.offsetMargin) / this.cellWidth) | 0;
      let sY = ((this.y - this.offsetMargin) / this.cellHeight) | 0;
      let eY = ((this.y + this.offsetMargin) / this.cellHeight) | 0;

      this.ctx.clearRect(
        this.lx - this.offsetMargin,
        this.ly - this.offsetMargin,
        this.offsetMargin * 2,
        this.offsetMargin * 2
      );
      this.lx = this.x;
      this.ly = this.y;
      sX < 0 && (sX = 0);
      sY < 0 && (sY = 0);
      eX > this.density && (eX = this.density);
      eY > this.density && (eY = this.density);
      for (let x = sX; x < eX; x++) {
        for (let y = sY; y < eY; y++) {
          const idx = (x * this.density) + y;
          const point = this.points[idx];

          point.tx.update(now);
          point.ty.update(now);
          const dis = Math.abs(Math.hypot(this.x - point.x, this.y - point.y));

          if (dis <= this.radius / 10) {
            point.active = .5;
            point.ca = .8;
          } else if (dis <= this.radius) {
            const ease = EasingFunctions.easeInCubic((this.radius - dis) / this.radius);

            point.active = ease * .5;
            point.ca = ease * .8;
          } else {
            point.active = 0;
            point.ca = 0;
          }
          if (point.ca) {
            this.ctxBuffer.beginPath();
            this.ctxBuffer.arc(
              this.offsetMargin - (this.x - point.x),
              this.offsetMargin - (this.y - point.y),
              point.r, 0, 2 * Math.PI, false
            );
            this.ctxBuffer.fillStyle = 'rgba(156,217,249,' + point.ca + ')';
            this.ctxBuffer.fill();
          }
          if (point.active && point.closest) {
            for (const p of point.closest) {
              if (p.active) {
                const drawed = this.drawBuffer.has(point.id) && this.drawBuffer.get(point.id).has(p.id);

                if (!drawed) {
                  const x = this.offsetMargin - (this.x - point.x);
                  const y = this.offsetMargin - (this.y - point.y)
                  const px = this.offsetMargin - (this.x - p.x);
                  const py = this.offsetMargin - (this.y - p.y)

                  this.ctxBuffer.beginPath();
                  this.ctxBuffer.moveTo(x, y);
                  this.ctxBuffer.lineTo(px, py);
                  if (this.gradient) {
                    const style = this.ctxBuffer.createLinearGradient(px, py, x, y);

                    style.addColorStop(0, `rgba(156, 217, 249, ${ p.active })`);
                    style.addColorStop(1, `rgba(156, 217, 249, ${ point.active })`);
                    this.ctxBuffer.strokeStyle = style;
                  } else {
                    this.ctxBuffer.strokeStyle = `rgba(156, 217, 249, ${ Math.min(p.active, point.active) })`;
                  }
                  this.ctxBuffer.stroke();
                  this.ctxBuffer.closePath();
                  let set = this.drawBuffer.get(p.id);
                  if (!set) {
                    this.drawBuffer.set(p.id, (set = new Set()));
                  }
                  set.add(point.id);
                }
              }
            }
          }
        }
      }
      this.ctx.drawImage(
        this.canvasBuffer,
        0,
        0,
        this.offsetMargin * 2,
        this.offsetMargin * 2,
        this.x - this.offsetMargin,
        this.y - this.offsetMargin,
        this.offsetMargin * 2,
        this.offsetMargin * 2
      );
      this.ctxBuffer.clearRect(0, 0, this.canvasBuffer.width, this.canvasBuffer.height);
      this.drawBuffer.clear();
    }
    this.active && (this.rafID = requestAnimationFrame(this.tick));
  },
  shiftPoint(p, axe) {
    const _tween = p['t' + axe];
    const handler = _tween ? _tween.job.fn : (val, done) => {
      p[axe] = val;
      done && this.shiftPoint(p, axe);
    };
    const time = (this.speed + (Math.random() * this.speed)) | 0;
    const orig = p['o' + axe];
    const curr = p[axe];
    let dest = 0;

    do {
      dest = (orig - this.distance + (Math.random() * this.distance * 2));
    } while (dest === curr);
    p['t' + axe] = tween(curr, dest, time, handler, undefined, _tween);
  },
  async resize() {
    if (this.width && this.height && this.links && this.density) {
      this.pause = true;
      this.offsetMargin = (this.radius + this.distance + (this.sradius * 2)) | 0;
      this.cellWidth = this.width / this.density;
      this.cellHeight = this.height / this.density;
      if (this.canvasBuffer) {
        this.canvasBuffer.height = this.canvasBuffer.width = this.offsetMargin * 2;
      }
      if (this.width !== this.canvas.width) {
        this.canvas.width = this.width;
      }
      if (this.height !== this.canvas.height) {
        this.canvas.height = this.height;
      }
      await this.generatePoints();
      await Promise.allSettled(this.generateClosest());
      this.pause = false;
    }
  },
  async setProperty(name, val) {
    if (this[name] !== val) {
      this[name] = val;
      switch (name) {
        case 'width':
          this.width = val;
          this.x || (this.x = this.lx = (val / 2) | 0);
          await this.resize();
          break;
        case 'height':
          this.height = val;
          this.y || (this.y = this.ly = (val / 2) | 0);
        case 'sradius':
        case 'radius':
        case 'density':
        case 'distance':
          await this.resize();
          break;
        case 'links':
        case 'accuracy':
          await Promise.allSettled(this.generateClosest());
          break;
      }
    }
  },
  start() {
    if (!this.tick) {
      this.canvasBuffer = new OffscreenCanvas(this.offsetMargin * 2, this.offsetMargin * 2);
      this.ctxBuffer = this.canvasBuffer.getContext('2d');
      this.resize = debounce(this.resize.bind(this), RESIZE_DEBOUNCE_TIME);
      this.tick = this.animate.bind(this);
    }
    if (!this.active) {
      this.active = true;
      this.rafID = requestAnimationFrame(this.tick);
    }
  },
  stop() {
    if (this.active) {
      this.active = false;
      cancelAnimationFrame(this.rafID);
    }
  }
});
