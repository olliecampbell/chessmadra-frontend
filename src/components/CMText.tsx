import { c, s } from "~/utils/styles";

export const CMText = (props) => {
  let { children } = props;
  return (
    <p
      {...{
        props,
        style: s(
          {
            fontFamily: "Inter",
            // fontVariationSettings: '"wdth" 112.5',
          },
          c.weightRegular,
          c.fg(c.colors.textSecondary),
          props.style
        ),
      }}
    >
      {children}
    </p>
  );
};
