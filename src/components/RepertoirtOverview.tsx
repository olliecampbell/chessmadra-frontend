import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { capitalize, isNil, sortBy } from "lodash-es";
import { TrainerLayout } from "app/components/TrainerLayout";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
import { CMText } from "./CMText";
import {
  useRepertoireState,
  quick,
  useSidebarState,
  useBrowsingState,
} from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";
import React, { useEffect, useState } from "react";
import { RepertoirePageLayout } from "./RepertoirePageLayout";
import { LichessLogoIcon } from "./icons/LichessLogoIcon";
import { lineToPgn, pgnToLine, Side } from "app/utils/repertoire";
import { getSidebarPadding, SidebarLayout } from "./RepertoireBrowsingView";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction, SidebarSectionHeader } from "./SidebarActions";
import { CoverageBar } from "./CoverageBar";
import styled, { css } from "@emotion/native";
import { useHovering } from "../hooks/useHovering";
import { ReviewText } from "./ReviewText";
import { START_EPD } from "app/utils/chess";
import { useResponsive } from "app/utils/useResponsive";
import { BrowsingMode } from "app/utils/browsing_state";
import { pluralize } from "app/utils/pluralize";
import { ConfirmDeleteRepertoire } from "./ConfirmDeleteRepertoire";

export const RepertoireOverview = (props: {}) => {
  const isMobile = useIsMobile();
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const textStyles = s(c.fg(c.colors.textPrimary), c.weightSemiBold);
  const rightTextStyles = s(
    c.fg(c.colors.textTertiary),
    c.weightSemiBold,
    c.fontSize(12)
  );
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[side],
  ]);
  let [biggestMiss, numMoves] = useRepertoireState((s) => [
    s.repertoireGrades[side]?.biggestMiss,
    s.getLineCount(side),
  ]);
  const [numMovesDueFromHere, earliestDueDate] = useBrowsingState(([s, rs]) => [
    rs.numMovesDueFromEpd[side][START_EPD],
    rs.earliestReviewDueFromEpd[side][START_EPD],
  ]);

  const empty = numMoves === 0;
  const responsive = useResponsive();
  const startBrowsing = (mode: BrowsingMode, skipAnimation?: boolean) => {
    quick((s) => {
      if (skipAnimation) {
        s.repertoireState.startBrowsing(side, mode);
      } else {
        s.repertoireState.animateChessboardShown(responsive, true, () => {
          quick((s) => {
            s.repertoireState.startBrowsing(side, mode);
          });
        });
      }
    });
  };
  let buildOptions = [
    {
      hidden: empty,
      onPress: () => {
        quick((s) => {
          let line = pgnToLine(biggestMiss.lines[0]);
          s.repertoireState.animateChessboardShown(responsive, true, () => {
            quick((s) => {
              s.repertoireState.startBrowsing(side as Side, "build", {
                pgnToPlay: lineToPgn(line),
              });
            });
          });
          trackEvent("overview.click_go_to_biggest_gap");
        });
      },
      left: (
        <CMText style={s(textStyles)}>
          {empty ? "Start building" : "Go to biggest gap"}
        </CMText>
      ),
      right: null,
      icon: empty && "fa-sharp fa-plus",
    },
    {
      hidden: empty,
      onPress: () => {
        quick((s) => {
          startBrowsing("build", empty);
        });
      },
      left: <CMText style={s(textStyles)}>Add/edit lines</CMText>,
    },
  ];
  let reviewOptions = [
    {
      hidden: numMovesDueFromHere === 0,
      onPress: () => {
        quick((s) => {
          s.repertoireState.animateChessboardShown(responsive, true, () => {
            quick((s) => {
              s.repertoireState.reviewState.startReview(side, { side });
            });
          });
        });
      },
      left: (
        <CMText style={s(textStyles)}>Practice all lines due for review</CMText>
      ),
    },
    {
      hidden: numMovesDueFromHere > 0,
      onPress: () => {
        quick((s) => {
          s.repertoireState.animateChessboardShown(responsive, true, () => {
            quick((s) => {
              s.repertoireState.reviewState.startReview(side, {
                side,
                cram: true,
              });
            });
          });
        });
      },
      left: <CMText style={s(textStyles)}>Practice all lines</CMText>,
    },
    {
      hidden: empty,
      onPress: () => {
        quick((s) => {
          startBrowsing("browse");
        });
      },
      left: (
        <CMText style={s(textStyles)}>
          Choose a specific opening to practice
        </CMText>
      ),
      right: null,
    },
  ];
  let options = [
    {
      hidden: !empty,
      onPress: () => {
        quick((s) => {
          s.repertoireState.animateChessboardShown(responsive, true, () => {
            quick((s) => {
              s.repertoireState.startBrowsing(side as Side, "build");
            });
          });
          trackEvent("overview.start_building");
        });
      },
      left: <CMText style={s(textStyles)}>{"Start building"}</CMText>,
      right: null,
      icon: empty && "fa-sharp fa-plus",
    },
    {
      onPress: () => {
        quick((s) => {
          s.repertoireState.startImporting(side);
        });
      },
      left: <CMText style={s(textStyles)}>Import lines</CMText>,
      icon: "fa-sharp fa-file-import",
      right: null,
    },
    {
      onPress: () => {
        quick((s) => {
          s.repertoireState.exportPgn(side);
        });
      },
      hidden: empty,
      left: <CMText style={s(textStyles)}>Export repertoire</CMText>,
      icon: "fa-sharp fa-arrow-down-to-line",
      right: null,
    },
    {
      hidden: empty,
      onPress: () => {
        quick((s) => {
          s.repertoireState.browsingState.replaceView(
            <ConfirmDeleteRepertoire />,
            "right"
          );
        });
      },
      left: <CMText style={s(textStyles)}>Delete repertoire</CMText>,
      icon: "fa-sharp fa-trash",
      right: null,
    },
  ];
  const [expanded, setExpanded] = useState(false);
  options = options.filter((o) => {
    if (o.hidden) return false;
    return empty || expanded;
  });
  let reviewStatus = `You have ${pluralize(
    numMovesDueFromHere,
    "move"
  )} due for review`;
  let reviewTimer = null;
  if (numMovesDueFromHere === 0) {
    reviewStatus = "You have no moves due for review";
    reviewTimer = (
      <ReviewText
        date={earliestDueDate}
        numDue={numMovesDueFromHere}
        overview={true}
      />
    );
  }
  let repertoireStatus = `Your repertoire is ${Math.round(
    progressState.percentComplete
  )}% complete`;
  if (empty) {
    repertoireStatus = `Your repertoire is empty`;
  }
  return (
    <SidebarTemplate
      header={`${capitalize(side)} Repertoire`}
      actions={[]}
      bodyPadding={false}
    >
      <Spacer height={24} />

      {!empty && (
        <>
          <SidebarSectionHeader
            text={repertoireStatus}
            right={
              !empty && (
                <View style={s(c.height(4), c.width(80), c.row)}>
                  <CoverageBar isInSidebar={true} side={side} />
                </View>
              )
            }
          />
          {buildOptions
            .filter((opt) => !opt.hidden)
            .map((opt) => {
              return <Option option={opt} />;
            })}
          <Spacer height={36} />
        </>
      )}
      {!empty && (
        <>
          <SidebarSectionHeader text={reviewStatus} right={reviewTimer} />
          {reviewOptions
            .filter((opt) => !opt.hidden)
            .map((opt) => {
              return <Option option={opt} />;
            })}
          <Spacer height={36} />
        </>
      )}
      {options.length > 0 && (
        <>
          <SidebarSectionHeader
            text={empty ? "Your repertoire is empty" : "More options"}
          />
          {options.map((opt) => {
            return <Option option={opt} />;
          })}
          <Spacer height={12} />
        </>
      )}
      <View style={s(c.row, c.px(getSidebarPadding(responsive)))}>
        {!empty && (
          <Pressable
            style={s(c.pb(2))}
            onPress={() => {
              trackEvent("repertoire.moves_table.edit_annotations");
              setExpanded(!expanded);
            }}
          >
            <CMText
              style={s(
                c.fontSize(12),
                c.fg(c.colors.textTertiary),
                c.weightSemiBold
              )}
            >
              {!expanded ? "More options..." : "Hide "}
            </CMText>
          </Pressable>
        )}
      </View>
    </SidebarTemplate>
  );
};

