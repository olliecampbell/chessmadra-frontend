import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import React, { useState } from "react";
import { TextInput, Text, View } from "react-native";
import { Spacer } from "app/Space";

export const DragAndDropInput = ({
  humanName,
  onUpload,
  accept,
}: {
  humanName: string;
  accept: string;
  onUpload: (_: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
}) => {
  let copy = `Drag your ${humanName} in here, or click to select a file.`;
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  if (isMobile) {
    copy = `Tap here to select your ${humanName}.`;
  }
  return (
    <View
      style={s(
        c.border(`1px solid ${c.grays[50]}`),
        c.center,
        c.row,
        c.alignCenter,
        c.clickable,
        c.py(8),
        c.px(8)
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
          <Text style={s(c.fg(c.colors.textPrimary))}>Uploaded</Text>
        </>
      ) : (
        <>
          <Text style={s(c.fontSize(14), c.fg(c.grays[70]))}>
            <i className="fa-light fa-plus"></i>
          </Text>
          <Spacer width={isMobile ? 4 : 12} />
          <Text style={s(c.fg(c.colors.textSecondary), c.fontSize(14))}>
            {humanName}
          </Text>
        </>
      )}
    </View>
  );
};
