
export const debounce = (fn, time) => {
  let timer = 0;

  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = 0;
      fn(...args);
    }, time);
  };
}
