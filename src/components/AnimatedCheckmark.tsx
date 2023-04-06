import { s, c } from "~/utils/styles";

export const AnimatedCheckmark = () => {
  return (
    <svg
      class="checkmark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      style={s(c.fullWidth, c.fullHeight)}
    >
      <circle
        class="checkmark__circle"
        style={s()}
        strokeWidth={2}
        strokeMiterlimit={10}
        stroke={c.purples[55]}
        cx="26"
        cy="26"
        r="25"
        fill={c.purples[55]}
      />
      <path
        class="checkmark__check"
        fill="none"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
        stroke={c.grays[100]}
        strokeWidth={2}
      />
    </svg>
  );
};
