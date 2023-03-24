
// import { ExchangeRates } from "~/ExchangeRate";
import { c, s } from "~/utils/styles";
import { StockfishReport } from "~/utils/models";

export const StockfishEvalCircle = ({
  stockfish,
}: {
  stockfish: StockfishReport;
}) => {
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth;
  const circumference = normalizedRadius * 2 * Math.PI;

  const progress = 30;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const inverseStrokeDashoffset = (progress / 100) * circumference;

  return (
    <svg
      height="100%"
      width="100%"
      viewBox="0 0 100 100"
      style={s(c.rotate(-90), c.absoluteFull)}
    >
      <circle
        stroke="#eee"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        radius={`${progress}%`}
        style={s({ strokeDashoffset: inverseStrokeDashoffset })}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={c.grays[8]}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        radius={`${100 - progress}%`}
        style={s({ strokeDashoffset })}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
};
