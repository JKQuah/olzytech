import { cacheLife } from "next/cache";

/**
 * Cache Components forbids reading the clock while prerendering, so the current year is
 * read inside a cached function and refreshed at most once a day.
 */
export async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
