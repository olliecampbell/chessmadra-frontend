import { View } from "react-native";
import React from "react";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { useIsMobile } from "app/utils/isMobile";

export const TrainerLayout = ({
  chessboard,
  children,
  containerStyles,
}: any) => {
  const isMobile = useIsMobile();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: "none",
        maxWidth: "100%",
        width: "100%",
      }}
    >
      <View style={s(c.fullWidth, c.center, !isMobile && c.minWidth("100vw"))}>
        {chessboard ? (
          <>
            <View
              style={s(
                c.oldContainerStyles(isMobile),
                isMobile && s(c.alignCenter),
                isMobile ? c.column : s(c.row, c.alignCenter),
                containerStyles,
                c.justifyCenter
              )}
            >
              <View
                style={s(
                  c.width(500),
                  c.maxWidth("100%"),
                  c.cardShadow,
                  c.br(2),
                  c.overflowHidden
                )}
              >
                {chessboard}
              </View>
              <Spacer height={12} width={24} isMobile={isMobile} />
              <View
                style={s(
                  c.column,
                  c.width(400),
                  c.maxWidth("100%"),
                  isMobile && s(c.width(500))
                )}
              >
                {children}
              </View>
            </View>
          </>
        ) : (
          <>{children}</>
        )}
      </View>
    </View>
  );
};
