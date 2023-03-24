// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "./CMText";
import { Link } from "react-router-dom";
import { AdminPageLayout } from "./AdminPageLayout";

export const AdminView = ({}) => {
  const isMobile = useIsMobile();
  return (
    <AdminPageLayout>
      <CMText style={s(c.fontSize(48))}>Admin</CMText>
      <Spacer height={24} />
      {/*
      <Link to="/admin/review-move-annotations">
        <CMText style={s(c.fg(c.primaries[50]), c.fontSize(24), c.weightBold)}>
          Review move annotations
        </CMText>
      </Link>
      <Spacer height={24} />
      */}
      <Link to="/admin/move-annotations">
        <CMText style={s(c.fg(c.primaries[50]), c.fontSize(24), c.weightBold)}>
          Move annotations
        </CMText>
      </Link>
    </AdminPageLayout>
  );
};
