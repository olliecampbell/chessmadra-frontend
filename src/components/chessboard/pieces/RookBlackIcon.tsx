import { chessboardColors } from "app/styles";
import * as React from "react";
import Svg, { Path } from "react-native-svg";

function SvgComponent(props) {
  return (
    <Svg
      width="100%"
      height="100%"
      clipRule="evenodd"
      fillRule="evenodd"
      imageRendering="optimizeQuality"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
      viewBox="0 0 50 50"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <Path
        d="M17.932 20.414c4.906-.74 9.579-.578 14.136 0M14.183 9.662c-1.06 8.767 1.103 10.677 3.748 10.752l-3.315 18.159h20.767l-3.316-18.159c2.645-.074 4.808-1.985 3.749-10.752l-3.608-.53-1.073 3.644-3.142-.1-.522-3.754h-4.945l-.52 3.754-3.143.1-1.073-3.643z"
        fill={chessboardColors.blackFill}
        strokeWidth={chessboardColors.outlineWidth}
        stroke={chessboardColors.blackOutline}
      />
      <Path
        d="M17.932 20.414c6.828 0 13.118.408 14.948 16.572l2.319.386-3.131-16.428c-.032-.308-6.088-1.823-14.136-.53z"
        fill={chessboardColors.blackDarkAccent}
      />
      <Path
        d="M14.777 10.219l2.277-.286c-1.914.312-2.313 5.296-2.313 5.296-.238-.177-.188-4.903.036-5.01zM25.276 9.55c-1.648 0-2.52 2.748-2.52 2.748l.338-2.729zM32.671 9.816l.934.118c-.785.5-1.59 1.989-1.59 1.989zM18.472 20.964l2.62-.293c-2.62.293-4.895 13.053-4.906 13.113z"
        fill={chessboardColors.blackLightAccent}
        opacity={1.0}
      />
      <Path
        d="M34.013 9.398c.357 6.363-1.95 10.603-8.041 10.536l4.777.563c7.523.31 5.101-10.806 5.068-10.835z"
        fill={chessboardColors.blackDarkAccent}
      />
      <Path
        d="M25 36.457s-9.13.048-11.691 1.62c-1.727 1.06-2.135 3.65-1.9 6.323h27.182c.235-2.672-.172-5.264-1.9-6.324-2.56-1.57-11.69-1.619-11.69-1.619z"
        fill={chessboardColors.blackFill}
        strokeLinejoin="round"
        strokeWidth={chessboardColors.outlineWidth}
        stroke={chessboardColors.blackOutline}
      />
      <Path
        d="M25 37.146s-8.712-.137-11.624 1.666c-.37.229-.7.84-.954 1.39.261-.331.503-.613.887-.849C15.87 37.782 25 37.733 25 37.733s9.132.049 11.692 1.62c.391.24.592.532.856.87.025-.076-.409-1.158-1.144-1.596C33.648 37.135 25 37.147 25 37.147z"
        fill={chessboardColors.blackLightAccent}
        opacity={1.0}
      />
    </Svg>
  );
}

export default SvgComponent;
