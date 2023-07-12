import type { StorybookConfig } from "storybook-solidjs-vite";
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  // viteFinal: (config) => {
  //   console.log("config", config);
  //   config.plugins! = (config.plugins! as PluginOption[]).filter((plugin) => {
  //     if (plugin && "name" in plugin) {
  //       return !plugin.name.startsWith("solid-start");
  //     }
  //
  //     return true;
  //   });
  //   console.log("config", config);
  //
  //   return config;
  // },

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "storybook-solidjs-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};
export default config;
