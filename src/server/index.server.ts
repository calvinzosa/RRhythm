import {
	Players,
	ReplicatedStorage,
	Workspace,
} from '@rbxts/services';

import { $print } from 'rbxts-transform-debug';

import * as Types from 'shared/Types';
import { Constants } from 'shared/Constants';
import * as MarkdownParser from 'shared/MarkdownParser';

import * as Stages from './Stages';
import * as PlayerData from './PlayerData';
import * as ChangelogLoader from './ChangelogLoader';

const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;
const stagesFolder = Workspace.WaitForChild('Stages') as Folder;

for (const stageType of stagesFolder.GetChildren()) for (const stage of stageType.GetChildren()) stage.SetAttribute(Constants.Attributes.Stage.Status, 'Waiting');

Stages.init();
task.spawn(ChangelogLoader.init);

for (const player of Players.GetPlayers()) {
	PlayerData.initPlayer(player);
}

Players.PlayerAdded.Connect((player) => PlayerData.initPlayer(player));

Players.PlayerRemoving.Connect((player) => {
	const profile = PlayerData.LoadedProfiles.get(player);
	if (profile !== undefined) profile.Release();
});

eventsFolder.JoinStage.OnServerEvent.Connect((player, stage, playerNumber) => {
	if (!typeIs(stage, 'Instance') || !stage.IsA('Model') || stage.Parent?.Parent !== stagesFolder) return;
	if (!typeIs(playerNumber, 'number') || (playerNumber !== 1 && playerNumber !== 2)) return;
	
	const character = player.Character;
	const rootPart = character?.FindFirstChild('HumanoidRootPart') as Part | undefined;
	const rootAttachment = rootPart?.FindFirstChild('RootAttachment') as Attachment | undefined;
	if (!character || !rootPart || !rootAttachment) return;
	
	if (stage.GetAttribute(Constants.Attributes.Stage.Status) !== 'Waiting') return;
	
	$print(`Attaching ${player.Name} to '${stage.Parent.Name}' stage as Player${playerNumber}`);
	
	Stages.attachPlayer(player, character, rootPart, rootAttachment, playerNumber, stage as Types.StageModel);
	Stages.updateStage(stage as Types.StageModel);
});

eventsFolder.ChooseSong.OnServerInvoke = (player, song) => {
	if ((song !== '<None>' && song !== '<Exit>') && (!typeIs(song, 'Instance') || !song.IsA('ModuleScript'))) return false;
	
	const didSet = Stages.selectSong(player, song);
	if (didSet) return 'selected';
	
	return false;
}

eventsFolder.UpdateSettings.OnServerInvoke = (player, settingName, settingValue) => {
	if (!typeIs(settingName, 'string')) return undefined;
	
	const profile = PlayerData.LoadedProfiles.get(player);
	if (!profile) return undefined;
	
	if (!(settingName in profile.Data.PlayerSettings)) return undefined;
	
	const name = settingName as keyof Types.PlayerSettings;
	let value = profile.Data.PlayerSettings[name];
	const settingData = Types.PlayerSettingTypes[name];
	
	if (settingData.Type === 'int') {
		if (!typeIs(settingValue, 'string')) return undefined;
		
		value = math.round(tonumber(settingValue) ?? tonumber(settingValue.gsub('[^%d]', '')) ?? value);
		
		if (typeIs(value, 'number')) {
			if (settingData.Min !== undefined && value < settingData.Min) value = settingData.Min;
			else if (settingData.Max !== undefined && value > settingData.Max) value = settingData.Max;
		}
	} else return undefined;
	
	profile.Data.PlayerSettings[name] = value;
	
	return value;
}