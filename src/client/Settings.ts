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

const callbacks = new Map<(value: Types.PlayerSettings[keyof Types.PlayerSettings]) => any, string>();

export const LocalSettings = new Map<keyof Types.PlayerSettings, Types.PlayerSettings[keyof Types.PlayerSettings]>();

function setSetting<T extends keyof Types.PlayerSettings>(settingName: T, settingValue: Types.PlayerSettings[T]) {
	LocalSettings.set(settingName, settingValue);
	
	for (const [callback, name] of callbacks) {
		if (name === settingName) callback(settingValue);
	}
}

function newSetting(frame: Instance) {
	if (!frame.IsA('Frame')) return;
	
	const name = frame.Name as keyof Types.PlayerSettings;
	const settingData = Types.PlayerSettingTypes[name];
	
	if (settingData.Type === 'int' || settingData.Type === 'float') {
		const settingContainer = frame as Types.UISettingsInputInt;
		
		let currentValue = settingData.Default;
		let isChanging = false;
		
		function update() {
			if (!screenGui.SettingsContainer.GetAttribute('IsOpened') || isChanging) return;
			
			isChanging = true;
			
			settingContainer.Input.TextEditable = false;
			settingContainer.Input.TextColor3 = Color3.fromRGB(128, 128, 128);
			
			const newValue = eventsFolder.UpdateSettings.InvokeServer(name, settingContainer.Input.ContentText);
			
			if (typeIs(newValue, 'number')) {
				currentValue = newValue;
				setSetting(name, currentValue);
			}
			
			isChanging = false;
			
			settingContainer.Input.Text = tostring(currentValue);
			
			settingContainer.Input.TextEditable = true;
			settingContainer.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		}
		
		settingContainer.SetAttribute('Tooltip', settingData.Tooltip);
		settingContainer.WaitForChild('Input');
		settingContainer.WaitForChild('Label');
		
		settingContainer.Label.Text = settingData.Label;
		
		settingContainer.Input.FocusLost.Connect(update);
		settingContainer.Input.Text = tostring(currentValue);
		settingContainer.Input.TextEditable = true;
		settingContainer.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		
		setSetting(name, currentValue);
	} else if (settingData.Type === 'string') {
		const settingContainer = frame as Types.UISettingsInputInt;
		
		let currentValue = settingData.Default;
		let isChanging = false;
		
		function update() {
			if (!screenGui.SettingsContainer.GetAttribute('IsOpened') || isChanging) return;
			
			isChanging = true;
			
			settingContainer.Input.TextEditable = false;
			settingContainer.Input.TextColor3 = Color3.fromRGB(128, 128, 128);
			
			const newValue = eventsFolder.UpdateSettings.InvokeServer(settingContainer.Name, settingContainer.Input.ContentText);
			
			if (typeIs(newValue, 'string')) {
				currentValue = newValue;
				setSetting(name, currentValue);
			}
			
			isChanging = false;
			
			settingContainer.Input.Text = currentValue;
			
			settingContainer.Input.TextEditable = true;
			settingContainer.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		}
		
		settingContainer.SetAttribute('Tooltip', settingData.Tooltip);
		settingContainer.WaitForChild('Input');
		settingContainer.WaitForChild('Label');
		
		settingContainer.Label.Text = settingData.Label;
		
		settingContainer.Input.FocusLost.Connect(update);
		settingContainer.Input.Text = currentValue;
		settingContainer.Input.TextEditable = true;
		settingContainer.Input.TextColor3 = Color3.fromRGB(255, 255, 255);
		
		setSetting(name, currentValue);
	} else {
		$warn(`Unknown setting type: ${settingData}`);
	}
}

export function onSettingChanged<T extends keyof Types.PlayerSettings>(name: T, changeCallback: (value: Types.PlayerSettings[T]) => any) {
	const callback = changeCallback as (value: Types.PlayerSettings[keyof Types.PlayerSettings]) => any;
	
	if (!callbacks.has(callback)) {
		callbacks.set(callback, name);
		callback(LocalSettings.get(name) as Types.PlayerSettings[T]);
	}
}

export function init() {
	for (const setting of screenGui.SettingsContainer.Content.GetChildren()) {
		task.spawn(newSetting, setting);
	}
	
	screenGui.SettingsContainer.Content.ChildAdded.Connect(newSetting);
	
	(eventsFolder.WaitForChild('LoadSettings') as RemoteEvent).OnClientEvent.Connect(<T extends keyof Types.PlayerSettings>(savedSettings: Map<T, Types.PlayerSettings[T]>) => {
		$print('Loading settings:', savedSettings);
		
		for (const [name, value] of savedSettings) {
			task.spawn(() => {
				const settingData = Types.PlayerSettingTypes[name as keyof Types.PlayerSettings];
				
				const container = screenGui.SettingsContainer.Content.WaitForChild(name, 180);
				if (container === undefined) return;
				
				if (settingData.Type === 'int') {
					(container.WaitForChild('Input') as TextBox).Text = tostring(value);
				} else if (settingData.Type === 'string') {
					(container.WaitForChild('Input') as TextBox).Text = tostring(value);
				} else return;
			});
			
			setSetting(name, value);
		}
	});
}