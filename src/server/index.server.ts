import {
	Players,
	ReplicatedStorage,
	Workspace,
} from '@rbxts/services';

import { $print } from 'rbxts-transform-debug';

import * as Types from 'shared/Types';
import * as Stages from './Stages';
import * as PlayerData from './PlayerData';
import { Constants } from 'shared/Constants';

const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;
const stagesFolder = Workspace.WaitForChild('Stages') as Folder;

for (const stageType of stagesFolder.GetChildren()) for (const stage of stageType.GetChildren()) stage.SetAttribute(Constants.Attributes.Stage.Status, 'Waiting');

Stages.init();

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