export function makeKey(...args: any[]) {
  return args.filter(Boolean).join(":");
}
