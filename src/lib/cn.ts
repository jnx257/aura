/** Join class names, skipping falsy ones. Plain module so server and client components can both call it. */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
