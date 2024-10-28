import {
	Players,
	ReplicatedStorage,
} from '@rbxts/services';
import { $print, $warn } from 'rbxts-transform-debug';

import * as Types from 'shared/Types';

const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild('PlayerGui') as PlayerGui;
const screenGui = playerGui.WaitForChild('ScreenGui') as Types.UIMain;

export const LocalSettings = new Map<keyof Types.PlayerSettings, Types.PlayerSettings[keyof Types.PlayerSettings]>();

function newSetting(frame: Instance) {
	if (!frame.IsA('Frame')) return;
	
	const name = frame.Name as keyof Types.PlayerSettings;
	const settingData = Types.PlayerSettingTypes[name];
	
	if (settingData.Type === 'int') {
		const container = frame as Types.UISettingsInputInt;
		
		let currentValue = settingData.Default;
		
		function update() {
			container.Input.TextEditable = false;
			container.Input.TextColor3 = Color3.fromRGB(128, 128, 128);
			
			const newValue = eventsFolder.UpdateSettings.InvokeServer(container.Name, container.Input.ContentText);
			if (typeIs(newValue, 'number')) currentValue = newValue;
			
			container.Input.Text = tostring(currentValue);
			LocalSettings.set(name, currentValue);
			
			container.Input.TextEditable = true;
			container.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		}
		
		container.WaitForChild('Input');
		container.Input.FocusLost.Connect(update);
		
		container.Input.TextEditable = true;
		container.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		
		LocalSettings.set(name, currentValue);
	} else {
		$warn(`Unknown setting type: ${settingData.Type}`);
	}
}

export function init() {
	for (const setting of screenGui.SettingsContainer.Content.GetChildren()) {
		task.spawn(newSetting, setting);
	}
	
	screenGui.SettingsContainer.Content.ChildAdded.Connect(newSetting);
	
	(eventsFolder.WaitForChild('LoadSettings') as RemoteEvent).OnClientEvent.Connect((savedSettings: Map<keyof Types.PlayerSettings, any>) => {
		$print('Loading settings:', savedSettings);
		
		for (const [name, value] of savedSettings) {
			task.spawn(() => {
				const settingData = Types.PlayerSettingTypes[name as keyof Types.PlayerSettings];
				const container = screenGui.SettingsContainer.Content.WaitForChild(name);
				
				if (settingData.Type === 'int') {
					(container.WaitForChild('Input') as TextBox).Text = tostring(value);
				} else return;
			});
			
			LocalSettings.set(name, value);
		}
	});
}