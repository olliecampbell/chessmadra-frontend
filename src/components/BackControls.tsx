import { View } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { Button } from "~/components/Button";
import { useIsMobile } from "~/utils/isMobile";
import { CMText } from "./CMText";
import { useRepertoireState, quick, useSidebarState } from "~/utils/app_state";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { trackEvent } from "~/utils/trackEvent";
import { useResponsive, BP } from "~/utils/useResponsive";
import { useRef } from "react";

type BackControlsProps = {
  includeAnalyze?: boolean;
  includeReview?: boolean;
  extraButton?: any;
  height?: number;
};

export const BackControls: React.FC<BackControlsProps> = ({
  includeAnalyze,
  includeReview,
  height,
  extraButton,
}) => {
  const bp = useResponsive();
  const layout = useRef(null);
  let [
    // searchOnChessable,
    analyzeLineOnLichess,
    currentLine,
    backToStartPosition,
    backOne,
  ] = useRepertoireState((s) => [
    // s.searchOnChessable,
    s.analyzeLineOnLichess,
    s.browsingState.chessboardState.moveLog,
    s.backToStartPosition,
    s.backOne,
  ]);

  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const isMobile = useIsMobile();
  let gap = isMobile ? 6 : 12;
  let foreground = c.grays[90];
  let textColor = c.fg(foreground);
  return (
    <View
      style={s(
        c.row,
        c.height(height ?? bp.switch(40, [BP.lg, 48])),
        c.selfStretch
      )}
      onLayout={({ nativeEvent: { layout: l } }) => {
        layout.current = l;
      }}
    >
      <Button
        style={s(c.buttons.darkFloater, c.width(48), c.constrainHeight)}
        onPress={() => {
          backToStartPosition();
        }}
      >
        <i
          className="fa-sharp fa-angles-left"
          style={s(
            c.buttons.darkFloater.textStyles,
            c.px(0),
            c.fontSize(18),
            textColor
          )}
        />
      </Button>
      <Spacer width={gap} />
      <Button
        style={s(c.buttons.darkFloater, c.grow, c.constrainHeight)}
        onPress={() => {
          backOne();
        }}
      >
        <i
          className="fa-sharp fa-angle-left"
          style={s(c.buttons.darkFloater.textStyles, c.fontSize(18), textColor)}
        />
      </Button>
      {extraButton && (
        <>
          <Spacer width={gap} />
          {extraButton}
        </>
      )}
      {includeAnalyze && (
        <>
          <Spacer width={gap} />
          <Button
            style={s(c.buttons.darkFloater)}
            onPress={() => {
              trackEvent("repertoire.analyze_on_lichess");
              analyzeLineOnLichess(currentLine);
            }}
          >
            <View style={s(c.size(isMobile ? 20 : 22))}>
              <LichessLogoIcon color={foreground} />
            </View>
            {layout.current?.width > 400 && (
              <>
                <Spacer width={8} />
                <CMText
                  style={s(
                    c.buttons.darkFloater.textStyles,
                    textColor,
                    c.weightRegular,
                    c.fontSize(14)
                  )}
                >
                  Analyze on Lichess
                </CMText>
              </>
            )}
          </Button>
        </>
      )}
      {includeReview && (
        <>
          <Spacer width={gap} />
          <Button
            style={s(c.buttons.darkFloater)}
            onPress={() => {
              quick((s) => {
                s.repertoireState.reviewState.startReview(activeSide, {
                  side: activeSide,
                  cram: true,
                  startLine:
                    s.repertoireState.browsingState.chessboardState.moveLog,
                  startPosition:
                    s.repertoireState.browsingState.chessboardState.getCurrentEpd(),
                });
              });
            }}
          >
            <CMText style={s(c.buttons.darkFloater.textStyles)}>
              <i className={"fa-duotone fa-cards-blank"} />
            </CMText>
          </Button>
        </>
      )}
    </View>
  );
};
