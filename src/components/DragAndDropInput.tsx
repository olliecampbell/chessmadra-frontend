import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import React, { useState } from "react";
import { View } from "react-native";
import { Spacer } from "app/Space";
import { CMText } from "./CMText";

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
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  console.log("rendering DragAndDropInput", uploaded, loading, isMobile);
  return (
    <View
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
      {uploaded ? (
        <>
          <CMText style={s(c.fg(c.colors.textPrimary))}>Uploaded</CMText>
        </>
      ) : (
        <>
          <CMText style={s(c.fontSize(14), c.fg(c.grays[70]))}>
            <i className="fa-light fa-plus"></i>
          </CMText>
          <Spacer width={isMobile ? 4 : 12} />
          <CMText style={s(c.fg(c.colors.textSecondary), c.fontSize(14))}>
            {humanName}
          </CMText>
        </>
      )}
    </View>
  );
};
