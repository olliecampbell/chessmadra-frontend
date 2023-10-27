import { isDevelopment } from "./env";

export const LOTS_DUE_MINIMUM = isDevelopment ? 10 : 100;
export const COMMON_MOVES_CUTOFF = isDevelopment ? 5 : 25;
export const EARLY_MOVES_CUTOFF = isDevelopment ? 5 : 20;
