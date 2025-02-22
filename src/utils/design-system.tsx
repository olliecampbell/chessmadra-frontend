export const hsl = (h: number, s: number, l: number, a?: number) => {
	if (a) {
		return `hsla(${h}, ${s}%, ${l}%, ${a / 100})`;
	} else {
		return `hsl(${h}, ${s}%, ${l}%)`;
	}
};

const genShadesV2 = (
	hue: number,
	options?: { saturation?: number },
): Record<number, string> => {
	const shades: Record<number, string> = {};
	const distanceFromDarkestBlue = Math.abs((hue - 243) % 360);
	const maxDarkness = 10 - distanceFromDarkestBlue / 50;
	for (let i = 0; i <= 90; i = i + 5) {
		// const lightness = -1 * Math.pow((i / 100) - 0.5, 2) + 0.5
		const lightness = maxDarkness + (i / 90) * (90 - maxDarkness);
		const saturation = options?.saturation ?? 70;
		shades[i] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
	}
	return shades;
};

export const grayHue = 200;
const genGrays = (
	hue: number,
	minSat: number,
	maxSat: number,
): Record<number, string> => {
	const grays: Record<number, string> = {};
	for (let i = 0; i <= 100; i = i + 1) {
		const saturation = minSat + ((maxSat - minSat) * i) / 100;
		grays[i] = `hsl(${hue}, ${saturation}%, ${i}%)`;
	}
	return grays;
};
export const gray = genGrays(grayHue, 8, 5);

const blue = genShadesV2(198);
const teal = genShadesV2(180);
const primary = blue;
const yellow = genShadesV2(40, { saturation: 90 });
const orange = genShadesV2(24, { saturation: 80 });
const pink = genShadesV2(308);
const purple = genShadesV2(271);
const red = genShadesV2(350);
const green = genShadesV2(130, { saturation: 50 });
const success = genShadesV2(164);
const arrows = genShadesV2(40);

export const colors = {
	blue,
	teal,
	primary,
	yellow,
	orange,
	pink,
	red,
	gray,
	purple,
	green,
	success: "#459B45",
	successShades: success,
	text: {
		primary: gray[95],
		secondary: gray[80],
		tertiary: gray[50],
		inverse: gray[5],
		inverseSecondary: gray[20],
	},
	sidebarBorder: gray[25],
	border: gray[20],
	successColor: "hsl(164, 98%, 55%)",
	failureColor: "hsl(340, 70%, 52%)",
	failureLight: "hsl(348, 100%, 72%)",
	buttonSecondary: gray[80],
	backgroundColor: gray[10],
	debugColor: hsl(71, 100, 42),
	debugColorDark: hsl(71, 100, 28),
	components: {
		sidebar_button_primary: gray[22],
		sidebar_button_primary_hover: gray[32],
		arrows: arrows,
	},
};
