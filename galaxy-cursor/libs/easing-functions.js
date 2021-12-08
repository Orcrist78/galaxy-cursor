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

const s = 1.70158;
const { pow, sin, cos, sqrt, PI } = Math;
export const EasingFunctions = Object.freeze(Object.defineProperties(Object.create(null), {
  linear:         { get: () => t => t },
  easeInQuad:     { get: () => t => pow(t,2) },
  easeOutQuad:    { get: () => t => -(pow((t-1),2)-1) },
  easeInOutQuad:  { get: () => t => (t/=0.5)<1?0.5*pow(t,2):-0.5*((t-=2)*t-2) },
  easeInCubic:    { get: () => t => pow(t,3) },
  easeOutCubic:   { get: () => t => pow((t-1),3)+1 },
  easeInOutCubic: { get: () => t => (t/=0.5)<1?0.5*pow(t,3):0.5*(pow((t-2),3)+2) },
  easeInQuart:    { get: () => t => pow(t,4) },
  easeOutQuart:   { get: () => t => -(pow((t-1),4)-1) },
  easeInOutQuart: { get: () => t => (t/=0.5)<1?0.5*pow(t,4):-0.5*((t-=2)*pow(t,3)-2) },
  easeInQuint:    { get: () => t => pow(t,5) },
  easeOutQuint:   { get: () => t => pow((t-1),5)+1 },
  easeInOutQuint: { get: () => t => (t/=0.5)<1?0.5*pow(t,5):0.5*(pow((t-2),5)+2) },
  easeInSine:     { get: () => t => -cos(t*(PI/2))+1 },
  easeOutSine:    { get: () => t => sin(t*(PI/2)) },
  easeInOutSine:  { get: () => t => -0.5*(cos(PI*t)-1) },
  easeInExpo:     { get: () => t => !t?0:pow(2,10*(t-1)) },
  easeOutExpo:    { get: () => t => t===1?1:-pow(2,-10*t)+1 },
  easeInCirc:     { get: () => t => -(sqrt(1-(t*t))-1) },
  easeOutCirc:    { get: () => t => sqrt(1-pow((t-1),2)) },
  easeInOutCirc:  { get: () => t => (t/=0.5)<1?-0.5*(sqrt(1-t*t)-1):0.5*(sqrt(1-(t-=2)*t)+1) },
  easeInBack:     { get: () => t => t*t*((s+1)*t-s) },
  easeOutBack:    { get: () => t => --t*t*((s+1)*t+s)+1 },
  elastic:        { get: () => t => -1*pow(4,-8*t)*sin((t*6-1)*(2*PI)/2)+1 },
  swingFrom:      { get: () => t => t*t*((s+1)*t-s) },
  swingTo:        { get: () => t => --t*t*((s+1)*t + s)+1 },
  easeFromTo:     { get: () => t => (t/=0.5)<1?0.5*pow(t,4):-0.5*((t-=2)*pow(t,3)-2) },
  easeFrom:       { get: () => t => pow(t,4) },
  easeTo:         { get: () => t => pow(t,0.25) },
  easeOutBounce:  { get: () => t => {
    if(t<1/2.75)return 7.5625*t*t
    if(t<2/2.75)return 7.5625*(t-=(1.5/2.75))*t+0.75
    if(t<2.5/2.75)return 7.5625*(t-=(2.25/2.75))*t+0.9375
    return 7.5625*(t-=(2.625/2.75))*t+0.984375
  } },
  easeInOutExpo:  { get: () => t => {
    if(!t) return 0;
    if(t===1) return 1;
    if((t/=0.5)<1) return 0.5*pow(2,10*(t-1));
    return 0.5*(-pow(2,-10*--t)+2);
  } },
  easeInOutBack:  { get: () => t => {
    let a = s;
    if((t/=0.5)<1)return 0.5*(t*t*(((a*=(1.525))+1)*t-a));
    return 0.5*((t-=2)*t*(((a*=(1.525))+1)*t+a)+2);
  } },
  swingFromTo:    { get: () => t => {
    let a = s;
    return (t/=0.5)<1?0.5*(t*t*(((a*=(1.525))+1)*t-a)):0.5*((t-=2)*t*(((a*=(1.525))+1)*t+a)+2)
  } }
}));
