import { c, s } from "~/utils/styles";

export const CMText = (props) => {
  return (
    <p
      class={props.class ?? ""}
      {...{
        props,
        style: s(
          {
            display: "inline",
            "list-style": "none",
            margin: "0px",
            padding: "0px",
            "text-align": "inherit",
            "text-decoration": "none",
            "white-space": "pre-wrap",
            "overflow-wrap": "break-word",
          },
          c.fontSize(14),
          c.weightRegular,
          c.fg(c.colors.textSecondary),
          props.style
        ),
      }}
    >
      {props.children}
    </p>
  );
};
