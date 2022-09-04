import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { times } from "lodash-es";
import { useIsMobile } from "app/utils/isMobile";
import { navItems, OPENINGS_DESCRIPTION } from "./NavBar";
import { chunked } from "app/utils/intersperse";
import { PageContainer } from "./PageContainer";
import { failOnTrue } from "app/utils/test_settings";
import { useHasBetaAccess } from "app/utils/useHasBetaAccess";
import { CMText } from "./CMText";
import { Link } from "react-router-dom";
import React from "react";
import { HeadSiteMeta } from "app/components/PageContainer";

export const Directory = () => {
  const isMobile = useIsMobile();
  const hasBetaAccess = useHasBetaAccess();
  return (
    <PageContainer hideNavBar>
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />

      {failOnTrue(false) && (
        <View style={s(c.row)}>
          <ColorSwatch colors={c.primaries} />
          <ColorSwatch colors={c.yellows} />
          <ColorSwatch colors={c.grays} />
        </View>
      )}
      <Spacer height={44} />
      <View style={s(c.containerStyles(isMobile), c.grow, c.justifyCenter)}>
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
        {chunked(
          navItems
            .filter((n) => !n.beta || hasBetaAccess)
            .map(({ path, title, description, beta, isNew }, i) => {
              return (
                <Link to={path}>
                  <View
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
                  >
                    {isNew && (
                      <View
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
                          className="fa-solid fa-party-horn"
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
                      </View>
                    )}
                    {beta && !isNew && (
                      <View
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
                      </View>
                    )}
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
                  </View>
                </Link>
              );
            }),
          (i) => {
            return <Spacer width={24} key={i} />;
          },
          isMobile ? 1 : 2,
          (i) => {
            return <Spacer height={24} key={i} />;
          },
          (children) => {
            return <View style={s(c.row, c.fullWidth)}>{children}</View>;
          }
        )}
      </View>
    </PageContainer>
  );
};

export const ColorSwatch = ({ colors }) => {
  return (
    <View style={s(c.column, c.width(100))}>
      {times(20).map((i) => {
        let color = colors[i * 5];
        return (
          <View style={s(c.bg(color), c.selfStretch, c.height(20))}></View>
        );
      })}
    </View>
  );
};
