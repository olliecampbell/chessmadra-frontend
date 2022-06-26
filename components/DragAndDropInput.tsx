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
        c.fullWidth,
        c.fullHeight,
        c.border(`1px solid ${c.grays[50]}`),
        c.center,
        c.p(12)
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
          <Text style={s(c.fontSize(24), c.fg(c.colors.textPrimary))}>
            <i className="fas fa-arrow-up-from-dotted-line"></i>
          </Text>
          <Spacer height={12} />
          <Text style={s(c.fg(c.colors.textSecondary), c.fontSize(14))}>
            {copy}
          </Text>
        </>
      )}
    </View>
  );
};
