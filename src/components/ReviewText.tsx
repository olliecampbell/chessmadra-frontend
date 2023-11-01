import { destructure } from "@solid-primitives/destructure";
import { pluralize } from "~/utils/pluralize";
import { c, stylex } from "~/utils/styles";
import { CMText } from "./CMText";
import { clsx } from "~/utils/classes";
import { createEffect } from "solid-js";

export const ReviewText = (props: {
	date?: string;
	hideIcon?: boolean;
	inverse?: boolean;
	overview?: boolean;
	numDue: number;
	descriptor?: string;
	class?: string;
	moves?: boolean;
	icon?: string;
}) => {
	const descriptor = () => props.descriptor || "Due";
	const date = () => new Date(props.date || "");
	const numMovesDueFromHere = () => props.numDue;
	const now = () => new Date();
	const diff = () => date().getTime() - now().getTime();
	const prefix = () =>
		props.overview ? `${descriptor()} in` : `${descriptor()} in`;
	const { color, dueString } = destructure(() => {
		let dueString = "";
		let color = "text-gray-50";
		if (!props.date || diff() < 0) {
			color = props.inverse ? "text-yellow-30" : "text-yellow-50";
			if (props.moves) {
				dueString = `${pluralize(numMovesDueFromHere(), "move")}`;
			} else {
				dueString = `${numMovesDueFromHere().toLocaleString()} ${descriptor()}`;
			}
		} else {
			dueString = `${prefix()} ${getHumanTimeUntil(date())}`;
		}
		return {
			color,
			dueString,
		};
	});
	return (
		<>
			<div
				style={stylex(c.row, c.alignCenter)}
				class={clsx(color(), props.class)}
			>
				<CMText class="font-semibold text-xs leading-5">{dueString()}</CMText>
				{!props.hideIcon && (
					<i
						style={stylex(c.fontSize(12))}
						class={clsx(props.icon ? props.icon : "fa fa-clock", "pl-2")}
					/>
				)}
			</div>
		</>
	);
};

export const getHumanTimeUntil = (date: Date) => {
	const now = new Date();
	const diff = date.getTime() - now.getTime();
	const seconds = diff / 1000;
	const minutes = seconds / 60;
	const hours = minutes / 60;
	const days = hours / 24;
	if (diff < 0) {
		return "Now";
	} else if (minutes < 60) {
		return `${pluralize(Math.round(minutes), "min")}`;
	} else if (hours < 24) {
		return `${pluralize(Math.round(hours), "hour")}`;
	} else {
		return `${pluralize(Math.round(days), "day")}`;
	}
};
