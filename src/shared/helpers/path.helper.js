import { fileURLToPath } from "url";
import { dirname, join } from "path";

export const getDirname = (metaUrl) => dirname(fileURLToPath(metaUrl));

export const resolveFrom = (metaUrl, ...segments) =>
  join(getDirname(metaUrl), ...segments);
