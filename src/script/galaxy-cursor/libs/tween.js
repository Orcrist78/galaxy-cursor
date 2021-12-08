/*!
  ISC License

  Copyright (c) 2018, Giuseppe Scotto Lavina

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


import { EasingFunctions } from './easing-functions.js';

const queue = new Set();
const notween = Object.freeze({ abort: ထ => ထ, job: { } });
const processTweens = now => {
  !tween.noraf && queue.size && requestAnimationFrame(processTweens);

  for (const job of queue) {
    processTween(now, job);
  }
  tween.onEnd && !queue.size && tween.onEnd();
  tween.onRender && tween.onRender(!queue.size);
};

const processTween = (now, job) => {
  const { startTime: st = now, duration: d, end: e, start: s, easing: es, fn } = job;
  const diff = now - st;
  const done = job.done = diff >= d;

  job.v = s + (es(diff / d) * (e - s));
  job.startTime || (job.startTime = st);
  done && queue.delete(job);
  fn && fn(done ? e : job.v, done) && !done && queue.delete(job);
}

export const tween = (start, end, duration, fn, easing = tween.easeDefault, _tween = null) => {
  if (Number.isFinite(start) && Number.isFinite(end) && Number.isFinite(duration) && typeof fn === 'function') {
    if (duration && start !== end) {
      const loop = !tween.noraf && queue.size;

      if (!_tween) {
        _tween = {
          abort: () => queue.delete(_tween.job),
          update: now => processTween(now, _tween.job),
          job: {
            easing: EasingFunctions[easing in EasingFunctions ? easing : tween.easeDefault],
            startTime: undefined,
            duration: duration,
            start: start,
            done: false,
            end: end,
            val: 0,
            fn: fn
          }
        };
      } else {
        const { job } = _tween;

        job.easing = EasingFunctions[easing in EasingFunctions ? easing : tween.easeDefault];
        job.startTime = undefined;
        job.duration = duration;
        job.start = start;
        job.done = false;
        job.end = end;
        job.val = 0;
        job.fn = fn;
      }

      queue.add(_tween.job);
      loop && requestAnimationFrame(processTweens);
      return _tween;
    }

    fn(end, true);
  }
  return notween;
};

Object.seal(Object.defineProperties(tween, {
  size:        { get:   () => queue.size },
  tick:        { get:   () => processTweens },
  clear:       { get:   () => () => queue.clear() },
  onEnd:       { value: null,            writable: true },
  noraf:       { value: false,           writable: true },
  onRender:    { value: null,            writable: true },
  easeDefault: { value: 'easeOutBounce', writable: true }
}));
