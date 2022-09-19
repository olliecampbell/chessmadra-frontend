import { Pressable, View } from "react-native";
// import { ExchangeRates } from "app/ExchangeRate";
import { c, s } from "app/styles";
import { useIsMobile } from "app/utils/isMobile";
import { intersperse } from "app/utils/intersperse";
const DEPTH_CUTOFF = 4;
import { CMText } from "./CMText";
import {
  getAppState,
  useAppState,
  useRepertoireState,
} from "app/utils/app_state";
import React, { useEffect, useRef, useState } from "react";
import { HeadSiteMeta } from "./PageContainer";
import { OPENINGS_DESCRIPTION } from "./NavBar";
import { BeatLoader } from "react-spinners";
import { Spacer } from "app/Space";
import { Helmet } from "react-helmet";
import useIntersectionObserver from "app/utils/useIntersectionObserver";
import { DeleteMoveConfirmationModal } from "./DeleteMoveConfirmationModal";
import { useResponsive } from "app/utils/useResponsive";
import { SelectOneOf } from "./SelectOneOf";
import { useOutsideClick } from "app/components/useOutsideClick";

export const RepertoirePageLayout = ({
  children,
  bottom,
}: {
  children: any;
  bottom?: any;
}) => {
  const isMobile = useIsMobile();
  const [repertoireLoading, initState] = useRepertoireState((s) => [
    s.repertoire === undefined,
    s.initState,
  ]);

  useEffect(() => {
    if (repertoireLoading) {
      initState();
    }
  }, []);
  const backgroundColor = c.grays[12];
  const [user, ratingDescription] = useAppState((s) => [
    s.userState.user,
    s.userState.getUserRatingDescription(),
  ]);
  const navColor = c.colors.cardBackground;
  const responsive = useResponsive();
  return (
    <View
      style={s(
        c.column,
        c.fullWidth,
        c.bg(backgroundColor),
        c.grow,
        !isMobile &&
          s(
            c.height("100vh"),
            c.keyedProp("minHeight")("-webkit-fill-available"),
            c.keyedProp("maxHeight")("-webkit-fill-available")
          )
      )}
    >
      <Helmet>
        <meta name="theme-color" content={backgroundColor} />
      </Helmet>
      <DeleteMoveConfirmationModal />
      <HeadSiteMeta
        siteMeta={{
          title: "Opening Builder",
          description: OPENINGS_DESCRIPTION,
        }}
      />
      <View style={s(isMobile ? s(c.grow) : c.flexShrink(1))}>
        <View
          style={s(
            c.fullWidth,
            c.height(64),
            // c.borderBottom(`2px solid ${c.grays[8]}`)
            c.bg(navColor),
            c.lightCardShadow,
            c.zIndex(10)
            // c.shadow(0, 0, 40, 0, "hsla(0, 0%, 0%, 20%)")
          )}
        >
          <View
            style={s(
              c.containerStyles(responsive.bp),
              c.alignEnd,
              c.justifyBetween,
              c.row,
              c.fullHeight,
              c.pb(16)
            )}
          >
            <RepertoireNavBreadcrumbs />
            <Spacer width={12} />
            <NavDropdown title={ratingDescription}>
              <View style={s(c.row)}>
                <NavDropdownSelector
                  options={["Lichess", "Chess.com", "FIDE", "USCF"]}
                  title={"Rating system"}
                  onSelect={(x: string) => {
                    getAppState().userState.setRatingSystem(x);
                  }}
                  selected={user?.ratingSystem || "Lichess"}
                />
                <Spacer width={24} />
                <NavDropdownSelector
                  options={[
                    "0-1100",
                    "1100-1300",
                    "1300-1500",
                    "1500-1700",
                    "1700-1900",
                    "1900+",
                  ]}
                  title={"Rating range"}
                  onSelect={(x: string) => {
                    getAppState().userState.setRatingRange(x);
                  }}
                  selected={user?.ratingRange || "Lichess"}
                />
              </View>
            </NavDropdown>
          </View>
        </View>
        <View
          style={s(
            !isMobile && s(c.scrollY),
            isMobile && s(c.grow),
            c.center,
            c.justifyStart,
            c.flexShrink(1),
            c.pt(isMobile ? 24 : 48)
          )}
        >
          {!repertoireLoading ? (
            <View style={s(c.pb(isMobile ? 92 : 128))}>{children}</View>
          ) : (
            <BeatLoader color={c.grays[100]} size={20} />
          )}
          {isMobile && <Spacer height={100} />}
        </View>
      </View>
      {bottom}
    </View>
  );
};

