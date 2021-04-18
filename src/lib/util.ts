
export const SEC = 1000;
export const MIN = 60 * SEC;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

export let remap = (x: number, oldLo: number, oldHi: number, newLo: number, newHi: number): number => {
    let pct = (x - oldLo) / (oldHi - oldLo);
    return newLo + pct * (newHi - newLo);
}
export let clamp = (x: number, lo: number, hi: number) => {
    // this works even if lo and hi are in the wrong order
    let lo2 = Math.min(lo, hi);
    let hi2 = Math.max(lo, hi);
    return Math.max(lo2, Math.min(hi2, x));
}

export let remapAndClamp = (x: number, oldLo: number, oldHi: number, newLo: number, newHi: number): number =>
    clamp(remap(x, oldLo, oldHi, newLo, newHi), newLo, newHi);

export let sleep = (ms: number) =>
    new Promise((res, rej) => {
        setTimeout(res, ms);
    });