const Option = ({
  option,
}: {
  option: {
    onPress: () => void;
    right?: React.ReactNode;
    left: React.ReactNode;
    core?: boolean;
    icon?: string;
    disabled?: boolean;
  };
}) => {
  const responsive = useResponsive();
  const styles = s(
    c.py(12),
    c.px(getSidebarPadding(responsive)),
    c.center,
    c.row,
    c.justifyBetween
  );
  const { hovering, hoveringProps } = useHovering();
  return (
    <Pressable
      {...hoveringProps}
      style={s(
        styles,
        option.disabled && c.noPointerEvents,
        c.borderBottom(`1px solid ${c.colors.border}`),
        s(hovering && !option.disabled && c.bg(c.grays[18]))
      )}
      onPress={() => {
        if (!option.disabled) {
          option.onPress();
        }
      }}
    >
      {option.left}
      {option.right ?? (
        <i
          style={s(c.fg(c.colors.textTertiary), c.fontSize(14))}
          className={option.icon || "fa fa-arrow-right"}
        ></i>
      )}
    </Pressable>
  );
};

export const CoverageAndBar = ({
  side,
  home,
  hideBar,
}: {
  side: Side;
  home: boolean;
  hideBar?: boolean;
}) => {
  const inverse = home && side === "white";
  const textStyles = s(
    c.fg(inverse ? c.colors.textInverse : c.colors.textSecondary),
    !home && c.fg(c.colors.textSecondary),
    c.weightSemiBold,
    c.fontSize(12)
  );
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[side],
  ]);

  return (
    <View style={s(c.row, c.alignCenter)}>
      <CMText style={s(textStyles)}>
        {progressState.completed ? (
          <>Completed</>
        ) : (
          <>{Math.round(progressState.percentComplete)}% complete</>
        )}
      </CMText>
      {!hideBar && (
        <>
          <Spacer width={8} />
          <View
            style={s(c.height(home ? 4 : 4), c.width(home ? 100 : 80), c.row)}
          >
            <CoverageBar isInSidebar={!home} side={side} />
          </View>
        </>
      )}
    </View>
  );
};
