import { WritableDraft } from "immer/dist/internal";

export type OpDraft<T> = T | WritableDraft<T>;
