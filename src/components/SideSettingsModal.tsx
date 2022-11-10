import { View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { isNil } from "lodash-es";
import { Button } from "app/components/Button";
import { useIsMobile } from "app/utils/isMobile";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { Modal } from "./Modal";
import { useRepertoireState } from "app/utils/app_state";
import { trackEvent } from "app/hooks/useTrackEvent";

export const SideSettingsModal = () => {
  let [side, exportPgn, deleteRepertoire, quick] = useRepertoireState((s) => [
    s.repertoireSettingsModalSide,
    s.exportPgn,
    s.deleteRepertoire,
    s.quick,
  ]);
  const isMobile = useIsMobile();
  return (
    <Modal
      onClose={() => {
        quick((s) => {
          s.repertoireSettingsModalSide = null;
        });
      }}
      visible={!isNil(side)}
    >
      <View style={s(c.maxWidth(500))}>
        <View
          style={s(
            c.column,
            c.alignStretch,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-sharp fa-arrow-down-to-line"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Export
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Export your {side} repertoire to a PGN file. You can import this
                file into a Lichess study, ChessBase, Chessable course, etc.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  trackEvent("repertoire.export_pgn");
                  exportPgn(side);
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Export</CMText>
              </Button>
            </View>
          </View>
        </View>
        <View
          style={s(
            c.column,
            c.alignStretch,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-sharp fa-plus"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Import
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Import from a PGN, pre-built templates, or from your Lichess
                games
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(c.buttons.primary, c.height(36), c.selfEnd)}
                onPress={() => {
                  quick((s) => {
                    s.startImporting(side);
                    trackEvent("overview.import_to_repertoire");
                    s.repertoireSettingsModalSide = null;
                  });
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Import</CMText>
              </Button>
            </View>
          </View>
        </View>
        <View
          style={s(
            c.column,
            c.px(isMobile ? 12 : 24),
            c.py(isMobile ? 12 : 24)
          )}
        >
          <View style={s(c.row, c.alignStart)}>
            <i
              style={s(c.fontSize(24), c.fg(c.grays[30]), c.mt(4))}
              className="fa-sharp fa-trash"
            ></i>
            <Spacer width={16} />
            <View style={s(c.column, c.alignStart, c.flexible, c.grow)}>
              <CMText
                style={s(
                  c.fg(c.colors.textPrimary),
                  c.fontSize(18),
                  c.flexShrink(0)
                )}
              >
                Delete
              </CMText>
              <Spacer height={4} />
              <CMText style={s(c.fg(c.colors.textSecondary), c.flexShrink(1))}>
                Delete your entire {side} repertoire. This cannot be undone.
              </CMText>
              <Spacer height={12} />
              <Button
                style={s(
                  c.buttons.primary,
                  c.bg(c.failureShades[50]),
                  c.height(36),
                  c.selfEnd
                )}
                onPress={() => {
                  deleteRepertoire(side);
                  trackEvent("repertoire.delete_side");
                }}
              >
                <CMText style={s(c.buttons.primary.textStyles)}>Delete</CMText>
              </Button>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};
