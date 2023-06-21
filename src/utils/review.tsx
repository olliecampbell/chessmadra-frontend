import { isDevelopment } from "./env";

export const LOTS_DUE_MINIMUM = isDevelopment ? 10 : 100;
export const COMMON_MOVES_CUTOFF = isDevelopment ? 1 : 25;
