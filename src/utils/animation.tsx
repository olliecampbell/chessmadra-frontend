export interface Animated<T> {
  value: T;
  duration: number;
  delay: number;
  initial?: T;
}
export const animateTo = <T,>(
  v: Animated<T>,
  value: T,
  {
    duration,
    delay,
    initial,
  }: {
    duration: number;
    delay?: number;
    initial?: T;
  }
) => {
  v.value = value;
  v.duration = duration;
  v.delay = delay ?? 200;
  v.initial = initial;
};

export const skipTo = <T,>(v: Animated<T>, value: T) => {
  v.value = value;
  v.duration = 0;
};
