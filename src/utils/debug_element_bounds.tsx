export const debugElementBounds = (name: string, opts) => {
	// return {};
	return {
		trackMutation: (fn) => {
			return () => {
				console.log(`${name} trackMutation`);
				fn();
			};
		},
		trackResize: (fn) => {
			return () => {
				console.log(`${name} trackResize`);
				fn();
			};
		},
		trackScroll: (fn) => {
			return () => {
				console.log(`${name} trackScroll`);
				fn();
			};
		},
	};
};
