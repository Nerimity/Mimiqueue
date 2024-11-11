export function key (...args: any[]) {
  return args.filter(Boolean).join(":");
}