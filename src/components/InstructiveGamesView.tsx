// write a functional component called InstructiveGamesView
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { useBrowsingState, useSidebarState } from "~/utils/app_state";
import { intersperse } from "~/utils/intersperse";
import { CMText } from "./CMText";
import { SidebarSectionHeader } from "./SidebarActions";
import { Pressable } from "./Pressable";
import { View } from "./View";

export const InstructiveGamesView = ({}: {}) => {
  const [currentEpd, activeSide] = useSidebarState(([s]) => [
    s.currentEpd,
    s.activeSide,
  ]);
  const positionReport = useBrowsingState(
    ([s, rs]) => rs.positionReports?.[activeSide]?.[currentEpd],
    { referenceEquality: true }
  );
  const instructiveGames = positionReport?.instructiveGames;
  if (!instructiveGames) return null;
  return (
    <>
      <SidebarSectionHeader text="Instructive Games" />
      {
        <View style={s(c.column, c.alignCenter)}>
          {intersperse(
            instructiveGames.map((x, i) => {
              return (
                <Pressable
                  style={s(c.bg(c.grays[80]), c.p(12), c.fullWidth)}
                  onPress={() => {
                    var windowReference = window.open("about:blank", "_blank");
                    windowReference.location = x.gameLink;
                  }}
                >
                  <CMText style={s(c.fg(c.colors.textInverse))}>
                    {x.gameLink}
                  </CMText>
                </Pressable>
              );
            }),
            (i) => {
              return <Spacer height={8} key={i} />;
            }
          )}
        </View>
      }
    </>
  );
};
