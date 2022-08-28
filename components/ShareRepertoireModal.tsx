import { useState } from "react";
import { Modal } from "./Modal";
import { View } from "react-native";
import { c, s } from "app/styles";
import { CMText } from "./CMText";
import { Spacer } from "app/Space";
import { Button } from "./Button";
import { useIsMobile } from "app/utils/isMobile";
import shallow from "zustand/shallow";
import { useRepertoireState } from "app/utils/app_state";

export const ShareRepertoireModal = () => {
  let [open, shareId, quick] = useRepertoireState(
    (s) => [s.overviewState.isShowingShareModal, s.repertoireShareId, s.quick],
    shallow
  );

  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  let link = shareId && `https://${window.location.host}/repertoire/${shareId}`;
  return (
    <Modal
      onClose={() => {
        quick((s) => {
          s.overviewState.isShowingShareModal = false;
        });
      }}
      visible={open}
    >
      <View
        style={s(
          c.column,
          c.bg(c.grays[90]),
          c.br(4),
          c.px(isMobile ? 8 : 16),
          c.py(16),
          c.width(400),
          c.maxWidth("calc(100vw - 16px)")
        )}
      >
        <View style={s(c.column)}>
          <CMText
            style={s(c.fontSize(20), c.fg(c.colors.textInverse), c.weightBold)}
          >
            Share your repertoire
          </CMText>
          <Spacer height={12} />
          <CMText style={s(c.fg(c.colors.textInverseSecondary))}>
            Share this link with your coach, training partner, etc, and they'll
            be able to see and browse through your repertoire{" "}
          </CMText>
          <Spacer height={12} />
          {link && (
            <CMText style={s(c.fg(c.grays[40]), c.weightSemiBold)}>
              {link}
            </CMText>
          )}
          <Spacer height={12} />
          <Button
            style={s(
              c.buttons.basicSecondary,
              c.selfEnd,
              c.minWidth(200),
              c.alignEnd
            )}
            onPress={() => {
              navigator.clipboard.writeText(link);
              setCopied(true);
              window.setTimeout(() => {
                setCopied(false);
              }, 1000);
            }}
          >
            <CMText
              style={s(
                c.buttons.basicSecondary.textStyles,
                c.textAlign("center"),
                c.grow
              )}
            >
              {copied ? "Copied!" : "Copy to clipboard"}
            </CMText>
            <Spacer width={12} />
            <CMText style={s(c.buttons.basicSecondary.textStyles)}>
              <i className={`fa fa-clone`} />
            </CMText>
          </Button>
        </View>
      </View>
    </Modal>
  );
};
