// import { ExchangeRates } from "~/ExchangeRate";
import { useIsMobile } from "~/utils/isMobile";
import { quick, useRepertoireState } from "~/utils/app_state";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { createEffect, Show } from "solid-js";
import { c, s } from "~/utils/styles";
import { Puff } from "solid-spinner";

export const RepertoirePageLayout = (props: {
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
          props.centered && c.grow,
          props.fullHeight && c.grow,
          repertoireLoading() && c.grow
        )}
      >
        <Show when={repertoireLoading()}>
          <div style={s(c.grow, c.center)}>
            <Puff color={c.primaries[65]} />
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
              props.fullHeight && s(c.grow),
              !props.flushTop && !props.naked && c.pt(isMobile ? 24 : 48),
              props.centered && s(c.grow, c.justifyCenter)
            )}
          >
            <div
              style={s(
                !props.fullHeight && !props.naked && c.pb(isMobile ? 92 : 180),
                c.center,
                c.fullWidth,
                props.fullHeight && c.grow
              )}
            >
              {props.children}
            </div>
          </div>
        </Show>
      </div>
      <Show when={!repertoireLoading()}>{props.bottom}</Show>
    </div>
  );
};
