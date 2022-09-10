
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { useIsMobile } from "app/utils/isMobile";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { Link } from "react-router-dom";
import { AdminPageLayout } from "./AdminPageLayout";

export const AdminView = ({}) => {
  const isMobile = useIsMobile();
  return (
    <AdminPageLayout>
      <CMText style={s(c.fontSize(48))}>Admin</CMText>
      <Spacer height={24} />
      <Link to="/admin/move-annotations">
        <CMText style={s(c.fg(c.primaries[50]), c.fontSize(24), c.weightBold)}>
          Review move annotations
        </CMText>
      </Link>
    </AdminPageLayout>
  );
};
