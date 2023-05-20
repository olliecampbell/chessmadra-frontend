import { s, c } from "~/utils/styles";
import { isNil } from "lodash-es";
import { CMText } from "./CMText";

export const SelectRange = ({
  min,
  max,
  range,
  step,
  onChange,
  formatter,
  onFinish,
}: {
  min: number;
  max: number;
  range: [number, number];
  step: number;
  formatter?: (_: number) => string;
  onChange: (_: [number, number]) => void;
  onFinish: () => void;
}) => {
  const values = [range[0], isNil(range[1]) ? max : range[1]];
  console.log("values", values);
  return (
    <div style={s(c.px(12), c.py(16))}>
      <Range
        values={values}
        step={step}
        min={min}
        max={max}
        onFinalChange={onFinish}
        onChange={(values) => {
          console.log("values", values);
          if (values[1] === max) {
            values[1] = null;
          }
          console.log("values", values);
          onChange([values[0], values[1]]);
        }}
        renderTrack={({ props, children }) => (
          <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: "36px",
              display: "flex",
              width: "100%",
            }}
          >
            <div
              ref={props.ref}
              style={{
                height: "2px",
                width: "100%",
                borderRadius: "1px",
                background: getTrackBackground({
                  values,
                  colors: [c.grays[50], c.primaries[70], c.grays[50]],
                  min: min,
                  max: max,
                }),
                alignSelf: "center",
              }}
            >
              {children}
            </div>
          </div>
        )}
        renderThumb={({ props, isDragged, index }) => {
          let formatted = formatter ? formatter(values[index]) : values[index];
          if (values[index] === max) {
            console.log("Adding plus sign");
            formatted = `${formatted}+`;
          }
          return (
            <div
              {...props}
              style={s(
                {
                  ...props.style,
                  height: "24px",
                  width: "16px",

                  backgroundColor: c.grays[80],
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                },
                c.br(2)
              )}
            >
              <div style={s(c.absolute, c.top(-20))}>
                <CMText
                  style={s(
                    c.fg(c.colors.textSecondary),
                    c.weightBold,
                    c.fontSize(14)
                  )}
                >
                  {formatted}
                </CMText>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
};
