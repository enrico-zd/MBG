export type DurationSeconds = 5 | 10 | 15
export type Quality = "540p" | "720p" | "1080p"

export function quoteCredits(duration: DurationSeconds, quality: Quality) {
  const base = duration === 5 ? 1 : duration === 10 ? 2 : 3
  const multiplier = quality === "540p" ? 1 : quality === "720p" ? 1.5 : 2
  return Math.ceil(base * multiplier)
}
