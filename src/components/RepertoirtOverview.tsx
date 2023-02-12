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
import { pgnToLine, Side } from "app/utils/repertoire";
import { getSidebarPadding, SidebarLayout } from "./RepertoireBrowsingView";
import { SidebarTemplate } from "./SidebarTemplate";
import { SidebarAction } from "./SidebarActions";
import { CoverageBar } from "./CoverageBar";
import styled, { css } from "@emotion/native";
import { useHovering } from "../hooks/useHovering";
import { ReviewText } from "./ReviewText";
import { START_EPD } from "app/utils/chess";
import { useResponsive } from "app/utils/useResponsive";
import { BrowsingMode } from "app/utils/browsing_state";

export const RepertoireOverview = (props: {}) => {
  const isMobile = useIsMobile();
  const [side] = useSidebarState(([s]) => [s.activeSide]);
  const textStyles = s(c.fg(c.colors.textPrimary), c.weightSemiBold);
  const rightTextStyles = s(c.fg(c.colors.textPrimary), c.weightRegular);
  let [progressState] = useRepertoireState((s) => [
    s.browsingState.repertoireProgressState[side],
  ]);
  const [numMovesDueFromHere, earliestDueDate] = useBrowsingState(([s, rs]) => [
    rs.numMovesDueFromEpd[side][START_EPD],
    rs.earliestReviewDueFromEpd[side][START_EPD],
  ]);

  let [numMoves] = useRepertoireState((s) => [s.getLineCount(side)]);
  const empty = numMoves === 0;
  const responsive = useResponsive();
  const startBrowsing = (mode: BrowsingMode) => {
    quick((s) => {
      s.repertoireState.animateChessboardShown(responsive, true, () => {
        quick((s) => {
          s.repertoireState.startBrowsing(side, mode);
        });
      });
    });
  };
  let options = [
    {
      core: true,
      onPress: () => {
        quick((s) => {
          startBrowsing("build");
        });
      },
      left: <CMText style={s(textStyles)}>Add/edit lines</CMText>,
      right: empty ? null : (
        <View style={s(c.row, c.alignCenter)}>
          <CoverageAndBar side={side} home={false} />
        </View>
      ),
      icon: "fa-sharp fa-plus",
    },
    {
      core: true,
      hidden: empty,
      disabled: numMovesDueFromHere === 0,
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
        <CMText
          style={s(textStyles, numMovesDueFromHere === 0 && c.fg(c.grays[50]))}
        >
          Review due lines
        </CMText>
      ),
      right: (
        <View style={s(c.row, c.alignCenter)}>
          <ReviewText
            date={earliestDueDate}
            numDue={numMovesDueFromHere}
            overview={true}
          />
        </View>
      ),
    },
    {
      core: true,
      hidden: empty,
      onPress: () => {
        quick((s) => {
          startBrowsing("browse");
        });
      },
      left: (
        <CMText style={s(textStyles)}>Choose a specific line to review</CMText>
      ),
      right: null,
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
      left: <CMText style={s(textStyles)}>Export repertoire</CMText>,
      icon: "fa-sharp fa-arrow-down-to-line",
      right: null,
    },
    {
      onPress: () => {
        quick((s) => {
          s.repertoireState.deleteRepertoire(side);
          trackEvent("repertoire.delete_side");
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
    return empty || expanded || o.core;
  });
  return (
    <SidebarTemplate
      header={`${capitalize(side)} Repertoire`}
      actions={[]}
      bodyPadding={false}
    >
      <Spacer height={48} />
      <View
        style={s(c.height(1), c.fullWidth, c.bg(c.colors.sidebarBorder))}
      ></View>
      {intersperse(
        options.map((opt) => {
          return <Option option={opt} />;
        }),
        (i) => {
          return (
            <View
              style={s(c.height(1), c.fullWidth, c.bg(c.colors.sidebarBorder))}
            ></View>
          );
        }
      )}
      <View
        style={s(c.height(1), c.fullWidth, c.bg(c.colors.sidebarBorder))}
      ></View>
      <Spacer height={12} />
      <View style={s(c.row, c.px(getSidebarPadding(responsive)))}>
        {!expanded && !empty && (
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
              More
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
  const styles = s(c.py(12), c.px(12), c.center, c.row, c.justifyBetween);
  const { hovering, hoveringProps } = useHovering();
  return (
    <Pressable
      {...hoveringProps}
      style={css(styles, s(hovering && c.bg(c.grays[18])))}
      onPress={() => {
        if (!option.disabled) {
          option.onPress();
        }
      }}
    >
      {option.left}
      {option.right ?? (
        <i
          style={s(c.fg(c.colors.textSecondary), c.fontSize(14))}
          className={option.icon}
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
    !home && c.fg(c.colors.textTertiary),
    c.weightRegular
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
          <View style={s(c.height(4), c.width(100), c.row)}>
            <CoverageBar isInSidebar={!home} side={side} />
          </View>
        </>
      )}
    </View>
  );
};
