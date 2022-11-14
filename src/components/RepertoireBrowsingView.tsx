import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil } from "lodash-es";
import { Button } from "app/components/Button";
import {
  Side,
} from "app/utils/repertoire";
import { CMText } from "./CMText";
import { quick, useRepertoireState } from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import useKeypress from "react-use-keypress";
import { BrowserSidebar } from "./BrowsingSidebar";

export const VERTICAL_BREAKPOINT = BP.md;

export const RepertoireBrowsingView = ({ shared }: { shared?: boolean }) => {
  const [
    activeSide,
    isBrowsing,
    quick,
    failedToFetch,
    backToOverview,
    chessboardState,
    repertoireLoading,
  ] = useRepertoireState((s) => [
    s.browsingState.activeSide,
    s.isBrowsing,
    s.quick,
    s.failedToFetchSharedRepertoire,
    s.backToOverview,
    s.browsingState.chessboardState,
    s.repertoire === undefined,
  ]);

  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft") {
      quick((s) => s.backOne());
    }
  });
  let { side: paramSide } = useParams();
  let reviewQueueFromHere = useRepertoireState(
    (s) =>
      s.reviewState.buildQueue({
        cram: true,
        side: paramSide as Side,
        startPosition: s.browsingState.chessboardState.getCurrentEpd(),
        startLine: s.browsingState.chessboardState.moveLog,
      }),
    { referenceEquality: true }
  );
  useEffect(() => {
    if (
      (paramSide !== activeSide || !isBrowsing) &&
      !repertoireLoading &&
      !shared
    ) {
      quick((s) => {
        console.log("starting browsing");
        s.startBrowsing((paramSide as Side) ?? "white");
      });
    }
  }, [repertoireLoading]);
  // const router = useRouter();
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const loading = repertoireLoading || isNil(activeSide);
  return (
    <RepertoirePageLayout flushTop bottom={null} fullHeight>
      {loading ? null : (
        <View
          nativeID="BrowsingView"
          style={s(
            !vertical ? c.containerStyles(responsive.bp) : c.fullWidth,
            c.alignCenter,
            c.grow,
            c.noUserSelect
          )}
        >
          <View
            style={s(
              vertical ? c.width(c.min(600, "100%")) : c.fullWidth,
              vertical ? c.column : c.row,
              c.grow,
              c.selfStretch,
              vertical ? c.justifyStart : c.justifyCenter
            )}
          >
            <View
              style={s(
                c.column,
                !vertical && s(c.grow, c.noBasis, c.flexShrink),
                vertical ? c.width("min(480px, 100%)") : c.maxWidth(440),
                vertical && c.grow,
                vertical ? c.selfCenter : c.selfStretch
              )}
            >
              <View
                style={s(
                  c.fullWidth,
                  vertical && s(c.selfCenter, c.maxWidth(320), c.pt(20)),
                  !vertical && c.pt(140)
                )}
              >
                <ChessboardView state={chessboardState} />
              </View>
              <Spacer height={12} />
              <ExtraChessboardActions />
              {vertical ? (
                <>
                  <Spacer height={24} />

                  <View style={s(c.grow)}>
                    <BrowserSidebar />
                  </View>
                </>
              ) : (
                <Spacer height={60} />
              )}
            </View>
            {!vertical && (
              <>
                <Spacer width={responsive.switch(24, [BP.lg, 48])} />
                <View
                  // @ts-ignore
                  nativeID="sidebar"
                  style={s(
                    c.flexGrow(2),
                    c.flexShrink,
                    c.noBasis,
                    c.maxWidth(600)
                  )}
                >
                  <BrowserSidebar />
                </View>
              </>
            )}
          </View>
        </View>
      )}
    </RepertoirePageLayout>
  );
};

export const getSidebarPadding = (responsive: Responsive) => {
  return responsive.switch(12, [BP.md, 12], [BP.lg, 18]);
};

export const ExtraChessboardActions = ({}: {}) => {
  const responsive = useResponsive();
  const textStyles = s(
    c.fontSize(responsive.switch(12, [BP.md, 14])),
    c.fg(c.grays[50]),
    c.weightSemiBold
  );
  const iconStyles = s(
    c.fontSize(responsive.switch(12, [BP.md, 14])),
    c.fg(c.grays[50])
  );
  const padding = 8;
  let [currentLine, activeSide] = useRepertoireState((s) => [
    s.browsingState.chessboardState.moveLog,
    s.browsingState.activeSide,
  ]);
  if (isEmpty(currentLine)) {
    return null;
  }
  return (
    <View style={s(c.row, c.fullWidth, c.justifyCenter)}>
      <Pressable
        style={s(c.row, c.alignCenter)}
        onPress={() => {
          quick((s) => {
            s.repertoireState.browsingState.dismissTransientSidebarState();
            s.repertoireState.browsingState.chessboardState.resetPosition();
          });
        }}
      >
        <CMText style={s(textStyles)}>Reset board</CMText>
        <Spacer width={padding} />
        <i className="fa fa-arrows-rotate" style={s(iconStyles)}></i>
      </Pressable>
      <Spacer width={18} />
      <Pressable
        style={s(c.row, c.alignCenter)}
        onPress={() => {
          quick((s) => {
            s.repertoireState.analyzeLineOnLichess(currentLine, activeSide);
          });
        }}
      >
        <CMText style={s(textStyles)}>Analyze on lichess</CMText>
        <Spacer width={padding} />
        <i className="fa fa-up-right-from-square" style={s(iconStyles)}></i>
      </Pressable>
    </View>
  );
};

export const ReviewFromHereButton = () => {
  const responsive = useResponsive();
  const buttonStyles = s(
    c.buttons.darkFloater,
    c.selfStretch,
    // c.height(buttonHeight),
    { textStyles: s(c.fg(c.colors.textPrimary)) },
    c.px(8),
    c.py(12)
  );
  const [activeSide] = useRepertoireState((s) => [s.browsingState.activeSide]);
  return (
    <Button
      style={s(buttonStyles)}
      onPress={() => {
        quick((s) => {
          s.repertoireState.reviewState.startReview(
            s.repertoireState.browsingState.activeSide,
            {
              side: activeSide,
              cram: true,
              startLine:
                s.repertoireState.browsingState.chessboardState.moveLog,
              startPosition:
                s.repertoireState.browsingState.chessboardState.getCurrentEpd(),
            }
          );
        });
      }}
    >
      <CMText style={s(c.fg(c.grays[80]), c.fontSize(18))}>
        <i className={"fa-duotone fa-cards-blank"} />
      </CMText>
      <Spacer width={8} />
      <CMText
        style={s(
          c.fg(c.colors.textPrimary),
          c.fontSize(responsive.switch(16)),
          c.weightBold
        )}
      >
        Review all from here
      </CMText>
    </Button>
  );
};
