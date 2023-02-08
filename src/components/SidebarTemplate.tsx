import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { CMText } from "./CMText";
import { useResponsive } from "app/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { getSidebarPadding } from "./RepertoireBrowsingView";
import { BeatLoader } from "react-spinners";

export const SidebarTemplate = ({
  header,
  children,
  bodyPadding,
  loading,
  actions,
}: {
  header?: string;
  children?: any;
  loading?: string;
  bodyPadding?: boolean;
  actions: SidebarAction[];
}) => {
  const responsive = useResponsive();
  return (
    <View style={s(c.column)}>
      {header && (
        <>
          <RepertoireEditingHeader>{header}</RepertoireEditingHeader>
          <Spacer height={12} />
        </>
      )}
      <View
        style={s(
          c.column,
          bodyPadding && c.px(getSidebarPadding(responsive)),
          c.zIndex(2),
          c.relative
        )}
      >
        {loading ? (
          <View style={s(c.selfCenter, c.pt(48), c.center)}>
            <CMText
              style={s(c.fontSize(14), c.weightSemiBold, c.fg(c.grays[75]))}
            >
              {loading}
            </CMText>
            <Spacer height={8} />
            <BeatLoader color={c.grays[70]} size={20} />
          </View>
        ) : (
          children
        )}
      </View>
      <Spacer height={36} />
      <View style={s(c.gridColumn({ gap: 12 }))}>
        {actions.map((action, i) => {
          return <SidebarFullWidthButton key={i} action={action} />;
        })}
      </View>
    </View>
  );
};
