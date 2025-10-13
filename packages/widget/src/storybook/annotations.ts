import type { Preview } from "@storybook/react";

export const previewAnnotations: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ["Welcome", "Components"],
      },
    },
  },
};
