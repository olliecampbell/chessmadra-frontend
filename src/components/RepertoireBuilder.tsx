
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "./CMText";
import { useDebugState } from "~/utils/app_state";

export const RepertoireBuilder = () => {
  const isMobile = useIsMobile();
  const [underConstruction, debugUi] = useDebugState((s) => [
    s.underConstruction,
    s.debugUi,
  ]);

  if (underConstruction && !debugUi) {
    return (
      <div style={s(c.column, c.center)}>
        {!isMobile && <Spacer height={48} />}
        <i
          class="fa-sharp fa-hammer"
          style={s(c.fontSize(32), c.fg(c.grays[80]))}
        />
        <Spacer height={12} />
        <CMText style={s(c.fontSize(18), c.weightSemiBold)}>
          Under construction
        </CMText>
        <Spacer height={12} />
        <CMText style={s()}>
          Doing some housekeeping, will be down for a few hours, sorry!
        </CMText>
      </div>
    );
  } else {
    return <SidebarLayout mode="home" shared={false} />;
  }
};
