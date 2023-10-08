import { quick, useUserState } from "~/utils/app_state";
import { clsx } from "~/utils/classes";
import { c, stylex } from "~/utils/styles";
import { CMText } from "./CMText";
import { Pressable } from "./Pressable";
import { Dropdown } from "./SidebarOnboarding";

export const RatingSelection = () => {
	const [user] = useUserState((s) => [s.user]);
	return (
		<div style={stylex(c.row, c.alignCenter)} class={"space-x-2"}>
			<Dropdown
				title={"Rating range"}
				onSelect={(range) => {
					quick((s) => {
						s.userState.setRatingRange(range);
					});
				}}
				choices={[
					"0-1100",
					"1100-1300",
					"1300-1500",
					"1500-1700",
					"1700-1900",
					"1900-2100",
					"2100+",
				]}
				// @ts-ignore
				choice={user().ratingRange}
				renderChoice={(choice, inList, onPress) => {
					const textColor = c.gray[80];
					const textStyles = stylex(c.fg(textColor), c.fontSize(14));
					const containerStyles = stylex(
						c.py(12),
						inList && c.px(16),
						c.row,
						c.clickable,
						c.justifyStart,
						c.selfStart,
						c.alignCenter,
						c.width("fit-content"),
						c.minWidth(100),
					);
					const inner = (
						<CMText
							style={stylex(textStyles, !inList && stylex(c.fullWidth))}
							class={clsx("whitespace-nowrap break-keep")}
						>
							{choice}
						</CMText>
					);
					return (
						<Pressable
							style={stylex(containerStyles)}
							// @ts-ignore
							onPress={(e) => {
								onPress(e);
							}}
						>
							{inner}
						</Pressable>
					);
				}}
			/>
			<div style={stylex(c.row)}>
				<Dropdown
					title={"Platform"}
					onSelect={(choice) => {
						console.log("On select", choice);
						quick((s) => {
							s.userState.setRatingSystem(choice);
						});
					}}
					choices={[
						RatingSource.Lichess,
						RatingSource.ChessCom,
						RatingSource.FIDE,
						RatingSource.USCF,
					]}
					choice={user()?.ratingSystem ?? RatingSource.Lichess}
					renderChoice={(choice, inList, onPress) => {
						const textClasses = "text-gray-80 font-semibold font-sm";
						const containerClasses = clsx(
							"py-3 cursor-pointer row w-full self-start items-end w-fit-content min-w-[90px]",
							inList ? "justify-start px-4" : "justify-end",
						);
						const text =
							choice === RatingSource.Lichess
								? "Lichess"
								: choice === RatingSource.USCF
								? "USCF"
								: choice === RatingSource.FIDE
								? "FIDE"
								: choice === RatingSource.ChessCom
								? "Chess.com"
								: "";
						return (
							<Pressable class={containerClasses} onPress={onPress}>
								<CMText class={textClasses}>{text}</CMText>
							</Pressable>
						);
					}}
				/>
			</div>
		</div>
	);
};

enum RatingSource {
	Lichess = "Lichess",
	ChessCom = "Chess.com",
	USCF = "USCF",
	FIDE = "FIDE",
}
