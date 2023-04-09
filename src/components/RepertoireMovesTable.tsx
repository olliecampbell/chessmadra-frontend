// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import {
  some,
  isEmpty,
  filter,
  isNil,
  last,
  includes,
  max,
  map,
  reverse,
  cloneDeep,
} from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { RepertoireMiss, RepertoireMove, Side } from "~/utils/repertoire";
import { CMText } from "./CMText";
import { MoveTag, SuggestedMove } from "~/utils/models";
import {
  useBrowsingState,
  useSidebarState,
  useDebugState,
  useRepertoireState,
  getAppState,
} from "~/utils/app_state";
import { RepertoireEditingHeader } from "./RepertoireEditingHeader";
import { trackEvent } from "~/utils/trackEvent";
import { getAppropriateEcoName } from "~/utils/eco_codes";
import { getMoveRatingIcon, MoveRating } from "~/utils/move_inaccuracy";
import { quick } from "~/utils/app_state";
import { AnnotationEditor } from "./AnnotationEditor";
import { TableResponseScoreSource } from "~/utils/table_scoring";
import { BP, useResponsive } from "~/utils/useResponsive";
import { TableMeta, useSections } from "~/utils/useSections";
import { useHovering } from "~/mocks";
import {
  Accessor,
  createSignal,
  createMemo,
  For,
  Show,
  onMount,
  createEffect,
} from "solid-js";
import { Pressable } from "./Pressable";
import { destructure } from "@solid-primitives/destructure";
import { Intersperse } from "./Intersperse";
import { clsx } from "~/utils/classes";

const DELETE_WIDTH = 30;

export interface TableResponse {
  reviewInfo?: { earliestDue: string; due: number };
  transposes?: boolean;
  lowConfidence?: boolean;
  biggestMiss?: RepertoireMiss;
  coverage?: number;
  moveRating?: MoveRating;
  repertoireMove?: RepertoireMove;
  suggestedMove?: SuggestedMove;
  score?: number;
  scoreTable?: ScoreTable;
  side: Side;
  tags: MoveTag[];
}

export interface ScoreTable {
  factors: ScoreFactor[];
  notes: string[];
}

export interface ScoreFactor {
  weight?: number;
  value: number;
  source: TableResponseScoreSource;
  total?: number;
}

