import { PlaybackSpeed } from "~/types/PlaybackSpeed";

export const getPlaybackSpeedDescription = (ps: PlaybackSpeed) => {
	switch (ps) {
		case PlaybackSpeed.Slow:
			return "Slow";
		case PlaybackSpeed.Normal:
			return "Normal";
		case PlaybackSpeed.Fast:
			return "Fast";
		case PlaybackSpeed.Ludicrous:
			return "Ludicrous";
	}
};
