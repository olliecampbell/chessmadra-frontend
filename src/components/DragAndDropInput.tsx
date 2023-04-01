import { c, s } from "~/utils/styles";
import { useIsMobile } from "~/utils/isMobile";
import { Spacer } from "~/components/Space";
import { CMText } from "./CMText";
import { createSignal } from "solid-js";

export const DragAndDropInput = ({
  humanName,
  onUpload,
  accept,
  style,
}: {
  humanName: string;
  accept: string;
  style?: any;
  onUpload: (_: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
}) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = createSignal(false);
  const [uploaded, setUploaded] = createSignal(false);
  return (
    <div
      style={s(
        c.border(`1px solid ${c.grays[50]}`),
        c.center,
        c.row,
        c.alignCenter,
        c.clickable,
        c.py(8),
        c.px(8),
        style
      )}
    >
      <input
        style={s(c.absoluteFull, c.opacity(0), c.clickable)}
        accept={accept}
        onChange={(e) => {
          (async () => {
            setLoading(true);
            setUploaded(await onUpload(e));
            setLoading(false);
          })();
        }}
        type="file"
      />
      {uploaded() ? (
        <>
          <CMText style={s(c.fg(c.colors.textPrimary))}>Uploaded</CMText>
        </>
      ) : (
        <>
          <CMText style={s(c.fontSize(14), c.fg(c.grays[70]))}>
            <i class="fa-light fa-plus"></i>
          </CMText>
          <Spacer width={isMobile ? 4 : 12} />
          <CMText style={s(c.fg(c.colors.textSecondary), c.fontSize(14))}>
            {humanName}
          </CMText>
        </>
      )}
    </div>
  );
};