export const RepertoireMovesTable = ({
  header,
  activeSide,
  side,
  responses,
  usePeerRates,
  body,
}: {
  header: Accessor<string | undefined | null>;
  body?: Accessor<string>;
  activeSide: Accessor<Side>;
  showOtherMoves?: Accessor<boolean>;
  usePeerRates: Accessor<boolean>;
  side: Accessor<Side>;
  responses: Accessor<TableResponse[]>;
}) => {
  const responsive = useResponsive();
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const [expandedLength, setExpandedLength] = createSignal(0);
  const [editingAnnotations, setEditingAnnotations] = createSignal(false);
  onMount(() => {
    console.log("RepertoireMovesTable onMount");
  });
  const { trimmedResponses, sections, anyMine, truncated, mine, myTurn } =
    destructure(
      createMemo(() => {
        const anyMine = some(responses(), (m) => m.repertoireMove?.mine);
        const mine = filter(responses(), (m) => m.repertoireMove?.mine);
        const anyNeeded = some(responses(), (m) => m.suggestedMove?.needed);
        const myTurn = side() === activeSide();
        const isMobile = useIsMobile();
        // todo: solid, prob need to use accessors here
        const sections = useSections({
          myTurn,
          usePeerRates: usePeerRates(),
          isMobile,
        });
        const MIN_TRUNCATED = isMobile ? 1 : 1;
        const trimmedResponses = filter(responses(), (r, i) => {
          if (mode() == "browse") {
            return r.repertoireMove;
          }
          if (i < expandedLength()) {
            return true;
          }
          if (r.repertoireMove) {
            return true;
          }
          if (anyNeeded && !r.suggestedMove?.needed) {
            return false;
          }
          if (anyMine) {
            return false;
          }
          if (r.suggestedMove?.needed && !myTurn) {
            return true;
          }
          return (
            i < MIN_TRUNCATED ||
            r.repertoireMove ||
            (myTurn && r.score > 0) ||
            moveHasTag(r, MoveTag.RareDangerous) ||
            (myTurn && moveHasTag(r, MoveTag.Transposes))
          );
        }) as TableResponse[];
        const numTruncated = responses().length - trimmedResponses.length;
        const truncated = numTruncated > 0;
        // console.log("returning sections", sections);
        return {
          trimmedResponses,
          sections,
          mine,
          myTurn,
          anyMine,
          truncated,
        };
      })
    );
  const widths: Record<string, number | null> = {};

  const [currentLine] = useBrowsingState(([s, rs]) => [
    s.chessboard.get((v) => v).moveLog,
  ]);
  const moveNumber = () => Math.floor(currentLine().length / 2) + 1;
  const hideAnnotations = () => moveNumber() === 1;
  const [moveMaxWidth, setMoveMaxWidth] = createSignal(40);
  const [currentEcoCode] = useSidebarState(([s, rs]) => [s.lastEcoCode]);
  const [ecoCodeLookup] = useRepertoireState((s) => [s.ecoCodeLookup], {
    referenceEquality: true,
  });
  const onMoveRender = (sanPlus, e) => {
    if (isNil(e)) {
      // TODO: better deletion, decrease widths
      widths[sanPlus] = null;
      return;
    }
    const width = e.getBoundingClientRect().width;
    widths[sanPlus] = width;
    if (width > moveMaxWidth()) {
      setMoveMaxWidth(width);
    }
  };
  const tableMeta: Accessor<TableMeta> = () => {
    return {
      highestIncidence: max(
        map(responses(), (r) => r.suggestedMove?.incidence ?? 1.0)
      ),
    };
  };
  let includeOpeningName = false;
  const openingNames = createMemo(() =>
    reverse(
      map(reverse(cloneDeep(trimmedResponses())), (tr) => {
        const newOpeningName = null;
        const [currentOpeningName, currentVariations] = currentEcoCode()
          ? getAppropriateEcoName(currentEcoCode()?.fullName)
          : [];
        const nextEcoCode = ecoCodeLookup()[tr.suggestedMove?.epdAfter];
        if (nextEcoCode) {
          const [name, variations] = getAppropriateEcoName(
            nextEcoCode.fullName
          );
          if (name != currentOpeningName) {
            includeOpeningName = true;
            return name;
          }
          const lastVariation = last(variations);

          if (
            name === currentOpeningName &&
            lastVariation != last(currentVariations)
          ) {
            includeOpeningName = true;
            return last(variations);
          }
          if (includeOpeningName) {
            return last(variations);
          }
        }
      })
    )
  );
  createEffect(() => {
    console.log("opening names", openingNames());
  });
  return (
    <div style={s(c.column)}>
      <Show when={header()}>
        <>
          <RepertoireEditingHeader>{header()}</RepertoireEditingHeader>
          <Spacer height={responsive.switch(20, [BP.md, 24])} />
        </>
      </Show>
      <Show when={body}>
        <>
          <CMText style={s(c.px(c.getSidebarPadding(responsive)))}>
            {body}
          </CMText>
          <Spacer height={24} />
        </>
      </Show>
      <div style={s(c.height(16))}>
        <Show when={!editingAnnotations()}>
          <TableHeader anyMine={anyMine()} sections={sections} />
        </Show>
      </div>
      <Spacer height={responsive.switch(6, [BP.md, 12])} />
      <div
        style={s(
          c.column,
          !editingAnnotations() &&
            s(
              c.borderTop(`1px solid ${c.colors.sidebarBorder}`),
              c.borderBottom(`1px solid ${c.colors.sidebarBorder}`)
            )
        )}
      >
        <Intersperse
          each={trimmedResponses}
          separator={(i) => (
            <div
              style={s(
                c.height(editingAnnotations() ? 12 : 1),
                !editingAnnotations() && c.bg(c.grays[30])
              )}
            ></div>
          )}
        >
          {(tableResponse, i) => {
            const openingName = () => openingNames()[i];
            return (
              <Response
                openingName={openingName()}
                tableMeta={tableMeta()}
                hideAnnotations={hideAnnotations()}
                myTurn={myTurn()}
                anyMine={anyMine()}
                sections={sections()}
                editing={editingAnnotations()}
                tableResponse={tableResponse}
                moveMinWidth={moveMaxWidth()}
                moveRef={(e) => {
                  console.log("e", e);
                  onMoveRender(
                    tableResponse.suggestedMove?.sanPlus ||
                      tableResponse.repertoireMove?.sanPlus,
                    e
                  );
                }}
              />
            );
          }}
        </Intersperse>
      </div>
      <div
        style={s(c.row, c.px(c.getSidebarPadding(responsive)))}
        class={clsx("pt-4")}
      >
        <Show when={truncated() && mode() == "build"}>
          <Pressable
            style={s(c.pb(2))}
            onPress={() => {
              setExpandedLength(trimmedResponses().length + 5);
              trackEvent("browsing.moves_table.show_more");
            }}
          >
            <CMText
              class="text-tertiary &hover:text-secondary transition-colors"
              style={s(c.fontSize(12), c.weightSemiBold)}
            >
              Show more moves
            </CMText>
          </Pressable>
          <Spacer width={16} />
        </Show>
        {!hideAnnotations && mode() == "build" && (
          <>
            <Pressable
              style={s(c.pb(2))}
              onPress={() => {
                if (!editingAnnotations) {
                  trackEvent(`${mode()}.moves_table.edit_annotations`);
                }
                setEditingAnnotations(!editingAnnotations);
              }}
            >
              <CMText
                style={s(
                  c.fontSize(12),
                  c.fg(c.colors.textTertiary),
                  c.weightSemiBold
                )}
              >
                {editingAnnotations()
                  ? "Stop editing annotations"
                  : "Edit annotations"}
              </CMText>
            </Pressable>
            <Spacer width={16} />
          </>
        )}
        {anyMine() && mode() == "build" && (
          <>
            <Pressable
              style={s(c.pb(2))}
              onPress={() => {
                trackEvent(`${mode()}.moves_table.delete_move`);
                quick((s) => {
                  s.repertoireState.browsingState.moveSidebarState("right");
                  s.repertoireState.browsingState.sidebarState.deleteLineState.visible =
                    true;
                });
              }}
            >
              <CMText
                style={s(
                  c.fontSize(12),
                  c.fg(c.colors.textTertiary),
                  c.weightSemiBold
                )}
              >
                {`Remove ${mine().length > 1 ? "a" : "this"} move`}
              </CMText>
            </Pressable>
            <Spacer width={12} />
          </>
        )}
      </div>
    </div>
  );
};

