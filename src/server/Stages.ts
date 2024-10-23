import {
	HttpService,
	Players,
	ReplicatedStorage,
	Workspace,
} from '@rbxts/services';

import { $print, $warn } from 'rbxts-transform-debug';

import LZWCompression from 'shared/LZWCompression';
import { Attributes } from 'shared/Constants';
import * as Types from 'shared/Types';

const Compression = new LZWCompression();

const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;
	
const selectedPlayerSongs = new Map<Player, ModuleScript | '<None>' | '<Exit>'>();

const activePreviews = new Map<Player, {
	preview: Types.StagePreview,
	module: ModuleScript,
	totalScore: number,
	accuracy: number,
	notesMisses: number,
	noteCombo: number,
}>();

const activeSongs = new Map<Player, Types.Chart>();

export function attachPlayer(player: Player, character: Model, rootPart: Part, rootAttachment: Attachment, playerNumber: number, stage: Types.StageModel) {
	if (stage.GetAttribute(Attributes.Stage.Status) !== 'Waiting') return;
	
	const stagePlayer = stage.FindFirstChild(`Player${playerNumber}`) as (Types.StagePlayer | undefined);
	if (!stagePlayer) return;
	
	if (character.GetAttribute(Attributes.Character.IsAttachedStage) === undefined) {
		stagePlayer.Trigger.Enabled = false;
		stagePlayer.RigidConstraint.Attachment1 = rootAttachment;
		stagePlayer.Character.Value = character;
		
		player.Character?.SetAttribute(Attributes.Character.StagePlayerNumber, playerNumber);
		character.SetAttribute(Attributes.Character.IsAttachedStage, true);
	} else {
		stagePlayer.Trigger.Enabled = true;
		stagePlayer.RigidConstraint.Attachment1 = undefined;
		stagePlayer.Character.Value = undefined;
		
		player.Character?.SetAttribute(Attributes.Character.StagePlayerNumber, undefined);
		character.SetAttribute(Attributes.Character.IsAttachedStage, undefined);
	}
}

export function selectSong(player: Player, song: ModuleScript | '<None>' | '<Exit>') {
	$print(`${player.Name} selected '${song}'`);
	selectedPlayerSongs.set(player, song);
	return true;
}

