import { PlaybackSpeed } from "~/types/VisualizationState";

export enum PieceAnimation {
  Slow = "slow",
  Normal = "normal",
  Fast = "fast",
  None = "none",
}

export type FrontendSetting<T> = {
  key: string;
  title: string;
  default: T;
  options: FrontendSettingOption<T>[];
};

export type FrontendSettingOption<T> = {
  value: T;
  label: string;
  description?: string;
};

export const SETTINGS = {
  pieceAnimation: {
    default: PieceAnimation.Normal,
    key: "pieceAnimation",
    title: "Piece animation",
    options: [
      { value: PieceAnimation.Slow, label: "Slow" },
      { value: PieceAnimation.Normal, label: "Normal" },
      { value: PieceAnimation.Fast, label: "Fast" },
    ],
  } as FrontendSetting<PieceAnimation>,
};

export type FrontendSettings = Record<keyof typeof SETTINGS, string>;

export const pieceAnimationToPlaybackSpeed = (
  pieceAnimation: PieceAnimation,
): PlaybackSpeed => {
  switch (pieceAnimation) {
    case PieceAnimation.Slow:
      return PlaybackSpeed.Slow;
    case PieceAnimation.Normal:
      return PlaybackSpeed.Normal;
    case PieceAnimation.Fast:
      return PlaybackSpeed.Fast;
  }
  return PlaybackSpeed.Normal;
};
