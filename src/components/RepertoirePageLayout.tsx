import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import { useRepertoireState } from "app/utils/app_state";
import React, { useEffect } from "react";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { BeatLoader } from "react-spinners";
import { Spacer } from "app/Space";

export const RepertoirePageLayout = ({
  children,
  bottom,
}: {
  children: any;
  bottom?: any;
}) => {
  const isMobile = useIsMobile();
  const [repertoireLoading, initState] = useRepertoireState((s) => [
    s.repertoire === undefined,
    s.initState,
  ]);
  useEffect(() => {
    if (repertoireLoading) {
      initState();
    }
  }, []);
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(c.grays[12]),
        c.grow,
        c.height("100vh"),
        c.keyedProp("minHeight")("-webkit-fill-available"),
        c.keyedProp("maxHeight")("-webkit-fill-available")
      )}
    >
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <View
        style={s(
          isMobile ? s(c.grow, c.scrollY, c.flexShrink(1)) : c.flexShrink(1)
        )}
      >
        <View
          style={s(
            c.fullWidth,
            c.height(72),
            // c.borderBottom(`2px solid ${c.grays[8]}`)
            c.bg(c.colors.cardBackground),
            c.lightCardShadow
            // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
          )}
        >
          <View
            style={s(
              c.containerStyles(isMobile),
              c.alignStart,
              c.justifyEnd,
              c.column,
              c.fullHeight,
              c.pb(16)
            )}
          >
            <RepertoireNavBreadcrumbs />
          </View>
        </View>
        <View
          style={s(
            !isMobile && s(c.scrollY),
            isMobile && s(c.grow),
            c.center,
            c.justifyStart,
            c.flexShrink(1),
            c.pt(isMobile ? 24 : 92)
          )}
        >
          {!repertoireLoading ? (
            <View style={s(c.pb(isMobile ? 92 : 128))}>{children}</View>
          ) : (
            <BeatLoader color={c.grays[100]} size={20} />
          )}
          {isMobile && <Spacer height={100} />}
        </View>
      </View>
      {bottom}
    </View>
  );
};

export const RepertoireNavBreadcrumbs = () => {
  const [breadcrumbs] = useRepertoireState((s) => [s.breadcrumbs]);
  return (
    <View style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth)}>
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
                <CMText
                  style={s(
                    breadcrumb.onPress ? c.weightHeavy : c.weightThin,
                    c.fg(c.colors.textPrimary)
                  )}
                >
                  {breadcrumb.text}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <View key={i} style={s(c.mx(12))}>
              <CMText style={s()}>
                <i className="fa-sharp fa-angle-right" />
              </CMText>
            </View>
          );
        }
      )}
    </View>
  );
};
