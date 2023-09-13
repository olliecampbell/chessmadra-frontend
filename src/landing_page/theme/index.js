export default {
	defaultWidth: 1280,
	breakpoints: {
		sm: [
			{
				type: "max-width",
				value: 576,
			},
		],
		md: [
			{
				type: "max-width",
				value: 768,
			},
		],
		lg: [
			{
				type: "max-width",
				value: "500",
			},
		],
	},
	color: {
		dark: "#101213",
		darkL1: "#0E1317",
		darkL2: "#191E22",
		grey: "rgb(119, 130, 136)",
		greyD1: "#637897",
		greyD2: "#586D8E",
		light: "#F7FBFF",
		lightD1: "#c6c6c6",
		lightD2: "#E4E8EC",
		green: "#00875A",
		primary: "#576366",
		secondary: "#f5a300",
		orange: "#FF7C22",
		red: "#DE350B",
		purple: "#FD6DF9",
		indigo: "#9B6CFC",
		twitterBlue: "#1d9bf0",
		darkMobile: "#202426",
	},
	fontFamily: {
		sans: "-apple-system, system-ui, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
		sansHeavy:
			"Impact, Haettenschweiler, 'Franklin Gothic Bold', Charcoal, 'Helvetica Inserat', 'Bitstream Vera Sans Bold', 'Arial Black', sans-serif",
		sansHelvetica:
			"Frutiger, 'Frutiger Linotype', Univers, Calibri, 'Gill Sans', 'Gill Sans MT', 'Myriad Pro', Myriad, 'DejaVu Sans Condensed', 'Liberation Sans', 'Nimbus Sans L', Tahoma, Geneva, 'Helvetica Neue', Helvetica, Arial, sans-serif",
		sansVerdana:
			"Corbel, 'Lucida Grande', 'Lucida Sans Unicode', 'DejaVu Sans', 'Bitstream Vera Sans', 'Liberation Sans', Verdana, 'Verdana Ref', sans-serif",
		sansTrebuchet:
			"'Segoe UI', Candara, 'Bitstream Vera Sans', 'DejaVu Sans', 'Trebuchet MS', Verdana, 'Verdana Ref', sans-serif",
		mono: "Consolas, 'Andale Mono WT', 'Andale Mono', 'Lucida Console', 'Lucida Sans Typewriter', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Liberation Mono', 'Nimbus Mono L', Monaco, 'Courier New', Courier, monospace",
		serifTimes:
			"Cambria, 'Hoefler Text', Utopia, 'Liberation Serif', 'Nimbus Roman No9 L Regular', Times, 'Times New Roman', serif",
		serifGeorgia:
			"Constantia, 'Lucida Bright', Lucidabright, 'Lucida Serif', Lucida, 'DejaVu Serif', 'Bitstream Vera Serif', 'Liberation Serif', Georgia, serif",
		serifGaramond:
			"'Palatino Linotype', Palatino, Palladio, 'URW Palladio L', 'Book Antiqua', Baskerville, 'Bookman Old Style', 'Bitstream Charter', 'Nimbus Roman No9 L', Garamond, 'Apple Garamond', 'ITC Garamond Narrow', 'New Century Schoolbook', 'Century Schoolbook', 'Century Schoolbook L', Georgia, serif",
		googleInter: '"Inter", sans-serif',
	},
	font: {
		headline1: "normal 700 56px/1.2 --fontFamily-googleInter",
		headline2: "normal 700 32px/1.2 --fontFamily-googleInter",
		headline3: "normal 400 20px/1.2 --fontFamily-googleInter",
		base: "normal 300 16px/1.5 --fontFamily-googleInter",
		lead: "normal 300 18px/1.5 --fontFamily-googleInter",
		headline1Md: "normal 700 42px/1.2 --fontFamily-googleInter",
		headline1Sm: "normal 700 32px/1.2 --fontFamily-googleInter",
		headline2Md: "700 24px --fontFamily-googleInter",
		headline2Sm: "normal 700 20px/1.2 --fontFamily-googleInter",
		headline3Md: "normal 400 16px/1.2 --fontFamily-googleInter",
		headline3Sm: "normal 400 14px/1.2 --fontFamily-googleInter",
		baseMd: "normal 300 12px/1.5 --fontFamily-googleInter",
		baseSm: "normal 300 8px/1.5 --fontFamily-googleInter",
		leadMd: "normal 300 14px/1.5 --fontFamily-googleInter",
		leadSm: "normal 300 14px/1.5 --fontFamily-googleInter",
		small: "300 .8em --fontFamily-googleInter",
		smallMd: "300 .6em --fontFamily-googleInter",
		smallSm: "300 .4em --fontFamily-googleInter",
	},
	boxShadow: {
		m: "0 4px 5px -1px rgba(0, 0, 0, 0.1)",
		l: "0 10px 15px rgba(0, 0, 0, 0.1)",
		xl: "0 10px 30px rgba(0, 0, 0, 0.5)",
		xxl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
	},
	background: {
		primaryGradient:
			"linear-gradient(180deg,--color-dark 0%,transparent 100%) 0 0 no-repeat",
		secondaryGradient:
			"linear-gradient(180deg, --color-secondary, transparent) no-repeat 0 0",
		sidebar: "#212526",
		sidebarDarker: "#191C1D",
		chessbookGreen: "#459345",
		chessbookBlack: "#101213",
		chessbookGradient:
			"radial-gradient(circle at center,#ffffff 0%,rgba(255, 255, 255, 0) 100%)",
		orange: "#ff7c22",
	},
	transform: {
		rotate90: "rotate(90deg)",
		rotate180: "rotate(180deg)",
		flipX: "scaleX(-1)",
		flipY: "scaleY(-1)",
	},
	transition: {
		opacityOut:
			"opacity --transitionDuration-normal --transitionTimingFunction-easeOut",
		transformOut:
			"transform --transitionDuration-normal --transitionTimingFunction-easeOut",
		transformInOut:
			"transform --transitionDuration-normal --transitionTimingFunction-easeInOut",
	},
	transitionTimingFunction: {
		easeIn: "cubic-bezier(0.4, 0, 1, 1)",
		easeOut: "cubic-bezier(0, 0, 0.2, 1)",
		easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
		sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
	},
	transitionDuration: {
		fastest: "0.1s",
		fast: "0.2s",
		normal: "0.3s",
	},
	filter: {
		grayscale: "grayscale(100%)",
		invert: "invert(100%)",
		blur: "blur(10px)",
		dropShadow: "drop-shadow(0px 10px 30px rgba(0, 0, 0, 0.5))",
	},
	animation: {},
	keyframes: {
		fadeIn: [
			{
				key: "from",
				props: [
					{
						opacity: 0,
					},
				],
			},
			{
				key: "to",
				props: [
					{
						opacity: 1,
					},
				],
			},
		],
		fadeOut: [
			{
				key: "from",
				props: [
					{
						opacity: 1,
					},
				],
			},
			{
				key: "to",
				props: [
					{
						opacity: 0,
					},
				],
			},
		],
	},
	components: {
		section: {
			maxWidth: {
				default: "1280px",
			},
			minWidth: {
				default: "300px",
			},
			width: {
				default: "90%",
			},
		},
		stack: {
			gap: {
				default: "32px",
				small: "16px",
			},
		},
	},
	fonts: {
		Inter: {
			family: "Inter",
			type: "google-fonts",
			meta: {
				category: "sans-serif",
				variants: [
					"100",
					"200",
					"300",
					"regular",
					"500",
					"600",
					"700",
					"800",
					"900",
				],
			},
		},
	},
	version: 149,
};
