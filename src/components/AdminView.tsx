import { A } from "@solidjs/router";
import { Spacer } from "~/components/Space";
import { c, s } from "~/utils/styles";
import { AdminPageLayout } from "./AdminPageLayout";
import { CMText } from "./CMText";

export const AdminView = () => {
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
			<A href="/admin/move-annotations">
				<CMText style={s(c.fg(c.primaries[50]), c.fontSize(24), c.weightBold)}>
					Move annotations
				</CMText>
			</A>
		</AdminPageLayout>
	);
};
