// import { ExchangeRates } from "~/ExchangeRate";
import { useIsMobile } from "~/utils/isMobile";
import { quick, useRepertoireState } from "~/utils/app_state";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { createEffect, Show } from "solid-js";
import { GridLoader, Helmet } from "~/mocks";
import { c, s } from "~/utils/styles";
import { View } from "./View";
import { Spinner, SpinnerType } from "solid-spinner";

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
  const [repertoireLoading] = useRepertoireState((s) => [
    s.repertoire === undefined,
  ]);

  createEffect(() => {
    if (repertoireLoading()) {
      quick((s) => {
        s.repertoireState.initState();
      });
    }
  });
  const backgroundColor = c.grays[8];
  return (
    <div
      style={s(
        c.column,
        c.fullWidth,
        c.bg(backgroundColor),
        c.grow,
        s(c.minHeight("100vh"))
      )}
    >
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <div
        style={s(
          isMobile ? s(c.grow) : c.flexShrink(1),
          centered && c.grow,
          fullHeight && c.grow,
          repertoireLoading() && c.grow
        )}
      >
        <Show when={repertoireLoading()}>
          <div style={s(c.grow, c.center)}>
            <Spinner type={SpinnerType.puff} color={c.primaries[65]} />
          </div>
        </Show>
        <Show when={!repertoireLoading()}>
          <div
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
            <div
              style={s(
                !fullHeight && !naked && c.pb(isMobile ? 92 : 180),
                c.center,
                c.fullWidth,
                fullHeight && c.grow
              )}
            >
              {children}
            </div>
          </div>
        </Show>
      </div>
      <Show when={!repertoireLoading()}>{bottom}</Show>
    </div>
  );
};
