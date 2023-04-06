import { first, forEach, forEachRight } from "lodash-es";

export function getPawnOnlyEpd(epd: string) {
  const setup = first(epd.split(" "));
  const rows = setup.split("/");
  let newEpd = "";
  rows.forEach((row, i) => {
    let number = 0;
    const addNumberIfPresent = () => {
      if (number > 0) {
        newEpd = newEpd + number;
        number = 0;
      }
    };
    forEach(row, (char) => {
      if (char === "p" || char === "P") {
        addNumberIfPresent();
        newEpd = newEpd + char;
        return;
      }
      if (Number.isInteger(Number(char))) {
        number = number + Number(char);
        return;
      }
      number += 1;
    });
    addNumberIfPresent();
    if (i !== 7) {
      newEpd = newEpd + "/";
    }
  });
  return newEpd;
}

export function reversePawnEpd(epd: string) {
  const rows = epd.split("/");
  let newEpd = "";
  forEachRight(rows, (row, i) => {
    let number = 0;
    const addNumberIfPresent = () => {
      if (number > 0) {
        newEpd = newEpd + number;
        number = 0;
      }
    };
    forEach(row, (char) => {
      if (char === "p" || char === "P") {
        addNumberIfPresent();
        newEpd = newEpd + char;
        return;
      }
      if (Number.isInteger(Number(char))) {
        number = number + Number(char);
        return;
      }
      number += 1;
    });
    addNumberIfPresent();
    if (i !== 0) {
      newEpd = "/" + newEpd;
    }
  });
  return newEpd;
}