const Response = (props: {
  tableResponse: TableResponse;
  anyMine: boolean;
  hideAnnotations: boolean;
  sections: any[];
  myTurn: boolean;
  moveMinWidth: number;
  moveRef: any;
  openingName: string | undefined;
  editing: boolean;
  tableMeta: TableMeta;
}) => {
  const debugUi = useDebugState((s) => s.debugUi);
  const [currentEpd, activeSide] = useSidebarState(([s]) => [
    s.currentEpd,
    s.activeSide,
  ]);
  const [positionReport] = useBrowsingState(([s, rs]) => [
    rs.positionReports?.[activeSide()]?.[currentEpd()],
  ]);
  const [moveWidthRef, setMoveWidthRef] = createSignal(
    null as HTMLElement | null
  );
  onMount(() => {
    if (moveWidthRef) {
      props.moveRef(moveWidthRef());
    }
  });

  const [numMovesDueFromHere, earliestDueDate] = useBrowsingState(([s, rs]) => [
    rs.numMovesDueFromEpd[activeSide()][
      props.tableResponse.repertoireMove?.epdAfter
    ],
    rs.earliestReviewDueFromEpd[activeSide()][
      props.tableResponse.repertoireMove?.epdAfter
    ],
  ]);
  const [currentLine, currentSide] = useSidebarState(([s, rs]) => [
    s.moveLog,
    s.currentSide,
  ]);
  const isMobile = useIsMobile();
  console.log("is mobile? ", isMobile);
  const moveNumber = () => Math.floor(currentLine().length / 2) + 1;
  const sanPlus = () =>
    props.tableResponse.suggestedMove?.sanPlus ??
    props.tableResponse?.repertoireMove?.sanPlus;
  const mine = () => props.tableResponse.repertoireMove?.mine;
  const moveRating = () => props.tableResponse.moveRating;

  const responsive = useResponsive();
  const { hoveringProps: responseHoverProps, hovering: hoveringRow } =
    useHovering(
      () => {
        getAppState().repertoireState.browsingState.chessboard?.previewMove(
          sanPlus()
        );
      },
      () => {
        getAppState().repertoireState.browsingState.chessboard?.previewMove(
          null
        );
      }
    );
  const [mode] = useSidebarState(([s]) => [s.mode]);
  const annotation = () => {
    if (props.hideAnnotations) {
      return null;
    }
    return renderAnnotation(props.tableResponse.suggestedMove?.annotation);
  };
  const tags = () => {
    const tags = [];
    // newOpeningName = nextEcoCode?.fullName;
    if (moveHasTag(props.tableResponse, MoveTag.BestMove)) {
      tags.push(
        <MoveTagView
          text="Clear best move"
          icon="fa-duotone fa-trophy"
          style={s(c.fg(c.yellows[60]), c.fontSize(14))}
        />
      );
    }
    if (moveHasTag(props.tableResponse, MoveTag.Transposes)) {
      tags.push(
        <MoveTagView
          text="Transposes to your repertoire"
          icon="fa-solid fa-merge"
          style={s(c.fg(c.greens[55]), c.fontSize(14), c.rotate(-90))}
        />
      );
    }
    if (moveHasTag(props.tableResponse, MoveTag.TheoryHeavy)) {
      tags.push(
        <MoveTagView
          text="Warning: heavy theory"
          icon="fa-solid fa-triangle-exclamation"
          style={s(c.fg(c.reds[60]), c.fontSize(14))}
        />
      );
    }
    if (moveHasTag(props.tableResponse, MoveTag.RareDangerous)) {
      tags.push(
        <MoveTagView
          text="Rare but dangerous"
          icon="fa fa-radiation"
          style={s(c.fg(c.reds[65]), c.fontSize(18))}
        />
      );
    }
    if (moveHasTag(props.tableResponse, MoveTag.CommonMistake)) {
      tags.push(
        <MoveTagView
          text="Common mistake"
          icon="fa fa-person-falling"
          style={s(c.fg(c.grays[80]), c.fontSize(14))}
        />
      );
    }
    return tags;
  };

  const hasInlineAnnotationOrOpeningName = () =>
    props.openingName || (!isMobile && annotation());

  const tagsRow = () =>
    !isEmpty(tags()) && (
      <div
        style={s(c.grow, c.row, c.flexWrap, c.justifyStart, c.gap(4))}
        class="gap-4"
      >
        <For each={tags()}>
          {(tag, i) => {
            return tag;
          }}
        </For>
      </div>
    );
  return (
    <>
      <Show when={props.editing}>
        <div style={s(c.row, c.alignCenter)}>
          <Pressable
            onPress={() => {}}
            style={s(
              c.grow,
              c.height(128),
              c.lightCardShadow,
              c.br(2),
              // c.py(8),
              // c.pl(14),
              // c.pr(8),
              c.clickable,
              c.mx(c.getSidebarPadding(responsive)),
              c.bg(c.grays[12]),
              c.row
            )}
          >
            <div
              style={s(c.width(120), c.selfStretch, c.row, c.px(12), c.py(12))}
            >
              <CMText
                style={s(
                  c.fg(c.colors.textSecondary),
                  c.weightSemiBold,
                  c.fontSize(18)
                )}
              >
                {moveNumber}
                {currentSide() === "black" ? "... " : "."}
              </CMText>
              <Spacer width={2} />
              <CMText
                key={sanPlus}
                style={s(
                  c.fg(c.colors.textSecondary),
                  c.fontSize(18),
                  c.weightSemiBold,
                  c.keyedProp("letter-spacing")("0.04rem")
                )}
              >
                {sanPlus}
              </CMText>
            </div>
            <AnnotationEditor
              annotation={() =>
                props.tableResponse.suggestedMove?.annotation ?? ""
              }
              onUpdate={(annotation) => {
                quick((s) => {
                  s.repertoireState.uploadMoveAnnotation({
                    epd: currentEpd(),
                    san: sanPlus(),
                    text: annotation,
                  });
                });
              }}
            />
          </Pressable>
        </div>
      </Show>
      <Show when={!props.editing}>
        <div style={s(c.row, c.alignStart)} {...responseHoverProps}>
          <Pressable
            onPress={() => {
              quick((s) => {
                trackEvent(`${mode()}.moves_table.select_move`);
                s.repertoireState.browsingState.moveSidebarState("right");
                // If has transposition tag, quick make transposition state visible on browser state

                if (props.tableResponse.transposes) {
                  s.repertoireState.browsingState.chessboard.makeMove(
                    sanPlus()
                  );
                  s.repertoireState.browsingState.sidebarState.transposedState.visible =
                    true;
                  s.repertoireState.browsingState.chessboard.set((s) => {
                    s.showPlans = true;
                  });
                } else {
                  s.repertoireState.browsingState.chessboard.makeMove(
                    sanPlus()
                  );
                }
              });
            }}
            class={clsx("&hover:bg-gray-18 transition-colors")}
            style={s(
              c.grow,
              c.flexible,
              // tableResponse.bestMove && c.border(`1px solid ${c.yellows[60]}`),
              c.br(2),

              c.px(c.getSidebarPadding(responsive)),
              c.py(12),

              // mine && c.border(`2px solid ${c.purples[60]}`),
              c.clickable,
              c.row
            )}
          >
            <div style={s(c.column, c.grow, c.constrainWidth)}>
              <div style={s(c.row, c.fullWidth, c.alignStart)}>
                <div style={s(c.row, c.alignCenter)}>
                  <div style={s(c.minWidth(props.moveMinWidth))}>
                    <div
                      style={s(c.row, c.alignCenter)}
                      ref={(e) => {
                        setMoveWidthRef(e);
                      }}
                    >
                      <CMText
                        style={s(
                          c.fg(c.grays[60]),
                          c.fontSize(14),
                          c.weightSemiBold,
                          c.lineHeight("1.3rem"),
                          c.keyedProp("letter-spacing")("0.04rem")
                        )}
                      >
                        {moveNumber}
                        {currentSide() === "black" ? "…" : "."}
                      </CMText>
                      <Spacer width={4} />
                      <CMText
                        key={sanPlus}
                        style={s(
                          c.fg(c.grays[85]),
                          c.fontSize(14),
                          c.lineHeight("1.3rem"),
                          c.weightBold,
                          c.keyedProp("letter-spacing")("0.04rem")
                        )}
                      >
                        {sanPlus}
                      </CMText>
                      {!isNil(moveRating()) && (
                        <>
                          <Spacer width={4} />
                          {() => getMoveRatingIcon(props.moveRating)}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Spacer width={12} />

                <div
                  class={clsx("pr-4")}
                  style={s(
                    c.width(0),
                    c.grow,
                    c.column,

                    !hasInlineAnnotationOrOpeningName() && c.selfCenter
                  )}
                >
                  <CMText
                    style={s(
                      c.fg(c.grays[80]),
                      c.fontSize(12),
                      c.lineHeight("1.3rem")
                    )}
                  >
                    {props.openingName && (
                      <>
                        <b>{props.openingName}</b>
                        {!isMobile && annotation() && (
                          <>
                            . <Spacer width={2} />
                          </>
                        )}
                      </>
                    )}
                    {!isMobile && annotation}
                  </CMText>
                  {tagsRow() && (
                    <>
                      {hasInlineAnnotationOrOpeningName() && (
                        <Spacer height={12} />
                      )}
                      {tagsRow()}
                    </>
                  )}
                </div>

                <div style={s(c.row, c.alignCenter)}>
                  <Intersperse
                    separator={() => {
                      return <Spacer width={getSpaceBetweenStats(isMobile)} />;
                    }}
                    each={() => props.sections}
                  >
                    {(section) => (
                      <div
                        style={s(
                          c.width(section.width),
                          c.center,
                          section.alignLeft && c.justifyStart,
                          section.alignRight && c.justifyEnd,
                          c.row
                        )}
                      >
                        {section.content({
                          numMovesDueFromHere,
                          earliestDueDate,
                          suggestedMove: props.tableResponse.suggestedMove,
                          positionReport: positionReport(),
                          tableResponse: props.tableResponse,
                          side: currentSide,
                          tableMeta: props.tableMeta,
                        })}
                      </div>
                    )}
                  </Intersperse>
                </div>
              </div>
              <div style={s(c.column, c.maxWidth(400))}>
                <Show when={isMobile && annotation()}>
                  <CMText style={s(c.grow, c.pt(8), c.minWidth(0))}>
                    <CMText style={s(c.fg(c.grays[70]), c.fontSize(12))}>
                      {annotation()}
                    </CMText>
                  </CMText>
                </Show>
              </div>
            </div>
          </Pressable>
        </div>
      </Show>
    </>
  );
};

const TableHeader = ({
  sections,
  anyMine,
}: {
  sections: Accessor<any[]>;
  anyMine: boolean;
}) => {
  const isMobile = useIsMobile();
  const responsive = useResponsive();
  return (
    <div
      style={s(
        c.row,
        c.fullWidth,
        c.pl(14),
        c.px(c.getSidebarPadding(responsive))
      )}
    >
      <Spacer width={12} grow />
      <div style={s(c.row, c.alignCenter)}>
        <Intersperse
          separator={() => {
            return <Spacer width={getSpaceBetweenStats(isMobile)} />;
          }}
          each={sections}
        >
          {(section, i) => {
            return (
              <div
                style={s(
                  c.width(section.width),
                  section.alignRight
                    ? c.justifyEnd
                    : section.alignLeft
                    ? c.justifyStart
                    : c.center,
                  c.row,
                  c.textAlign("center")
                )}
              >
                <CMText
                  style={s(
                    c.fg(c.colors.textTertiary),
                    c.fontSize(12),
                    c.whitespace("nowrap")
                  )}
                >
                  {section.header}
                </CMText>
              </div>
            );
          }}
        </Intersperse>
      </div>
      {anyMine && false && <Spacer width={DELETE_WIDTH} />}
    </div>
  );
};

export const DebugScoreView = ({
  tableResponse,
}: {
  tableResponse: TableResponse;
}) => {
  return (
    <div style={s()}>
      <div style={s(c.row, c.textAlign("end"), c.weightBold)}>
        <CMText style={s(c.width(120))}>Source</CMText>
        <Spacer width={12} />
        <CMText style={s(c.width(60))}>Value</CMText>
        <Spacer width={12} />
        <CMText style={s(c.width(60))}>Weight</CMText>
        <Spacer width={12} grow />
        <CMText style={s(c.width(60))}>Total</CMText>
      </div>
      <Spacer height={12} />

      <Spacer height={24} />
      <div style={s(c.row)}>
        <CMText style={s(c.weightBold)}>Total</CMText>
        <Spacer width={12} grow />
        <CMText style={s()}>{tableResponse.score?.toFixed(2)}</CMText>
      </div>
    </div>
  );
};

const getSpaceBetweenStats = (isMobile: boolean) => {
  return isMobile ? 16 : 16;
};

function renderAnnotation(_annotation: string) {
  const annotation = _annotation?.trim();
  const stops = ["!", "?", "."];
  if (annotation) {
    if (some(stops, (stop) => annotation.endsWith(stop))) {
      return annotation;
    } else {
      return `${annotation}.`;
    }
  }
}

const MoveTagView = ({ text, icon, style }: { icon; text; style }) => {
  return (
    <CMText
      style={s(
        c.fg(c.grays[80]),
        c.fontSize(10),
        c.weightBold,
        c.row,
        c.alignCenter
      )}
    >
      <i class={icon} style={s(style)} />
      <Spacer width={8} />
      {text}
    </CMText>
  );
};

const moveHasTag = (m: TableResponse, tag: MoveTag): boolean => {
  return includes(m.tags, tag);
};
