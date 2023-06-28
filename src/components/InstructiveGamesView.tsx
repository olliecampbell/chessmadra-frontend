// write a functional component called InstructiveGamesView
// import { ExchangeRates } from "~/ExchangeRate";


export const InstructiveGamesView = ({}: {}) => {
  return null;
  // const [currentEpd, activeSide] = useSidebarState(([s]) => [
  //   s.currentEpd,
  //   s.activeSide,
  // ]);
  // const positionReport = useBrowsingState(
  //   ([s, rs]) => rs.positionReports?.[activeSide]?.[currentEpd],
  //   { referenceEquality: true }
  // );
  // const instructiveGames = positionReport?.instructiveGames;
  // if (!instructiveGames) return null;
  // return (
  //   <>
  //     <SidebarSectionHeader text="Instructive Games" />
  //     {
  //       <div style={s(c.column, c.alignCenter)}>
  //         {intersperse(
  //           instructiveGames.map((x, i) => {
  //             return (
  //               <Pressable
  //                 style={s(c.bg(c.gray[80]), c.p(12), c.fullWidth)}
  //                 onPress={() => {
  //                   var windowReference = window.open("about:blank", "_blank");
  //                   windowReference.location = x.gameLink;
  //                 }}
  //               >
  //                 <CMText style={s(c.fg(c.colors.textInverse))}>
  //                   {x.gameLink}
  //                 </CMText>
  //               </Pressable>
  //             );
  //           }),
  //           (i) => {
  //             return <Spacer height={8} key={i} />;
  //           }
  //         )}
  //       </div>
  //     }
  //   </>
  // );
};
