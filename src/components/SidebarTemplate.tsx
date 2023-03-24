// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { useResponsive } from "~/utils/useResponsive";
import { SidebarAction, SidebarFullWidthButton } from "./SidebarActions";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { View } from "./View";

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
          bodyPadding && c.px(c.getSidebarPadding(responsive)),
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