export function updateStage(stage: Types.StageModel) {
	const players: Player[] = [];
	
	if (stage.Parent?.Name === '1Player') {
		const character1 = (stage.FindFirstChild('Player1')?.FindFirstChild('Character') as ObjectValue | undefined)?.Value as Model | undefined;
		const character2 = (stage.FindFirstChild('Player2')?.FindFirstChild('Character') as ObjectValue | undefined)?.Value as Model | undefined;
		
		if (character1 !== undefined) {
			const player = Players.GetPlayerFromCharacter(character1);
			if (player && !players.includes(player)) players.push(player);
		} else if (character2 !== undefined) {
			const player = Players.GetPlayerFromCharacter(character2);
			if (player && !players.includes(player)) players.push(player);
		}
	}
	
	if (players.size() === 0) return $print('no players');
	
	stage.SetAttribute(Attributes.Stage.Status, 'Choosing');
	
	for (const player of players) eventsFolder.StartSongSelection.FireClient(player);
	
	while (true) {
		task.wait(0.5);
		
		let hasAllChosen = true;
		
		for (const player of players) {
			if (!selectedPlayerSongs.has(player)) {
				hasAllChosen = false;
				break;
			}
		}
		
		if (hasAllChosen) break;
	}
	
	const availableSongs: ModuleScript[] = [];
	
	for (const player of players) {
		const song = selectedPlayerSongs.get(player);
		
		if (song === '<Exit>') {
			$print('Exiting stage');
			
			stage.SetAttribute(Attributes.Stage.Status, 'Waiting');
			
			for (const otherPlayer of players) {
				selectedPlayerSongs.delete(otherPlayer);
				
				const character = otherPlayer.Character;
				const rootPart = character?.FindFirstChild('HumanoidRootPart') as Part | undefined;
				const rootAttachment = rootPart?.FindFirstChild('RootAttachment') as Attachment | undefined;
				if (character && rootPart && rootAttachment && character.GetAttribute(Attributes.Character.IsAttachedStage) === true) {
					attachPlayer(
						otherPlayer,
						character,
						rootPart,
						rootAttachment,
						character.GetAttribute(Attributes.Character.StagePlayerNumber) as (number | undefined) ?? 1,
						stage
					);
					
					$print(`De-attached ${otherPlayer.Name}`);
				}
				
				activeSongs.delete(player);
				activePreviews.delete(player);
				
				eventsFolder.EndSongSelection.FireClient(otherPlayer);
			}
			
			return;
		}
		
		if (song !== undefined && song !== '<None>') availableSongs.push(song);
		
		selectedPlayerSongs.delete(player);
	}
	
	let chosenSong: ModuleScript | undefined = undefined;
	
	if (availableSongs.size() > 0) chosenSong = availableSongs[math.random(players.size()) - 1];
	else chosenSong = undefined;
	
	if (chosenSong !== undefined) {
		const chart = (require(chosenSong) as { default: Types.Chart }).default;
		
		stage.SongInfo.SurfaceGui.TextLabel.Text = `${chart.metadata.title} by ${chart.metadata.artist} // ${chart.metadata.mappers.join(', ')}`;
		
		for (const player of players) {
			const character = player.Character;
			if (!character) continue;
			
			const playerNumber = character.GetAttribute(Attributes.Character.StagePlayerNumber) as number | undefined ?? 1;
			const preview = stage.FindFirstChild(`Preview${playerNumber}`) as Types.StagePreview | undefined;
			if (preview !== undefined) {
				eventsFolder.StartStagePreview.FireAllClients(preview);
				preview.SetAttribute(Attributes.StagePreview.IsOngoing, true);
				
				activeSongs.set(player, chart);
				
				activePreviews.set(player, {
					preview: preview,
					module: chosenSong,
					totalScore: 0,
					accuracy: 0 / 0,
					notesMisses: 0,
					noteCombo: 0,
				});
			}
		}
		
		task.wait(1.5);
		
		let length = 0;
		
		for (const note of chart.notes) {
			if (note.millisecond > length) length = note.millisecond;
		}
		
		length += 6000;
		
		stage.SetAttribute(Attributes.Stage.Status, 'Playing');
		
		for (const player of players) eventsFolder.StageStartSong.FireClient(player, chosenSong, stage);
		
		const startTime = os.clock();
		let currentTime = startTime;
		
		while ((currentTime - startTime) * 1000 < length) {
			task.wait(0.5);
			
			currentTime = os.clock();
		}
	} else for (const player of players) eventsFolder.EndSongSelection.FireClient(player);
	
	$print(`Cleaning up '${stage.Parent?.Name}' stage`);
	
	stage.SetAttribute(Attributes.Stage.Status, 'Waiting');
	
	for (const player of players) {
		const character = player.Character;
		const rootPart = character?.FindFirstChild('HumanoidRootPart') as Part | undefined;
		const rootAttachment = rootPart?.FindFirstChild('RootAttachment') as Attachment | undefined;
		if (character && rootPart && rootAttachment && character.GetAttribute(Attributes.Character.IsAttachedStage) === true) {
			attachPlayer(
				player,
				character,
				rootPart,
				rootAttachment,
				character.GetAttribute(Attributes.Character.StagePlayerNumber) as (number | undefined) ?? 1,
				stage
			);
		}
		
		const playerNumber = character?.GetAttribute(Attributes.Character.StagePlayerNumber) as number | undefined ?? 1;
		const preview = stage.FindFirstChild(`Preview${playerNumber}`) as Types.StagePreview | undefined;
		if (preview !== undefined) {
			eventsFolder.EndStagePreview.FireAllClients(preview);
			preview.SetAttribute(Attributes.StagePreview.IsOngoing, undefined);
		}
		
		activePreviews.delete(player);
		activeSongs.delete(player);
	}
}

export function init() {
	eventsFolder.UpdateStagePreview.OnServerEvent.Connect((player, updateData) => {
		if (!typeIs(updateData, 'string')) return;
		
		try {
			updateData = Compression.decompress(updateData);
		} catch (err) {
			return;
		}
		
		const actualPreview = activePreviews.get(player);
		if (!actualPreview || !actualPreview.preview.GetAttribute(Attributes.StagePreview.IsOngoing)) return;
		
		for (const otherPlayer of Players.GetPlayers()) {
			if (otherPlayer.Character !== undefined && otherPlayer.DistanceFromCharacter(actualPreview.preview.Position) < 25) {
				eventsFolder.UpdateStagePreview.FireClient(otherPlayer, actualPreview.preview, updateData, actualPreview.module);
			}
		}
	});
}