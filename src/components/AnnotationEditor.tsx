// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { throttle } from "lodash-es";
import { CMText } from "./CMText";
import { Accessor, createSignal } from "solid-js";
import { FadeInOut } from "./FadeInOut";
import { clsx } from "~/utils/classes";

export const MAX_ANNOTATION_LENGTH = 300;

export const AnnotationEditor = (props: {
  annotation: Accessor<string>;
  onUpdate: (annotation: string) => void;
}) => {
  const [focus, setFocus] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [annotation, setAnnotation] = createSignal(props.annotation());
  // TODO: solid
  // const { fadeStyling } = useFadeAnimation(loading(), { duration: 300 });
  let lastTimer: number | null = null;
  const updateDebounced = throttle(
    (annotation: string) => {
      setLoading(true);
      props.onUpdate(annotation);
      if (lastTimer) {
        window.clearTimeout(lastTimer);
        lastTimer = null;
      }
      lastTimer = window.setTimeout(() => {
        setLoading(false);
      }, 400);
    },
    400,
    { leading: true }
  );
  return (
    <div style={s(c.grow, c.relative)}>
      <div
        style={s(
          c.absolute,
          c.bottom(12),
          c.zIndex(100),
          c.right(12),
          c.left(12),
          c.row,
          c.justifyBetween,
          c.opacity(focus() ? 100 : 0)
        )}
      >
        <FadeInOut open={loading}>
          <CMText style={s(c.fg(c.gray[50]))}>
            <i class="fas fa-circle-notch fa-spin" />
          </CMText>
        </FadeInOut>
        <CMText
          style={s(
            annotation()?.length > MAX_ANNOTATION_LENGTH && c.weightBold,
            c.fg(
              annotation()?.length > MAX_ANNOTATION_LENGTH
                ? c.red[60]
                : c.gray[50]
            )
          )}
        >
          {annotation()?.length ?? 0}/{MAX_ANNOTATION_LENGTH}
        </CMText>
      </div>
      <div style={s(c.bg(c.gray[20]), c.py(12), c.grow)}>
        <textarea
          value={annotation() ?? ""}
          style={s(
            {
              fontFamily: "Inter",
            },
            c.grow,
            c.border("none"),
            c.br(0),
            c.px(12),
            c.pb(24),
            c.bg(c.gray[20]),
            c.fg(c.gray[90]),
            c.keyedProp("resize")("none")
          )}
          class={clsx("placeholder-gray-50")}
          placeholder={'ex. "Intending Bg5 after d4"'}
          onFocus={() => {
            setFocus(true);
          }}
          onBlur={() => {
            setFocus(false);
          }}
          onChange={(e: any) => {
            setAnnotation(e.target.value);
            if (e.target.value.length < MAX_ANNOTATION_LENGTH) {
              updateDebounced(e.target.value);
            }
          }}
        />
      </div>
    </div>
  );
};
