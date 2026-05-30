import "dotenv/config"
import { pollJobsTick } from "../src/lib/poll-jobs"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  while (true) {
    await pollJobsTick()
    await sleep(3000)
  }
}

main()
  .catch(() => process.exit(1))