export const NavDropdown = ({ children, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useOutsideClick(ref, (e) => {
    if (isOpen) {
      setIsOpen(false);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });
  return (
    <Pressable
      ref={ref}
      style={s(c.row, c.alignCenter)}
      onPress={() => {
        setIsOpen(!isOpen);
      }}
    >
      <CMText style={s(c.weightSemiBold)}>{title}</CMText>
      <Spacer width={4} />
      <i
        className="fas fa-angle-down"
        style={s(c.fontSize(14), c.fg(c.grays[60]))}
      />
      <View
        style={s(
          c.absolute,
          !isOpen && s(c.opacity(0), c.noPointerEvents),
          c.zIndex(4),
          c.top("calc(100% + 8px)"),
          c.right(0),
          c.bg(c.grays[90]),
          c.br(4),
          c.cardShadow,
          c.px(12),
          c.py(12),
          c.minWidth(300)
        )}
      >
        {children}
      </View>
    </Pressable>
  );
};

export const NavDropdownSelector = ({
  options,
  onSelect,
  title,
  selected,
}: {
  options: string[];
  title: string;
  onSelect: (x: string) => void;
  selected: string;
}) => {
  return (
    <View style={s(c.column, c.alignStart)}>
      <CMText
        style={s(c.fontSize(18), c.weightHeavy, c.fg(c.colors.textInverse))}
      >
        {title}
      </CMText>
      <Spacer height={12} />
      <SelectOneOf
        containerStyles={s(c.fullWidth)}
        choices={options}
        // cellStyles={s(c.bg(c.grays[15]))}
        // horizontal={true}
        activeChoice={selected}
        onSelect={onSelect}
        separator={() => {
          return <Spacer height={0} />;
        }}
        renderChoice={(r: string, active: boolean, i: number) => {
          return (
            <Pressable
              key={i}
              style={s(c.selfStretch)}
              onPress={() => {
                onSelect(r);
              }}
            >
              <View
                style={s(
                  c.py(6),
                  c.px(8),
                  c.column,
                  active && c.bg(c.grays[80])
                )}
              >
                <CMText
                  style={s(
                    c.fg(
                      active
                        ? c.colors.textInverse
                        : c.colors.textInverseSecondary
                    ),
                    !active ? c.weightSemiBold : c.weightHeavy
                  )}
                >
                  {r}
                </CMText>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

export const RepertoireNavBreadcrumbs = () => {
  const [breadcrumbs] = useRepertoireState((s) => [s.breadcrumbs]);
  return (
    <View style={s(c.row, c.alignCenter, c.scrollX, c.constrainWidth)}>
      {intersperse(
        breadcrumbs.map((breadcrumb, i) => {
          return (
            <Pressable
              key={`breadcrumb-${i}`}
              style={s(breadcrumb.onPress ? c.clickable : c.unclickable)}
              onPress={() => {
                breadcrumb.onPress?.();
              }}
            >
              <View style={s()}>
                <CMText
                  style={s(
                    breadcrumb.onPress ? c.weightHeavy : c.weightThin,
                    c.fg(c.colors.textPrimary)
                  )}
                >
                  {breadcrumb.text}
                </CMText>
              </View>
            </Pressable>
          );
        }),
        (i) => {
          return (
            <View key={i} style={s(c.mx(12))}>
              <CMText style={s(c.fg(c.colors.textSecondary))}>
                <i className="fa-sharp fa-angle-right" />
              </CMText>
            </View>
          );
        }
      )}
    </View>
  );
};
