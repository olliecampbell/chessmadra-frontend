// import { Pressable, View } from "react-native";
// // import { ExchangeRates } from "~/ExchangeRate";
// import { c, s } from "~/utils/styles";
// import { Spacer } from "~/components/Space";
// import { isEmpty } from "lodash-es";
// import { intersperse } from "~/utils/intersperse";
// import { CMText } from "./CMText";
// import { useRepertoireState } from "~/utils/app_state";
// import { useResponsive } from "~/utils/useResponsive";
// import { PlayerTemplate } from "~/utils/models";
// import { c.getSidebarPadding } from "./RepertoireBrowsingView";
//
// export const PlayerTemplates = ({
//   onPress,
// }: {
//   onPress: (_: PlayerTemplate) => void;
// }) => {
//   const [playerTemplates] = useRepertoireState((s) => [s.playerTemplates]);
//   const responsive = useResponsive();
//   const isMobile = responsive.isMobile;
//   if (isEmpty(playerTemplates)) {
//     return null;
//   }
//   return (
//     <View style={s(c.column, c.fullWidth, c.justifyCenter, c.alignCenter)}>
//       <View style={s(c.column, c.fullWidth)}>
//         {intersperse(
//           playerTemplates.map((playerTemplate, i) => {
//             return (
//               <Pressable
//                 onPress={() => {
//                   onPress(playerTemplate);
//                 }}
//               >
//                 <View
//                   style={s(
//                     c.px(c.getSidebarPadding(responsive)),
//                     c.br(4),
//                     // c.px(16),
//                     c.py(16),
//                     c.constrainWidth,
//                     c.column
//                   )}
//                 >
//                   <View style={s(c.row, c.alignCenter)}>
//                     <img
//                       src={`/${playerTemplate.meta.image}`}
//                       style={s(
//                         c.size(isMobile ? 32 : 54),
//                         c.round,
//                         c.border(`2px solid ${c.grays[80]}`)
//                       )}
//                     />
//                     <Spacer width={isMobile ? 12 : 16} />
//                     <View style={s(c.column, c.flexible)}>
//                       <CMText
//                         style={s(
//                           c.fg(c.colors.textPrimary),
//                           c.weightSemiBold,
//                           c.fontSize(isMobile ? 16 : 20)
//                         )}
//                       >
//                         {playerTemplate.meta.title}
//                       </CMText>
//                     </View>
//                   </View>
//                   <Spacer height={12} />
//                   <View style={s(c.row, c.flexWrap, c.gap(6))}>
//                     {playerTemplate.meta.openings.map((x, i) => {
//                       return (
//                         <CMText
//                           style={s(
//                             c.px(isMobile ? 6 : 6),
//                             c.py(isMobile ? 6 : 6),
//                             c.fg(c.colors.textInverseSecondary),
//                             c.fontSize(isMobile ? 14 : 14),
//                             c.weightSemiBold,
//                             c.br(2),
//                             c.bg(c.grays[80])
//                           )}
//                         >
//                           {x}
//                         </CMText>
//                       );
//                     })}
//                   </View>
//                 </View>
//               </Pressable>
//             );
//           }),
//           (i) => {
//             return (
//               <View
//                 style={s(c.height(1), c.my(12), c.fullWidth, c.bg(c.grays[30]))}
//               ></View>
//             );
//           }
//         )}
//       </View>
//     </View>
//   );
// };
