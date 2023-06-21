import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/routes/**/*.{ts,tsx}",
    "src/root.tsx",
    "src/entry-client.tsx",
    "src/entry-server.tsx",
  ],
  project: ["src/**/*.{ts,tsx}"],
};

export default config;
