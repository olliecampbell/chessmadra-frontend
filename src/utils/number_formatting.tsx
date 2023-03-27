const COUNT_FORMATS = [
  {
    // 0 - 999
    letter: "",
    long: "",
    limit: 3 * 1e3,
    divisor: 1,
  },
  {
    // 1,000 - 999,999
    letter: "k",
    long: "thousand",
    limit: 1e6,
    divisor: 1e3,
  },
  {
    // 1,000,000 - 999,999,999
    letter: "m",
    long: "million",
    limit: 1e10,
    divisor: 1e6,
  },
];

const getFormat = (x: number) => {
  for (const format of COUNT_FORMATS) {
    if (Math.abs(x) < format.limit) {
      return format;
    }
  }
};

function getStatMantissa(x: number, format: any): string {
  return (x / format.divisor).toFixed(0);
}

export const formatLargeNumber = (x: number, long?: boolean): string => {
  const format = getFormat(x);
  if (format) {
    if (long) {
      return `${getStatMantissa(x, format)} ${format.long}`.trim();
    } else {
      return `${getStatMantissa(x, format)}${format.letter}`;
    }
  } else {
    return `${x}`;
  }
};
