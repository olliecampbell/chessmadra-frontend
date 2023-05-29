import { ChessboardView } from "~/components/chessboard/Chessboard";
import { includes, isEmpty } from "lodash-es";
import { CMText } from "./CMText";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { SidebarContainer } from "./SidebarContainer";
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
import { createEffect, createSignal, onMount, Show } from "solid-js";
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
import { BackSection } from "./BackSection";
import { isChessmadra } from "~/utils/env";

export const VERTICAL_BREAKPOINT = BP.md;

export const SidebarLayout = (props: {
  shared?: boolean;
  setAnimateSidebar: (fn: (dir: "right" | "left") => void) => void;
  breadcrumbs;
  sidebarContent;
  belowChessboard;
  chessboardInterface;
  backSection;
  settings;
  loading: boolean;
}) => {
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [showingPlans] = useSidebarState(([s]) => [s.showPlansState.visible]);
  const [onboarding] = useRepertoireState((s) => [s.onboarding]);
  let chessboardFrozen = () => {
    let frozen = false;
    if (showingPlans()) {
      console.log("chessboardFrozen");
      frozen = true;
    }
    return frozen;
  };
  const activeTool = () => getAppState().trainersState.getActiveTool();

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
  const chessboardLayout = createElementBounds(chessboardContainerRef, {
    trackMutation: false,
  });
  const chessboardHeight = () => chessboardLayout.height;
  const chessboardHidden = () => {
    if (isChessmadra) {
      return activeTool() === "visualization";
    }
    if (vertical) {
      return includes(["overview", "home"], mode());
    }
    return false;
  };

  return (
    <RepertoirePageLayout
      flushTop
      bottom={null}
      fullHeight
      naked
      loading={props.loading}
    >
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
              vertical && c.width("min(480px, 100%)"),
              vertical && c.grow,
              vertical ? c.selfCenter : c.selfStretch
            )}
            class={clsx("xxl:max-w-[800px] lg:max-w-[440px] xl:max-w-[500px]")}
          >
            {!vertical ? (
              <div style={s(c.height(140), c.column, c.justifyEnd)}>
                {props.breadcrumbs}
                <Spacer height={32} />
              </div>
            ) : (
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
                {props.breadcrumbs}
                {props.settings}
              </div>
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
              <ChessboardView chessboardInterface={props.chessboardInterface} />
            </div>
            <Show when={!responsive.isMobile}>
              <Spacer height={12} />
              <div class="row w-full justify-center">
                {props.belowChessboard}
              </div>
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
                <SidebarContainer
                  backSection={props.backSection}
                  setAnimateSidebar={props.setAnimateSidebar}
                  children={props.sidebarContent}
                  settings={props.settings}
                />
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
                <SidebarContainer
                  backSection={props.backSection}
                  setAnimateSidebar={props.setAnimateSidebar}
                  children={props.sidebarContent}
                  settings={props.settings}
                />
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
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [activeSide] = useSidebarState(([s]) => [s.activeSide]);
  const currentLine = () => {
    if (mode() === "review") {
      return getAppState().repertoireState.reviewState.moveLog;
    } else {
      return getAppState().repertoireState.browsingState.sidebarState.moveLog;
    }
  };
  createEffect(() => {
    console.log("current linet", currentLine());
  });
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
        style={s()}
        class={clsx(
          "text-tertiary &hover:text-primary text-md py-2 font-semibold transition-colors"
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
        <p>
          Analyze on Lichess
          <i class="fa fa-up-right-from-square pl-2" style={s(iconStyles)}></i>
        </p>
      </Pressable>
    </FadeInOut>
  );
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
