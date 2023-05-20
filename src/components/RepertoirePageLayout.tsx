// import { ExchangeRates } from "~/ExchangeRate";
import { useIsMobile } from "~/utils/isMobile";
import { quick, useRepertoireState, useAppState } from "~/utils/app_state";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { createEffect, Show } from "solid-js";
import { c, s } from "~/utils/styles";
import { Puff } from "solid-spinner";
import { LogoFull } from "./icons/LogoFull";
import { clsx } from "~/utils/classes";
import { AuthStatus } from "~/utils/user_state";
import { createDebugStateEffect } from "~/utils/debug_effect";

export const RepertoirePageLayout = (props: {
  children: any;
  bottom?: any;
  flushTop?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
  naked?: boolean;
  loading?: boolean;
}) => {
  const isMobile = useIsMobile();

  createDebugStateEffect();
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
          title: "Chessbook",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <div
        style={s(
          isMobile ? s(c.grow) : c.flexShrink(1),
          props.centered && c.grow,
          props.fullHeight && c.grow,
          props.loading && c.grow
        )}
      >
        <Show when={props.loading}>
          <div style={s(c.grow, c.center)}>
            <div class={clsx("w-40")}>
              <LogoFull />
            </div>
          </div>
        </Show>
        <Show when={!props.loading}>
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
      <Show when={!props.loading}>{props.bottom}</Show>
    </div>
  );
};
