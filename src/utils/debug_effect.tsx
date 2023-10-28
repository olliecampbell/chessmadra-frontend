import { noop } from "lodash-es";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { quick, useAppState, useRepertoireState } from "~/utils/app_state";
import { AuthStatus } from "~/utils/user_state";
import { isDevelopment } from "./env";

const TEST_LINE = null; // "1.e4 h5 2.Nf3 Nc6 3.Bb5 a6 4.Bxc6 bxc6 5.d4 exd4 6.Qxd4 Nf6 7.Bg5 Be7";

export const createDebugStateEffect = () => {
	console.log("calling the debug effect thing");
	const [repertoire] = useRepertoireState((s) => [s.repertoire]);
	const repertoireLoading = () => repertoire() === undefined;
	const [authStatus] = useAppState((s) => [s.userState.authStatus]);
	const [hasCalled, setHasCalled] = createSignal(false);
	createEffect(() => {
		if (hasCalled() || !isDevelopment) {
			return;
		}
		if (repertoireLoading() || authStatus() !== AuthStatus.Authenticated) {
			return;
		}
		// setHasCalled(true);
		console.log("debug effect", repertoireLoading(), authStatus());

		if (!repertoireLoading() && authStatus() === AuthStatus.Authenticated) {
			setHasCalled(true);
			// Test move log, many moves
			quick((s) => {
				if (TEST_LINE) {
					s.repertoireState.startBrowsing("white", "build", {
						pgnToPlay: TEST_LINE,
					});
				}
			});

			quick((s) => {
				s.repertoireState.startBrowsing("white", "overview");
			});
			// quick((s) => {
			// 	const maybeNode = ChessboardArrowView({
			// 		faded: false,
			// 		fromSquare: "e2",
			// 		toSquare: "e4",
			// 		focused: true,
			// 		flipped: false,
			// 		color: "black",
			// 	});
			//
			// 	// s.repertoireState.browsingState.chessboard.addArrow(maybeNode);
			// 	//   console.log("setting past landing page");
			// 	//   s.userState.pastLandingPage = true;
			// 	//   s.repertoireState.onboarding.isOnboarding = false;
			// 	s.repertoireState.startBrowsing("white", "build", {
			// 		pgnToPlay: lineToPgn([
			// 			"d4",
			// 			"Nf6",
			// 			"c4",
			// 			"e6",
			// 			"Nc3",
			// 			"Bb4",
			// 			"Qc2",
			// 			"c5",
			// 		]),
			// 		// pgnToPlay: "1.e4 e5 2.Nf3 Bc5 3.Nxe5 Qh4",
			// 		animated: false,
			// 	});
			// });
			// quick((s) => {
			//   console.log("setting past landing page");
			//   s.userState.pastLandingPage = true;
			//   // s.repertoireState.ui.replaceView(ConnectChesscom, {});
			// });
			// quick((s) => {
			//   s.repertoireState.ui.replaceView(CoverageSettings, {});
			// });
			// quick((s) => {
			// 	setTimeout(() => {
			// 		s.repertoireState.reviewState.startReview({
			// 			side: "white",
			// 			filter: "all",
			// 		});
			// 		// while (
			// 		//   s.repertoireState.reviewState.currentQuizGroup &&
			// 		//   !Quiz.getPlans(s.repertoireState.reviewState.currentQuizGroup)
			// 		// ) {
			// 		//   s.repertoireState.reviewState.setupNextMove();
			// 		// }
			// 	});
			// });
			//   quick((s) => {
			//     s.repertoireState.startBrowsing("white", "build");
			//     s.repertoireState.browsingState.sidebarState.addedLineState = {
			//       visible: true,
			//       loading: true,
			//     };
			//   });
		}
		// setTimeout(() => {
		//   quick((s) => {
		//     s.repertoireState.startBrowsing("white", "build", {
		//       pgnToPlay: lineToPgn(["e4", "d5"]),
		//     });
		//   });
		// }, 100);
	});
	onCleanup(noop);
};
