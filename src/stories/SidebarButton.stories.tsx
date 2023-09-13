import type { Meta, StoryObj } from "storybook-solidjs";

// More on how to set up stories at: https://storybook.js.org/docs/7.0/solid/writing-stories/introduction
const meta = {
	title: "Example/SidebarButton",
	component: SidebarFullWidthButton,
	tags: ["autodocs"],
	argTypes: {
		// @ts-ignore
		backgroundColor: { control: "color" },
	},
} satisfies Meta<typeof SidebarFullWidthButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/7.0/solid/writing-stories/args
export const Primary: Story = {
	args: {
		primary: true,
		label: "Button",
	},
};

export const Secondary: Story = {
	args: {
		label: "Button",
	},
};

export const Large: Story = {
	args: {
		size: "large",
		label: "Button",
	},
};

export const Small: Story = {
	args: {
		size: "small",
		label: "Button",
	},
};
