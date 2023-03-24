// import { ExchangeRates } from "~/ExchangeRate";
import { useIsMobile } from "~/utils/isMobile";
import { useRepertoireState } from "~/utils/app_state";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { createEffect, Show } from "solid-js";
import { GridLoader, Helmet } from "~/mocks";
import { c, s } from "~/utils/styles";
import { View } from "./View";

export const RepertoirePageLayout = ({
  children,
  bottom,
  centered,
  fullHeight,
  flushTop,
  naked,
}: {
  children: any;
  bottom?: any;
  flushTop?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
  naked?: boolean;
}) => {
  const isMobile = useIsMobile();
  const repertoireState = useRepertoireState((s) => s);
  const repertoireLoading = () => repertoireState.repertoire === undefined;

  createEffect(() => {
    if (repertoireLoading()) {
      repertoireState.initState();
    }
  });
  const backgroundColor = c.grays[8];
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(backgroundColor),
        c.grow,
        s(c.minHeight("100vh"))
      )}
    >
      <Helmet>
        <meta name="theme-color" content={backgroundColor} />
      </Helmet>
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <View
        style={s(
          isMobile ? s(c.grow) : c.flexShrink(1),
          centered && c.grow,
          fullHeight && c.grow,
          repertoireLoading() && c.grow
        )}
      >
        <>
          <Show when={repertoireLoading()}>
            <View style={s(c.grow, c.center)}>
              <GridLoader color={c.purples[55]} size={20} />
            </View>
          </Show>
          <Show when={!repertoireLoading()}>
            <View
              style={s(
                !isMobile && s(c.overflowY("auto")),
                isMobile && s(c.grow),
                c.center,
                c.justifyStart,
                c.flexShrink(1),
                fullHeight && s(c.grow),
                !flushTop && !naked && c.pt(isMobile ? 24 : 48),
                centered && s(c.grow, c.justifyCenter)
              )}
            >
              <View
                style={s(
                  !fullHeight && !naked && c.pb(isMobile ? 92 : 180),
                  c.center,
                  c.fullWidth,
                  fullHeight && c.grow
                )}
              >
                {children}
              </View>
            </View>
          </Show>
        </>
      </View>
      <Show when={!repertoireLoading()}>{bottom}</Show>
    </View>
  );
};
