import { For } from "solid-js";
import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";

const targets = [
	{
		depth: 2,
		label: "Basic",
	},
	{
		depth: 3,
		label: "Starter",
	},
	{
		depth: 4,
		label: "Intermediate",
	},
	{
		depth: 5,
		label: "Advanced",
	},
	{
		depth: 6,
		label: "Tournament-ready",
	},
];
export const RepertoireDepthProgress = (props: { depth: number }) => {
	const getProgress = (depth: number) => {
		return depth / 8;
	};
	const progress = () => {
		return getProgress(props.depth);
	};
	return (
		<div class={clsx("relative h-1.5 rounded-full bg-gray-30")}>
			<For each={targets}>
				{(target, i) => {
					const targetProgress = getProgress(target.depth);
					const pastTargetProgress = targetProgress > progress();
					return (
						<>
							<div
								class={clsx(
									"absolute  w-px h-full z-2",
									pastTargetProgress ? "bg-gray-60" : "bg-green-30",
								)}
								style={stylex(c.left(`${getProgress(target.depth) * 100}%`))}
							></div>
							<div
								class={clsx("absolute", i() % 2 === 1 ? "bottom-0" : "top-0")}
								style={stylex(c.left(`${getProgress(target.depth) * 100}%`))}
							>
								<div
									class={clsx(
										"absolute -translate-x-1/2 py-2 whitespace-nowrap text-xs font-semibold",
										i() % 2 === 1 ? "top-0" : "bottom-0",
										pastTargetProgress ? "text-tertiary" : "text-secondary",
									)}
								>
									{target.label}
								</div>
							</div>
						</>
					);
				}}
			</For>
			<div
				class={clsx("absolute bg-green-45 h-full rounded-l-full radius")}
				style={stylex(c.width(`${getProgress(props.depth) * 100}%`))}
			></div>
		</div>
	);
};
