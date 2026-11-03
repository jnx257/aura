import { execSync } from "node:child_process";

/** Fresh sample data for every run (replaces only the seeded user's rows). */
export default function globalSetup() {
  execSync("npm run db:seed", { stdio: "inherit" });
}
