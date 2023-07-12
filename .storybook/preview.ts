import "virtual:uno.css";
import "~/global.css";
import "tippy.js/dist/tippy.css";
import "tippy.js/animations/shift-away.css";
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;
