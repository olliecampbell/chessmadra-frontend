import { ChessboardView } from "~/components/chessboard/Chessboard";
import { includes, isEmpty } from "lodash-es";
import { CMText } from "./CMText";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { BrowserSidebar } from "./BrowsingSidebar";
import { FadeInOut } from "./FadeInOut";
import { SettingsButtons } from "./Settings";
import { Animated } from "./View";
import {
  useRepertoireState,
  useBrowsingState,
  useSidebarState,
  quick,
  getAppState,
} from "~/utils/app_state";
import { createEffect, createSignal, Show } from "solid-js";
import { Button } from "./Button";
import { s, c } from "~/utils/styles";
import { BrowsingMode } from "~/utils/browsing_state";
import { BP, useResponsive } from "~/utils/useResponsive";
import { Spacer } from "~/components/Space";
import { Pressable } from "./Pressable";
import { trackEvent } from "~/utils/trackEvent";
import { Intersperse } from "./Intersperse";
import { clsx } from "~/utils/classes";
import { createElementBounds } from "@solid-primitives/bounds";

export const VERTICAL_BREAKPOINT = BP.md;

export const SidebarLayout = (props: {
  shared?: boolean;
  mode: BrowsingMode;
}) => {
  // let chessboardFrozen = sideBarMode === "overview" || sideBarMode === "home";
  // if (onboardingStack.length > 0 || showingPlans) {
  //   chessboardFrozen = true;
  // }
  const [onboardingStack, showingPlans] = useSidebarState(([s]) => [
    s.sidebarOnboardingState.stageStack,
    s.showPlansState.visible,
  ]);
  let chessboardFrozen = () => {
    let frozen = false;
    if (onboardingStack.length > 0 || showingPlans()) {
      console.log("chessboardFrozen");
      frozen = true;
    }
    return frozen;
  };

  // useKeypress(["ArrowLeft", "ArrowRight"], (event) => {
  //   if (event.key === "ArrowLeft" && mode !== "review") {
  //     quick((s) => s.repertoireState.backOne());
  //   }
  // });
  // let { side: paramSide } = useParams();
  // useEffect(() => {
  //   if (mode && !sideBarMode) {
  //     quick((s) => {
  //       s.navigationState.push("/");
  //     });
  //   }
  // }, [mode, sideBarMode]);
  const responsive = useResponsive();
  const vertical = responsive.bp < VERTICAL_BREAKPOINT;
  const [chessboardContainerRef, setChessboardContainerRef] =
    createSignal(null);
  const chessboardLayout = createElementBounds(chessboardContainerRef);
  const chessboardHeight = () => chessboardLayout.height;
  const chessboardHidden = () => {
    if (vertical) {
      return includes(["overview", "home"], props.mode);
    }
    return false;
  };

  return (
    <RepertoirePageLayout flushTop bottom={null} fullHeight naked>
      <div
        id="page-content"
        style={s(
          !vertical ? c.containerStyles(responsive.bp) : c.fullWidth,
          c.alignCenter,
          c.grow,
          c.noUserSelect
        )}
      >
        <div
          style={s(
            vertical ? c.width(c.min(600, "100%")) : c.fullWidth,
            vertical ? c.column : c.row,
            c.grow,
            c.selfStretch,
            vertical ? c.justifyStart : c.justifyCenter
          )}
        >
          <div
            style={s(
              c.column,
              !vertical && s(c.grow, c.noBasis, c.flexShrink),
              vertical ? c.width("min(480px, 100%)") : c.maxWidth(440),
              vertical && c.grow,
              vertical ? c.selfCenter : c.selfStretch
            )}
          >
            {!vertical ? (
              <div style={s(c.height(140), c.column, c.justifyEnd)}>
                <NavBreadcrumbs />
                <Spacer height={32} />
              </div>
            ) : (
              <MobileTopBar />
            )}
            <div
              ref={setChessboardContainerRef}
              class={clsx("duration-250 transition-opacity ease-in-out")}
              style={s(
                c.fullWidth,
                vertical &&
                  s(
                    c.selfCenter,
                    c.maxWidth(480),
                    c.px(c.getSidebarPadding(responsive))
                  ),
                chessboardFrozen() && c.noPointerEvents,
                chessboardHidden() ? c.opacity(20) : c.opacity(100)
              )}
            >
              <BrowsingChessboardView />
            </div>
            <Show when={!responsive.isMobile}>
              <Spacer height={12} />
              <Show when={props.mode === "build" || props.mode === "browse"}>
                <div class="row w-full justify-center">
                  <AnalyzeOnLichessButton />
                </div>
              </Show>
            </Show>
            <Show when={responsive.isMobile}>
              <Spacer height={c.getSidebarPadding(responsive)} />
            </Show>
            {vertical ? (
              <div
                class={clsx("transition-mt duration-250 ease-in-out")}
                style={s(
                  c.grow,

                  chessboardHeight()
                    ? c.mt(!chessboardHidden() ? 0 : -chessboardHeight() + 100)
                    : c.mt(0)
                )}
              >
                <BrowserSidebar />
              </div>
            ) : (
              <Spacer height={60} />
            )}
          </div>
          <Show when={!vertical}>
            <>
              <Spacer width={responsive.switch(24, [BP.lg, 48])} />
              <div
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
              </div>
            </>
          </Show>
        </div>
      </div>
    </RepertoirePageLayout>
  );
};

