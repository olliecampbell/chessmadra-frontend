import { getAppState, quick } from "./app_state";
import { find, upperFirst } from "lodash-es";
import { ThemeSettings } from "~/components/SidebarSettings";
import { COMBINED_THEMES_BY_ID, combinedThemes } from "~/utils/theming";
import { getPlaybackSpeedDescription } from "./playback_speed";
import { SidebarAction } from "~/components/SidebarActions";
import { PlaybackSpeed } from "~/types/PlaybackSpeed";
import { SidebarSelectOneOf } from "~/components/SidebarSelectOneOf";
import { SidebarTemplate } from "~/components/SidebarTemplate";

export const createSharedTrainerSettingActions = () => {
	const userState = () => getAppState().userState;
	const playbackSpeed =
		getAppState().trainersState.visualizationState.playbackSpeedUserSetting;
	const themeId = () => userState().user?.theme;
	const theme = () =>
		find(combinedThemes, (theme) => theme.boardTheme === themeId()) ||
		COMBINED_THEMES_BY_ID.default;
	return [
		{
			onPress: () => {
				quick((s) => {
					s.trainersState.pushView(PlaypackSpeedSettings);
				});
			},
			text: "Playback speed",
			right: getPlaybackSpeedDescription(
				playbackSpeed.value ?? PlaybackSpeed.Normal,
			),
			style: "secondary",
		} as SidebarAction,
		{
			onPress: () => {
				quick((s) => {
					s.trainersState.pushView(ThemeSettings);
				});
			},
			text: "Board appearance",
			right: `${upperFirst(theme().name)}`,
			style: "secondary",
		} as SidebarAction,
	];
};

const PlaypackSpeedSettings = () => {
	const selected =
		getAppState().trainersState.visualizationState.playbackSpeedUserSetting;
	const onSelect = (t: PlaybackSpeed) => {
		quick((s) => {
			s.trainersState.visualizationState.playbackSpeedUserSetting.value = t;
		});
	};
	return (
		<SidebarTemplate actions={[]} header={"Coverage goal"}>
			<SidebarSelectOneOf
				description={"Set the playback speed of the visualization dot"}
				choices={[
					PlaybackSpeed.Slow,
					PlaybackSpeed.Normal,
					PlaybackSpeed.Fast,
					PlaybackSpeed.Ludicrous,
				]}
				// cellStyles={s(c.bg(c.gray[15]))}
				// horizontal={true}
				activeChoice={selected.value}
				onSelect={onSelect}
				renderChoice={(r: PlaybackSpeed, active: boolean) => {
					return (
						<div class="row items-end">
							<div>{getPlaybackSpeedDescription(r)}</div>
						</div>
					);
				}}
			/>
		</SidebarTemplate>
	);
};
