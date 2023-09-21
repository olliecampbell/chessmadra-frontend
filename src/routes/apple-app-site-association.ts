import { json } from "solid-start/api";

export function GET() {
	return json(
		{
			applinks: {
				apps: [],
				details: [
					{
						appID: "BQSAMWVPY2.com.chessbook.app",
						paths: ["*"],
					},
				],
			},
		},
	);
}