export const AnalyzeOnLichessButton = ({}: {}) => {
  const responsive = useResponsive();
  const iconStyles = s(c.fontSize(responsive.switch(12, [BP.md, 14])));
  const padding = 8;
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const [currentLine] = useBrowsingState(([s, rs]) => [
    s.chessboard.get((v) => v).moveLog,
  ]);
  const [sideBarMode] = useSidebarState(([s]) => [s.mode]);
  createEffect(() => {
    console.log("debug", currentLine(), sideBarMode());
  });
  return (
    <FadeInOut
      style={s(c.row)}
      open={() =>
        !isEmpty(currentLine()) &&
        (sideBarMode() == "browse" ||
          sideBarMode() == "review" ||
          sideBarMode() == "build")
      }
    >
      <Pressable
        style={s(c.row, c.alignCenter)}
        class={clsx(
          "text-tertiary &hover:text-primary md:text-md text-xs font-semibold transition-colors"
        )}
        onPress={() => {
          quick((s) => {
            trackEvent("chessboard.analyze_on_lichess", {
              side: activeSide(),
              mode: sideBarMode(),
            });
            s.repertoireState.analyzeLineOnLichess(currentLine(), activeSide());
          });
        }}
      >
        <CMText>Analyze on Lichess</CMText>
        <Spacer width={padding} />
        <i class="fa fa-up-right-from-square " style={s(iconStyles)}></i>
      </Pressable>
    </FadeInOut>
  );
};

// TODO: solid: ref stuff?
const BrowsingChessboardView = function BrowsingChessboardView() {
  const [mode] = useRepertoireState((s) => [s.browsingState.sidebarState.mode]);
  const chessboardState = () =>
    mode() === "review"
      ? getAppState().repertoireState.reviewState.chessboard
      : getAppState().repertoireState.browsingState.chessboard;
  // useRepertoireState((s) => [
  //   s.browsingState.sidebarState.mode == "review"
  //     ? s.reviewState.chessboardState
  //     : s.browsingState.chessboardState,
  // ]);
  return <ChessboardView chessboardInterface={chessboardState()} />;
};

const MobileTopBar = ({}) => {
  const responsive = useResponsive();
  return (
    <div
      style={s(
        c.row,
        c.alignCenter,
        c.fullWidth,
        c.justifyBetween,
        c.px(c.getSidebarPadding(responsive)),
        c.py(8)
      )}
    >
      <NavBreadcrumbs />
      <SettingsButtons />
    </div>
  );
};

export const NavBreadcrumbs = () => {
  const responsive = useResponsive();
  const mobile = () => responsive.isMobile;
  const [breadcrumbs] = useRepertoireState((s) => [s.getBreadCrumbs(mobile())]);

  const hidden = () => breadcrumbs().length == 1;
  const [mode] = useSidebarState(([s]) => [s.mode]);
  return (
    // todo: figure out why this is not working
    <FadeInOut
      open={() => !hidden()}
      style={s(c.row, c.alignCenter, c.constrainWidth)}
    >
      <Intersperse
        separator={() => {
          return (
            <div style={s(c.mx(responsive.switch(6, [BP.lg, 8])))}>
              <CMText style={s(c.fg(c.grays[40]))}>
                <i class="fa-light fa-angle-right" />
              </CMText>
            </div>
          );
        }}
        each={breadcrumbs}
      >
        {(breadcrumb) => (
          <Pressable
            style={s(breadcrumb().onPress ? c.clickable : c.unclickable)}
            onPress={() => {
              if (!breadcrumb().onPress) {
                return;
              }
              quick((s) => {
                trackEvent("breadcrumbs.clicked", {
                  mode,
                  breadcrumb: breadcrumb().text,
                });
                s.repertoireState.browsingState.moveSidebarState("left");
                breadcrumb().onPress?.();
              });
            }}
          >
            <div style={s()}>
              <CMText
                style={s(c.weightBold)}
                class={clsx(
                  "text-tertiary",
                  breadcrumb().onPress &&
                    "&hover:text-primary text-sm transition-colors"
                )}
              >
                {breadcrumb().text}
              </CMText>
            </div>
          </Pressable>
        )}
      </Intersperse>
    </FadeInOut>
  );
};
