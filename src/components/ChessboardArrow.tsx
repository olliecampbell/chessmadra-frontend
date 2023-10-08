import { Square } from "@lubert/chess.ts/dist/types";
import { destructure } from "@solid-primitives/destructure";
import { getSquareOffset } from "~/utils/chess";
import { c, stylex } from "~/utils/styles";

export const ChessboardArrowView = (props: {
	faded: boolean;
	fromSquare: Square;
	toSquare: Square;
	focused: boolean;
	flipped: boolean;
	hidden?: boolean;
	color: string;
}) => {
	const {
		opacity,
		length,
		from,
		toSquareCenterX,
		toSquareCenterY,
		angle,
		angleDeg,
	} = destructure(() => {
		const from = getSquareOffset(props.fromSquare, props.flipped);
		const to = getSquareOffset(props.toSquare, props.flipped);
		const dx = Math.abs(from.x - to.x);
		const dy = Math.abs(from.y - to.y);
		const length = Math.sqrt(dx ** 2 + dy ** 2) - (1 / 8) * 0.1;
		const angle = Math.atan2(to.y - from.y, to.x - from.x);
		const angleDeg = (angle * 180) / Math.PI;
		let focused = false;
		let opacity = 80;
		if (focused) {
			focused = true;
			opacity = 100;
		}
		if (props.faded) {
			opacity = 50;
		}
		if (props.hidden) {
			opacity = 0;
		}
		const duration = "1.0s";
		const toSquareCenterX = to.x + 1 / 8 / 2;
		const toSquareCenterY = to.y + 1 / 8 / 2;
		const x1 = from.x + 1 / 8 / 2;
		const x2 = from.x + 1 / 8 / 2 + length * Math.cos(angle);
		const y1 = from.y + 1 / 8 / 2;
		const y2 = from.y + 1 / 8 / 2 + length * Math.sin(angle);
		const xDiff = x2 - x1;
		const yDiff = y2 - y1;
		return {
			focused,
			opacity,
			from,
			to,
			x1,
			y1,
			x2,
			y2,
			xDiff,
			yDiff,
			duration,
			length,
			toSquareCenterX,
			toSquareCenterY,
			angle,
			angleDeg,
		};
	});
	return (
		<div
			style={stylex(
				c.absoluteFull,
				c.noPointerEvents,
				c.zIndex(props.focused ? 101 : 100),
				c.opacity(opacity()),
				c.fg(props.color),
			)}
			class="transition-all duration-300"
		>
			<svg width="100%" height="100%" viewBox="0 0 1 1">
				<line
					// stroke={`url(#${`plan-line-gradient-${i}`})`}
					stroke={"currentColor"}
					stroke-width={1.4 / 100}
					stroke-linecap="round"
					x1={from().x + 1 / 8 / 2}
					y1={from().y + 1 / 8 / 2}
					x2={from().x + 1 / 8 / 2 + length() * Math.cos(angle())}
					y2={from().y + 1 / 8 / 2 + length() * Math.sin(angle())}
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width={(1 / 8) * 0.04}
					fill={"currentColor"}
					stroke={"currentColor"}
					transform={`rotate(${
						angleDeg() - 90
					} ${toSquareCenterX()} ${toSquareCenterY()})`}
					d={`M ${toSquareCenterX() - 2 / 100},${
						toSquareCenterY() - 2.8 / 100
					} ${toSquareCenterX()},${toSquareCenterY() - 0.004} ${
						toSquareCenterX() + 2 / 100
					},${toSquareCenterY() - 2.8 / 100} Z`}
				/>
			</svg>
		</div>
	);
};
