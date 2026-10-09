import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Recording drives the real RSV Studio app, so it needs that repository checked out next to this one:
// <parent>/Videoediting and <parent>/rsv-studio (as the cloud sessions clone them, under /home/user).
// The "@/" alias in tsconfig.json points at the same place. Rendering never needs it.
export const RSV_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../rsv-studio");
