import {
	Players,
	ReplicatedStorage,
} from '@rbxts/services';

import { Profile } from '@rbxts/profileservice/globals';
import ProfileService from '@rbxts/profileservice';

import { $print } from 'rbxts-transform-debug';

import * as Types from 'shared/Types';

const eventsFolder = ReplicatedStorage.FindFirstChild('Events') as Types.EventsFolder;

export const ProfileTemplate =  {
	Tokens: 200,
	OwnedItems: [] as Types.ProfileOwnedItem[],
	PlayerSettings: {
		LaneWidth: 70,
		TextSize: 100,
	} as Types.PlayerSettings,
};

export const ProfileStore = ProfileService.GetProfileStore('MainPlayerData', ProfileTemplate);
export const LoadedProfiles = new Map<Player, Profile<typeof ProfileTemplate>>();

export function profileLoaded(player: Player, profile: Profile<typeof ProfileTemplate>, key: string) {
	$print(`Loaded profile '${key}'`);
	
	const leaderstats = player.FindFirstChild('leaderstats') ?? new Instance('Folder');
	leaderstats.Name = 'leaderstats';
	
	const tokensStat = leaderstats.FindFirstChild('Tokens') as IntValue | undefined ?? new Instance('IntValue');
	tokensStat.Name = 'Tokens';
	tokensStat.Value = math.max(profile.Data.Tokens, 0);
	tokensStat.Parent = leaderstats;
	
	tokensStat.GetPropertyChangedSignal('Value').Connect(() => {
		const newValue = tokensStat.Value;
		profile.Data.Tokens = newValue;
	});
	
	leaderstats.Parent = player;
	
	task.delay(1, () => eventsFolder.LoadSettings.FireClient(player, profile.Data.PlayerSettings));
}

export function initPlayer(player: Player) {
	const key = `player-${player.UserId}`;
	const profile = ProfileStore.LoadProfileAsync(key);
	if (profile !== undefined) {
		profile.AddUserId(player.UserId);
		profile.Reconcile();
		
		try {
			const leaderstats = new Instance('Folder');
			leaderstats.Name = 'leaderstats';
			
			const tokensStat = new Instance('IntValue');
			tokensStat.Name = 'Tokens';
			tokensStat.Value = 0;
			tokensStat.Parent = leaderstats;
			
			leaderstats.Parent = player;
		} catch (err) {  }
		
		profile.ListenToRelease(() => {
			$print(`Releasing profile '${key}'`);
			
			LoadedProfiles.delete(player);
			
			player.Kick(`Your profile data '${key}' was unloaded, if this was not intentional try rejoining`);
		});
		
		if (player.IsDescendantOf(Players)) {
			LoadedProfiles.set(player, profile);
			
			try {
				profileLoaded(player, profile, key);
			} catch (err) {
				player.Kick(`There was an error with initializing your profile: ${err}`);
				profile.Release();
			}
		} else {
			profile.Release();
		}
	} else {
		player.Kick(`Unable to load profile data '${key}', try rejoining`);
	}
}