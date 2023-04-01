import { c, s } from "~/utils/styles";
import { Spacer } from "~/components/Space";
import { useIsMobile } from "~/utils/isMobile";

export const TrainerLayout = ({
  chessboard,
  children,
  containerStyles,
}: any) => {
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "none",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      <div style={s(c.fullWidth, c.center, !isMobile && c.minWidth("100vw"))}>
        {chessboard ? (
          <>
            <div
              style={s(
                c.oldContainerStyles(isMobile),
                isMobile && s(c.alignCenter),
                isMobile ? c.column : s(c.row, c.alignCenter),
                containerStyles,
                c.justifyCenter
              )}
            >
              <div
                style={s(
                  c.width(500),
                  c.maxWidth("100%"),
                  c.cardShadow,
                  c.br(2),
                  c.overflowHidden
                )}
              >
                {chessboard}
              </div>
              <Spacer height={12} width={24} isMobile={isMobile} />
              <div
                style={s(
                  c.column,
                  c.width(400),
                  c.maxWidth("100%"),
                  isMobile && s(c.width(500))
                )}
              >
                {children}
              </div>
            </div>
          </>
        ) : (
          <>{children}</>
        )}
      </div>
    </div>
  );
};
