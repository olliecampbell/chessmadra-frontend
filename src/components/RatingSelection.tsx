import { c, s } from "~/utils/styles";
import { CMText } from "./CMText";
import { useUserState, quick } from "~/utils/app_state";
import { createEffect } from "solid-js";
import { clsx } from "~/utils/classes";
import { Dropdown } from "./SidebarOnboarding";
import { Pressable } from "./Pressable";

export const RatingSelection = (props: {}) => {
  console.log("rendering rating selection");
  const [user] = useUserState((s) => [s.user]);
  createEffect(() => {
    console.log("rating system ", user()?.ratingSystem);
  });
  return (
    <div style={s(c.row, c.alignCenter)} class={"space-x-2"}>
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
          const textStyles = s(c.fg(textColor), c.fontSize(14));
          const containerStyles = s(
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
              style={s(textStyles, !inList && s(c.fullWidth))}
              class={clsx("whitespace-nowrap break-keep")}
            >
              {choice}
            </CMText>
          );
          return (
            <Pressable
              style={s(containerStyles)}
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
      <div style={s(c.row)}>
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
            const textColor = c.gray[80];
            const textStyles = s(
              c.fg(textColor),
              c.fontSize(14),
              c.weightSemiBold,
            );
            const containerStyles = s(
              c.py(12),
              inList && c.px(16),
              c.row,
              c.clickable,
              !inList && c.justifyEnd,
              c.fullWidth,
              c.selfStart,
              c.justifyStart,
              c.alignEnd,
              c.width("fit-content"),
              c.minWidth(90),
            );
            if (choice === RatingSource.Lichess) {
              return (
                <Pressable style={s(containerStyles)} onPress={onPress}>
                  <CMText style={s(textStyles)}>Lichess</CMText>
                </Pressable>
              );
            } else if (choice === RatingSource.USCF) {
              return (
                <Pressable style={s(containerStyles)} onPress={onPress}>
                  <CMText style={s(textStyles)}>USCF</CMText>
                </Pressable>
              );
            } else if (choice === RatingSource.FIDE) {
              return (
                <Pressable style={s(containerStyles)} onPress={onPress}>
                  <CMText style={s(textStyles)}>FIDE</CMText>
                </Pressable>
              );
            } else if (choice === RatingSource.ChessCom) {
              return (
                <Pressable style={s(containerStyles)} onPress={onPress}>
                  <CMText style={s(textStyles)}>Chess.com</CMText>
                </Pressable>
              );
            }
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
