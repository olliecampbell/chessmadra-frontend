import React, { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { ChessboardView } from "app/components/chessboard/Chessboard";
import { isEmpty, isNil } from "lodash-es";
import { Button } from "app/components/Button";
import { Side } from "app/utils/repertoire";
import { CMText } from "./CMText";
import {
  quick,
  useBrowsingState,
  useRepertoireState,
  useSidebarState,
} from "app/utils/app_state";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { useParams } from "react-router-dom";
import { BP, Responsive, useResponsive } from "app/utils/useResponsive";
import useKeypress from "react-use-keypress";
import { BrowserSidebar } from "./BrowsingSidebar";
import { FadeInOut } from "./FadeInOut";
import { BrowsingMode } from "app/utils/browsing_state";
import { intersperse } from "app/utils/intersperse";
import { isVertical } from "react-range/lib/utils";
import { SettingsButtons } from "./Settings";
import { useMeasure } from "@reactivers/hooks";

export const VERTICAL_BREAKPOINT = BP.md;

export const SidebarLayout = ({
  shared,
  mode,
}: {
  shared?: boolean;
  mode: BrowsingMode;
}) => {
  const [activeSide, onboardingStack] = useSidebarState(([s]) => [
    s.activeSide,
    s.sidebarOnboardingState.stageStack,
  ]);
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);
  const [sideBarMode] = useSidebarState(([s]) => [s.mode]);
  let chessboardFrozen = sideBarMode === "overview";
  if (onboardingStack.length > 0) {
    chessboardFrozen = true;
  }
  const [chessboardShownAnim] = useBrowsingState(([s]) => [
    s.chessboardShownAnim,
  ]);

  useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
    if (event.key === "ArrowLeft" && mode !== "review") {
      quick((s) => s.repertoireState.backOne());
    }
  });
  let { side: paramSide } = useParams();
  console.log(mode, sideBarMode);
  useEffect(() => {
    if (mode && !sideBarMode) {
      quick((s) => {
        // TODO: fix this
        s.navigationState.push("/");
        // switch (mode) {
        //   case "review": {
        //     s.navigationState.push("/");
        //   }
        //   case "review": {
        //     s.navigationState.push("/");
        //   }
        // }
      });
    }
  }, [mode, sideBarMode]);
  useEffect(() => {
    if (
      paramSide !== activeSide &&
      mode == "build" &&
      !repertoireLoading &&
      !shared
    ) {
      quick((s) => {
        s.repertoireState.startBrowsing(
          (paramSide as Side) ?? "white",
          "build"
        );
      });
    }
  }, [repertoireLoading]);
  // const router = useRouter();
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  console.log("vertical", vertical);
  const loading = repertoireLoading;
  let chessboardHidden = false;
  const chessboardRef = useRef(null);
  const { height: chessboardHeight } = useMeasure({ ref: chessboardRef });
  if (vertical) {
    if (mode === "overview") {
      chessboardHidden = true;
    }
  }
  return (
    <RepertoirePageLayout flushTop bottom={null} fullHeight naked>
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
              {!vertical ? (
                <View style={s(c.height(140), c.column, c.justifyEnd)}>
                  <NavBreadcrumbs />
                  <Spacer height={22} />
                </View>
              ) : (
                <MobileTopBar />
              )}
              <>
                <Animated.View
                  style={s(
                    c.fullWidth,
                    vertical &&
                      s(c.selfCenter, c.maxWidth(440), c.pt(20), c.px(12)),
                    chessboardFrozen && c.opacity(20),
                    chessboardFrozen && c.noPointerEvents,
                    vertical &&
                      c.opacity(
                        chessboardShownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.2, 1],
                        })
                      )
                  )}
                >
                  <BrowsingChessboardView ref={chessboardRef} />
                </Animated.View>
                <Spacer height={12} />
                <ExtraChessboardActions />
              </>
              {vertical ? (
                <>
                  <Animated.View
                    style={s(
                      c.grow,

                      c.mt(
                        chessboardShownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-chessboardHeight + 100, 24],
                        })
                      )
                    )}
                  >
                    <BrowserSidebar />
                  </Animated.View>
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
  let fgColor = c.grays[45];
  const textStyles = s(
    c.fontSize(responsive.switch(12, [BP.md, 14])),
    c.fg(fgColor),
    c.weightRegular
  );
  const iconStyles = s(
    c.fontSize(responsive.switch(12, [BP.md, 14])),
    c.fg(fgColor)
  );
  const padding = 8;
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  let [currentLine] = useRepertoireState((s) => [
    s.browsingState.chessboardState.moveLog,
  ]);
  const [sideBarMode] = useSidebarState(([s]) => [s.mode]);
  if (sideBarMode == "review") {
    return null;
  }
  return (
    <FadeInOut
      style={s(c.row, c.fullWidth, c.justifyCenter)}
      open={!isEmpty(currentLine)}
    >
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
        <CMText style={s(textStyles)}>Analyze on Lichess</CMText>
        <Spacer width={padding} />
        <i className="fa fa-up-right-from-square" style={s(iconStyles)}></i>
      </Pressable>
    </FadeInOut>
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
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  return (
    <Button
      style={s(buttonStyles)}
      onPress={() => {
        quick((s) => {
          s.repertoireState.reviewState.startReview(activeSide, {
            side: activeSide,
            cram: true,
            startLine: s.repertoireState.browsingState.chessboardState.moveLog,
            startPosition:
              s.repertoireState.browsingState.chessboardState.getCurrentEpd(),
          });
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

const BrowsingChessboardView = React.forwardRef(function BrowsingChessboardView(
  {},
  ref
) {
  const [chessboardState] = useRepertoireState((s) => [
    s.browsingState.sidebarState.mode == "review"
      ? s.reviewState.chessboardState
      : s.browsingState.chessboardState,
  ]);
  return <ChessboardView state={chessboardState} ref={ref} />;
});

const MobileTopBar = ({}) => {
  const responsive = useResponsive();
  return (
    <View
      style={s(
        c.row,
        c.alignCenter,
        c.fullWidth,
        c.justifyBetween,
        c.px(getSidebarPadding(responsive)),
        c.py(8)
      )}
    >
      <NavBreadcrumbs />
      <SettingsButtons />
    </View>
  );
};

export const NavBreadcrumbs = () => {
  const [breadcrumbs] = useRepertoireState((s) => [s.getBreadCrumbs()]);
  const responsive = useResponsive();
  return (
    <View style={s(c.row, c.alignCenter, c.constrainWidth)}>
      {intersperse(
        breadcrumbs.map((breadcrumb, i) => {
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              style={s(breadcrumb.onPress ? c.clickable : c.unclickable)}
              onPress={() => {
                breadcrumb.onPress?.();
              }}
            >
              <View style={s()}>
                <CMText style={s(c.weightBold, c.fg(c.colors.textSecondary))}>
                  {breadcrumb.text}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <View key={i} style={s(c.mx(responsive.switch(6, [BP.lg, 8])))}>
              <CMText style={s(c.fg(c.grays[40]))}>
                <i className="fa-light fa-angle-right" />
              </CMText>
            </View>
          );
        }
      )}
    </View>
  );
};
