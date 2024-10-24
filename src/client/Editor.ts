import {
	Players,
	ReplicatedStorage,
} from '@rbxts/services';

import * as MainGameplay from './MainGameplay';
import * as Types from 'shared/Types';

const player = Players.LocalPlayer;
const playerGui = player.WaitForChild('PlayerGui') as PlayerGui;
const screenGui = playerGui.WaitForChild('ScreenGui') as Types.UIMain;

let hasInitialized = false;

export function init() {
	if (hasInitialized) return;
	hasInitialized = true;
	
	const editorUI = screenGui.Editor;
	
	const chart: Types.Chart = {
		metadata: {
			title: '--',
			audioName: '--',
			setName: '--',
			description: '--',
			difficulty: '--',
			source: '--',
			artist: '--',
			mappers: [],
			searchTags: [],
			totalLanes: -1,
		},
		difficulty: {
			damageRate: -1,
			maxHealth: 10,
			overallDifficulty: -1
		},
		timings: [],
		events: [],
		notes: []
	};
	
	for (const tab of editorUI.Content.Tabs.Content.GetChildren()) {
		if (!tab.IsA('TextButton')) continue;
		
		tab.MouseButton1Click.Connect(() => {
			for (const frame of editorUI.Content.GetChildren()) {
				if (!frame.IsA('ScrollingFrame')) continue;
				
				frame.Visible = (frame.Name === tab.Name);
			}
			
			for (const otherTab of editorUI.Content.Tabs.Content.GetChildren()) {
				if (!otherTab.IsA('TextButton')) continue;
				
				const underline = otherTab.FindFirstChild('Underline');
				if (underline?.IsA('Frame')) {
					let isSelected = (otherTab.Name === tab.Name);
					
					otherTab.AutoButtonColor = !isSelected;
					otherTab.BackgroundColor3 = isSelected ? Color3.fromRGB(55, 55, 55) : Color3.fromRGB(45, 45, 45);
					underline.Visible = isSelected;
				}
			}
		});
	}
	
	function textInput<T extends keyof Types.Chart>(input: Types.UIEditorTextInput, category: T, property: keyof Types.Chart[T], filter?: (text: string) => string) {
		input.Value.FocusLost.Connect(() => {
			input.Value.Text = filter ? filter(input.Value.ContentText) : input.Value.Text;
			
			if (typeIs(chart[category]![property], 'number')) {
				(chart[category]![property] as number) = tonumber(input.Value.Text) ?? 0;
			} else {
				(chart[category]![property] as string) = input.Value.Text;
			}
		});
	}
	
	function listInput<T extends keyof Types.Chart>(list: Types.UIEditorList, category: T, property: keyof Types.Chart[T]) {
		const template = list.List.Template.Clone();
		list.List.Template.Destroy();
		
		list.List.Value.Add.MouseButton1Click.Connect(() => {
			if (list.List.Value.ContentText.size() === 0) return;
			
			const item = template.Clone();
			item.Text = list.List.Value.ContentText;
			item.Parent = list.List;
			
			item.MouseButton1Click.Connect(() => {
				const index = (chart[category]![property] as string[]).indexOf(item.Text);
				if (index >= 0) (chart[category]![property] as string[]).remove(index);
				
				item.Destroy();
			});
			
			list.List.Value.Text = '';
			
			(chart[category]![property] as string[]).push(item.Text);
		});
	}
	
	function createNumberFilter(round: boolean, min: number, max: number, defaultValue: number) {
		function empty(number: number) {
			return number;
		}
		
		const roundFunc = round ? math.round : empty;
		
		return (text: string) => tostring(roundFunc(math.clamp(tonumber(text) ?? tonumber(text.gsub('[^%d]', '')[0]) ?? defaultValue, min, max)));
	}
	
	textInput(editorUI.Content.Metadata.Title, 'metadata', 'title');
	textInput(editorUI.Content.Metadata.AudioName, 'metadata', 'audioName');
	textInput(editorUI.Content.Metadata.Description, 'metadata', 'description');
	textInput(editorUI.Content.Metadata.Difficulty, 'metadata', 'difficulty');
	textInput(editorUI.Content.Metadata.OverallDifficulty, 'difficulty', 'overallDifficulty', createNumberFilter(false, 0, 100, 0));
	textInput(editorUI.Content.Metadata.LaneCount, 'metadata', 'totalLanes', createNumberFilter(true, 1, 20, 4));
	textInput(editorUI.Content.Metadata.Source, 'metadata', 'source');
	textInput(editorUI.Content.Metadata.Artist, 'metadata', 'artist');
	listInput(editorUI.Content.Metadata.Mappers, 'metadata', 'mappers');
	listInput(editorUI.Content.Metadata.Tags, 'metadata', 'searchTags');
	
	// dropdownInput<'metadata'>(editorUI.Content.Metadata.Set, 'setName');
	
	editorUI.RefreshPreview.MouseButton1Click.Connect(() => {
		for (const lane of editorUI.Lanes.GetChildren()) {
			if (lane.IsA('CanvasGroup')) lane.Destroy();
		}
		
		for (const lane of $range(1, chart.metadata.totalLanes)) {
			
		}
	});
	
	editorUI.Visible = true;
}