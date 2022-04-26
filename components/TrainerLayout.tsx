import {
  Text,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  Modal,
} from "react-native";
import React from "react";
import { c, s } from "app/styles";
import { Spacer } from "app/Space";
import { NavBar } from "app/components/NavBar";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "../utils/intersperse";
import { PageContainer } from "./PageContainer";

export const TrainerLayout = ({ chessboard, children }: any) => {
  const isMobile = useIsMobile();
  return (
    <PageContainer>
      <View
        style={{
          flex: 1,
          justifyContent: "flex-start",
          alignItems: "center",
          backgroundColor: "none",
        }}
      >
        <View
          style={s(
            c.fullWidth,
            !isMobile && c.center,
            !isMobile && c.minWidth("100vw"),
            !isMobile && c.my(48),
            isMobile && c.px(10),
            isMobile && c.pt(10)
          )}
        >
          {chessboard ? (
            <>
              <View
                style={s(
                  isMobile && s(c.alignCenter),
                  isMobile ? c.column : s(c.row, c.alignCenter)
                )}
              >
                <View style={s(c.width(500), c.maxWidth("100%"))}>
                  {chessboard}
                </View>
                <Spacer height={12} width={24} isMobile={isMobile} />
                <View
                  style={s(
                    c.column,
                    c.width(400),
                    c.maxWidth("100%"),
                    isMobile && s(c.fullWidth, c.width(500))
                  )}
                >
                  {children}
                </View>
              </View>
            </>
          ) : (
            <View style={s()}>{children}</View>
          )}
        </View>
      </View>
    </PageContainer>
  );
};
