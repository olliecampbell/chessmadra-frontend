import { Pressable } from "react-native";
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { times } from "lodash-es";
import { useIsMobile } from "~/utils/isMobile";
import { navItems, OPENINGS_DESCRIPTION } from "./NavBar";
import { PageContainer } from "./PageContainer";
import { failOnTrue } from "~/utils/test_settings";
import { useHasBetaAccess } from "~/utils/useHasBetaAccess";
import { CMText } from "./CMText";
import { Link } from "react-router-dom";
import React from "react";
import { HeadSiteMeta } from "~/components/PageContainer";
import { BP, useResponsive } from "~/utils/useResponsive";

export const Directory = () => {
  const isMobile = useIsMobile();
  const responsive = useResponsive();
  const hasBetaAccess = useHasBetaAccess();
  return (
    <PageContainer hideNavBar>
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />

<Show when={failOnTrue(false) }>
        <div style={s(c.row)}>
          <ColorSwatch colors={c.primaries} />
          <ColorSwatch colors={c.yellows} />
          <ColorSwatch colors={c.grays} />
        </div>
        </Show>
      <Spacer height={44} />
      <div style={s(c.oldContainerStyles(isMobile), c.grow, c.justifyCenter)}>
        <CMText
          style={s(
            c.fg(c.colors.textPrimary),
            c.fontSize(32),
            c.weightSemiBold
          )}
        >
          Chess Madra
        </CMText>
        <Spacer height={24} />
        <CMText
          style={s(
            c.fg(c.colors.textSecondary),
            c.fontSize(16),
            c.lineHeight("1.5em")
          )}
        >
          Welcome to my little chess training site! Please{" "}
          <a
            href="mailto:me@mbuffett.com"
            style={s(c.borderBottom(`1px solid ${c.grays[80]}`))}
          >
            let me know
          </a>{" "}
          if you have any feedback, or just to say hi :)
        </CMText>
        <Spacer height={44} />
        <div
          style={s({
            display: "grid",
            gridTemplateColumns: responsive.switch("1fr", [BP.md, "1fr 1fr"]),
            gap: "24px 24px",
          })}
        >
          {navItems
            .filter((n) => !n.beta || hasBetaAccess)
            .map(({ path, title, description, beta, isNew }, i) => {
              return (
                <Link
                  style={s(
                    c.clickable,
                    c.relative,
                    c.column,
                    c.flexible,
                    c.px(isMobile ? 10 : 12),
                    c.py(isMobile ? 8 : 16),
                    c.br(4),
                    c.overflowHidden,
                    c.bg(c.grays[80])
                    // c.shadow(0, 5, 25, 1, "rgba(255,255,255,0.5)")
                  )}
                  to={path}
                >
                  <div>
                  <Show when={isNew }>
                      <div
                        style={s(
                          c.absolute,
                          c.top(0),
                          c.right(0),
                          c.brbl(4),
                          // c.round,
                          c.bg(c.grays[75]),
                          c.px(32),
                          c.py(12),
                          c.row
                        )}
                      >
                        <i
                          style={s(c.fg(c.grays[30]))}
                          class="fa-solid fa-party-horn"
                        ></i>
                        <Spacer width={12} />
                        <CMText
                          style={s(
                            c.weightHeavy,
                            c.fg(c.grays[10]),
                            c.caps,
                            c.fontSize(14)
                          )}
                        >
                          New
                        </CMText>
                      </div>
                      </Show>
                      <Show when={beta && !isNew }>
                      <div
                        style={s(
                          c.absolute,
                          c.top(0),
                          c.right(0),
                          c.brbl(4),
                          // c.round,
                          c.bg(c.grays[25]),
                          c.px(32),
                          c.py(12)
                        )}
                      >
                        <CMText
                          style={s(
                            c.weightHeavy,
                            c.fg(c.colors.textPrimary),
                            c.caps,
                            c.fontSize(12)
                          )}
                        >
                          Beta
                        </CMText>
                      </div>
                      </Show>
                    <CMText
                      style={s(
                        c.fg(c.colors.textInverse),
                        c.fontSize(24),
                        c.weightBold
                      )}
                    >
                      {title}
                    </CMText>
                    <Spacer height={isMobile ? 12 : 24} />
                    <CMText style={s(c.fg(c.grays[15]), c.lineHeight("1.5em"))}>
                      {description}
                    </CMText>
                    <Spacer grow height={12} />
                    <Pressable
                      style={s(c.buttons.primary, c.selfEnd, c.minWidth(120))}
                      onPress={(e) => {}}
                    >
                      <CMText style={s(c.buttons.primary.textStyles)}>
                        Start
                      </CMText>
                    </Pressable>
                  </div>
                </Link>
              );
            })}
        </div>
      </div>
    </PageContainer>
  );
};

export const ColorSwatch = ({ colors }) => {
  return (
    <div style={s(c.column, c.width(100))}>
      {times(20).map((i) => {
        const color = colors[i * 5];
        return (
          <div style={s(c.bg(color), c.selfStretch, c.height(20))}></div>
        );
      })}
    </div>
  );
};
