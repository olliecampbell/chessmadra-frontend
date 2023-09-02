export enum ReviewAnimation {
  Slow = "slow",
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
  reviewAnimation: {
    default: ReviewAnimation.Slow,
    key: "reviewAnimation",
    title: "Animation when practicing",
    options: [
      { value: ReviewAnimation.Slow, label: "Slow" },
      { value: ReviewAnimation.Fast, label: "Fast" },
      { value: ReviewAnimation.None, label: "None" },
    ],
  } as FrontendSetting<ReviewAnimation>,
};

export type FrontendSettings = Record<keyof typeof SETTINGS, string>;
