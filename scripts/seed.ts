import { runSeed } from "./seed-data"

runSeed()
  .then((summary) => {
    console.log("Seed summary:", summary)
    process.exit(0)
  })
  .catch((err) => {
    console.error("Seed failed:", err)
    process.exit(1)
  })
