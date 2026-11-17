export function createRandom(seed) {
  let t = seed >>> 0;
  return {
    next() {
      t += 0x6d2b79f5;
      let r = Math.imul(t ^ (t >>> 15), t | 1);
      r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    },
    range(min, max) {
      return min + this.next() * (max - min);
    },
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
    choice(arr) {
      if (!arr || arr.length === 0) return undefined;
      return arr[this.int(0, arr.length - 1)];
    }
  };
}
