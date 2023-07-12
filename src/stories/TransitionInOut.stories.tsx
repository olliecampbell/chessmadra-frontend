import type { Meta, StoryObj } from "storybook-solidjs";
import { TransitionInOut } from "./TransitionInOut";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/solid/writing-stories/introduction
const meta = {
  title: "Example/Transition",
  component: TransitionInOut,
  tags: ["autodocs"],
  argTypes: {
    backgroundColor: { control: "color" },
  },
} satisfies Meta<typeof TransitionInOut>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/7.0/solid/writing-stories/args
export const Primary: Story = {
  args: {
    primary: true,
    label: "Transition",
  },
};
