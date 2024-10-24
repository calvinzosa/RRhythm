import {
	Players,
	ReplicatedStorage,
	RunService,
	Workspace,
} from '@rbxts/services';

import { $dbg, $print } from 'rbxts-transform-debug';

import * as MainGameplay from './MainGameplay';
import * as Types from 'shared/Types';
import * as UserInput from './UserInput';

const camera = Workspace.CurrentCamera ?? Workspace.WaitForChild('Camera') as Camera;
const player = Players.LocalPlayer;
const playerGui = player.WaitForChild('PlayerGui') as PlayerGui;
const screenGui = playerGui.WaitForChild('ScreenGui') as Types.UIMain;
const skinsFolder = ReplicatedStorage.WaitForChild('Skins');

let hasInitialized = false;

export function init() {
	if (hasInitialized) return;
	
	hasInitialized = true;
	camera.CameraType = Enum.CameraType.Scriptable;
	
	const editorUI = screenGui.Editor;
	
	let chart: Types.Chart = {
		metadata: {
			title: 'Example Chart',
			audioName: '--',
			setName: '--',
			description: '--',
			difficulty: '--',
			source: '--',
			artist: '--',
			mappers: [],
			searchTags: [],
			totalLanes: 4,
		},
		difficulty: {
			damageRate: 2,
			maxHealth: 10,
			overallDifficulty: 0
		},
		timings: [],
		events: [],
		notes: []
	};
	
	const editorSkinFolder = skinsFolder.WaitForChild('Editor') as Types.SkinFolder;
	
	const laneFrames: Types.UILane[] = [];
	const laneTemplates: { Note: Types.UINote, HoldNote: Types.UIBodyNote, TailNote: Types.UITailNote, BodyNote: Types.UIBodyNote, Lane: Types.UILane }[] = [];
	
	const noteTravelTime = 1500;
	const laneWidth = 70;
	const hitPosition = 400;
	const lanePadding = 0;
	const playedNotes = new Set<number>();
	const visibleNotes = new Map<number, Types.NoteObject>();
	
	let currentMillisecond = 0;
	let beatSnapDivisor = 4;
	let numShownBeats = 10;
	let isPlaying = false;
	let playingStartTime = os.clock();
	
	let music: Sound | undefined = undefined;
	
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
					otherTab.BackgroundColor3 = isSelected ? Color3.fromRGB(75, 75, 75) : Color3.fromRGB(65, 65, 65);
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
			refreshPreview();
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
			refreshPreview();
		});
	}
	
	function dropdownInput<T extends keyof Types.Chart>(dropdown: Types.UIEditorDropdown, category: T, property: keyof Types.Chart[T], items: string[]) {
		const dropdownTemplate = ReplicatedStorage.WaitForChild('Templates').WaitForChild('DropdownItem') as Types.UIEditorDropdownItem;
		
		for (const text of items) {
			const button = dropdownTemplate.Clone();
			button.Text = text;
			button.Parent = dropdown.Dropdown.Items;
			
			button.MouseButton1Click.Connect(() => {
				(chart[category]![property] as string) = text;
				refreshPreview();
				
				dropdown.Dropdown.Text = text;
				dropdown.Dropdown.Items.Visible = false;
				
				dropdown.Dropdown.Arrow.Rotation = -45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.025, 0, 0.5, 0);
				dropdown.ZIndex = 1;
			});
		}
		
		dropdown.Dropdown.MouseButton1Click.Connect(() => {
			dropdown.Dropdown.Items.Visible = !dropdown.Dropdown.Items.Visible;
			
			if (dropdown.Dropdown.Items.Visible) {
				dropdown.Dropdown.Arrow.Rotation = 45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.05, 0, 0.5, 0);
				dropdown.ZIndex = 2;
			} else {
				dropdown.Dropdown.Arrow.Rotation = -45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.025, 0, 0.5, 0);
				dropdown.ZIndex = 1;
			}
		});
	}
	
	function dropdownInputCallback(dropdown: Types.UIEditorDropdown, items: string[], callback: (text: string) => void) {
		const dropdownTemplate = ReplicatedStorage.WaitForChild('Templates').WaitForChild('DropdownItem') as Types.UIEditorDropdownItem;
		
		for (const text of items) {
			const button = dropdownTemplate.Clone();
			button.Text = text;
			button.Parent = dropdown.Dropdown.Items;
			
			button.MouseButton1Click.Connect(() => {
				callback(text);
				
				dropdown.Dropdown.Text = text;
				dropdown.Dropdown.Items.Visible = false;
				
				dropdown.Dropdown.Arrow.Rotation = -45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.025, 0, 0.5, 0);
				dropdown.ZIndex = 1;
			});
		}
		
		dropdown.Dropdown.MouseButton1Click.Connect(() => {
			dropdown.Dropdown.Items.Visible = !dropdown.Dropdown.Items.Visible;
			
			if (dropdown.Dropdown.Items.Visible) {
				dropdown.Dropdown.Arrow.Rotation = 45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.05, 0, 0.5, 0);
				dropdown.ZIndex = 2;
			} else {
				dropdown.Dropdown.Arrow.Rotation = -45;
				dropdown.Dropdown.Arrow.Position = new UDim2(0.025, 0, 0.5, 0);
				dropdown.ZIndex = 1;
			}
		});
	}
	
	function createNumberFilter(round: boolean, min: number, max: number, defaultValue: number) {
		function empty(number: number) {
			return number;
		}
		
		const roundFunc = round ? math.round : empty;
		
		return (text: string) => tostring(roundFunc(math.clamp(tonumber(text) ?? tonumber(text.gsub('[^%d]', '')[0]) ?? defaultValue, min, max)));
	}
	
	function refreshPreview() {
		for (const lane of editorUI.Lanes.GetChildren()) {
			if (lane.IsA('CanvasGroup')) lane.Destroy();
		}
		
		editorUI.Content.Metadata.Title.Value.Text = chart.metadata.title;
		editorUI.Content.Metadata.AudioName.Value.Text = chart.metadata.audioName;
		editorUI.Content.Metadata.Description.Value.Text = chart.metadata.description;
		editorUI.Content.Metadata.Set.Dropdown.Text = chart.metadata.setName;
		editorUI.Content.Metadata.Difficulty.Value.Text = chart.metadata.difficulty;
		editorUI.Content.Metadata.OverallDifficulty.Value.Text = tostring(chart.difficulty.overallDifficulty);
		editorUI.Content.Metadata.LaneCount.Value.Text = tostring(chart.metadata.totalLanes);
		editorUI.Content.Metadata.Source.Value.Text = chart.metadata.source;
		editorUI.Content.Metadata.Artist.Value.Text = chart.metadata.artist;
		
		for (const item of editorUI.Content.Metadata.Mappers.List.GetChildren()) {
			if (item.IsA('TextButton')) item.Destroy();
		}
		
		for (const item of editorUI.Content.Metadata.Tags.List.GetChildren()) {
			if (item.IsA('TextButton')) item.Destroy();
		}
		
		laneTemplates.clear();
		
		for (const subKeyFolder of editorSkinFolder.GetChildren()) {
			if (!subKeyFolder.IsA('Folder')) continue;
			
			try {
				const lanes = MainGameplay.parseSubKeyName(subKeyFolder.Name, chart.metadata.totalLanes);
				
				for (const lane of lanes) {
					laneTemplates[lane - 1] = {
						Lane: subKeyFolder.FindFirstChild('Lane') as Types.UILane,
						Note: subKeyFolder.FindFirstChild('Note') as Types.UINote,
						HoldNote: subKeyFolder.FindFirstChild('HoldNote') as Types.UIHoldNote,
						TailNote: subKeyFolder.FindFirstChild('TailNote') as Types.UITailNote,
						BodyNote: subKeyFolder.FindFirstChild('BodyNote') as Types.UIBodyNote,
					};
				}
			} catch (err) {  }
		}
		
		for (const i of $range(1, chart.metadata.totalLanes)) {
			if (laneTemplates[i - 1] === undefined) {
				laneTemplates[i - 1] = {
					Lane: skinsFolder.FindFirstChild('CirclesV1')!.FindFirstChild('1>-3,-1&-1')!.FindFirstChild('Lane') as Types.UILane,
					Note: skinsFolder.FindFirstChild('CirclesV1')!.FindFirstChild('1>-3,-1&-1')!.FindFirstChild('Note') as Types.UINote,
					HoldNote: skinsFolder.FindFirstChild('CirclesV1')!.FindFirstChild('1>-3,-1&-1')!.FindFirstChild('HoldNote') as Types.UIHoldNote,
					TailNote: skinsFolder.FindFirstChild('CirclesV1')!.FindFirstChild('1>-3,-1&-1')!.FindFirstChild('TailNote') as Types.UITailNote,
					BodyNote: skinsFolder.FindFirstChild('CirclesV1')!.FindFirstChild('1>-3,-1&-1')!.FindFirstChild('BodyNote') as Types.UIBodyNote,
				};
			}
		}
		
		const setFolder = ReplicatedStorage.WaitForChild('Songs').FindFirstChild(chart.metadata.setName);
		const songFolder = setFolder?.FindFirstChild(chart.metadata.title);
		const audio = songFolder?.FindFirstChild(chart.metadata.audioName);
		
		if (audio?.IsA('Sound')) music = audio;
		else music = undefined;
		
		const totalLanes = chart.metadata.totalLanes;
		
		for (const lane of laneFrames) lane.Destroy();
		laneFrames.clear();
		
		for (const i of $range(1, totalLanes)) {
			const lane = laneTemplates[i - 1].Lane.Clone();
			lane.Name = tostring(i);
			lane.ZIndex = i;
			lane.Size = new UDim2(0, laneWidth, 1, 0);
			lane.Position = new UDim2(0, (editorUI.Lanes.AbsoluteSize.X / 2) - laneWidth * (totalLanes / 2 - i + 1), 0, 0);
			lane.UIPadding.PaddingLeft = new UDim(0, lanePadding);
			lane.UIPadding.PaddingRight = new UDim(0, lanePadding);
			lane.JudgementLine.Position = new UDim2(0.5, 0, hitPosition / 480, 0);
			lane.Parent = editorUI.Lanes;
			
			laneFrames.push(lane);
		}
		
		updateNotes();
	}
	
	function calculateYOffset(noteMillisecond: number, laneHeight: number) {
		return ((currentMillisecond + noteTravelTime - noteMillisecond) / noteTravelTime) * (laneHeight * (hitPosition / 480) - laneWidth);
	}
	
	function updateNotes() {
		for (const [i, noteData] of ipairs(chart.notes)) {
			const laneContainer = laneFrames[noteData.lane % chart.metadata.totalLanes];
			const laneHeight = laneContainer.AbsoluteSize.Y;
			const laneWidth = laneContainer.AbsoluteSize.X;
			
			const template = laneTemplates[noteData.lane % chart.metadata.totalLanes];
			const yOffset = calculateYOffset(noteData.millisecond, laneHeight);
			
			let tailOffset = 0;
			if (noteData.type === 1) tailOffset = calculateYOffset(noteData.millisecond + noteData.holdLength, laneHeight);
			
			if ((yOffset >= 0 && yOffset < laneHeight)
				|| (noteData.type === 1 && tailOffset >= 0 && tailOffset < laneHeight)
    			|| (noteData.type === 1 && yOffset > laneHeight && tailOffset < 0)
			) {
				if (noteData.type === 0) {
					let note = laneContainer.Notes.FindFirstChild(`${i}.0`) as Types.UINote | undefined;
					if (!note) {
						note = template.Note.Clone();
						note.Name = `${i}.0`;
						note.Parent = laneContainer.Notes;
					}
					
					note.Position = new UDim2(0, 0, 0, math.round(yOffset));
				} else if (noteData.type === 1) {
					let holdNote = laneContainer.Notes.FindFirstChild(`${i}.0`) as Types.UINote | undefined;
					if (!holdNote) {
						holdNote = template.HoldNote.Clone();
						holdNote.Name = `${i}.0`;
						holdNote.Parent = laneContainer.Notes;
					}
					
					holdNote.Position = new UDim2(0, 0, 0, math.round(yOffset));
					
					let tailNote = laneContainer.Notes.FindFirstChild(`${i}.2`) as Types.UINote | undefined;
					if (!tailNote) {
						tailNote = template.HoldNote.Clone();
						tailNote.Name = `${i}.2`;
						tailNote.Parent = laneContainer.Notes;
					}
					
					tailNote.Position = new UDim2(0, 0, 0, math.round(tailOffset));
					
					let bodyNote = laneContainer.Notes.FindFirstChild(`${i}.1`) as Types.UIBodyNote | undefined;
					if (!bodyNote) {	
						bodyNote = template.BodyNote.Clone();
						bodyNote.Name = `${i}.1`;
						bodyNote.Parent = laneContainer.Notes;
					}
					
					let topOffset = holdNote.Position.Y.Offset;
					let bottomOffset = tailNote.Position.Y.Offset;
					
					if (typeIs(template.BodyNote.GetAttribute('OffsetTop'), 'number')) {
						bottomOffset += math.round(laneWidth * (template.BodyNote.GetAttribute('OffsetTop') as number));
					}
					
					if (typeIs(template.BodyNote.GetAttribute('OffsetBottom'), 'number')) {
						topOffset += math.round(laneWidth * (template.BodyNote.GetAttribute('OffsetBottom') as number));
					}
					
					bodyNote.Position = new UDim2(0, 0, 0, bottomOffset);
					bodyNote.Size = new UDim2(1, 0, 0, topOffset - bottomOffset);
				}
				
				if (!visibleNotes.has(i)) visibleNotes.set(i, noteData);
			} else {
				laneContainer.Notes.FindFirstChild(`${i}.0`)?.Destroy();
				
				if (noteData.type === 1) {
					laneContainer.Notes.FindFirstChild(`${i}.1`)?.Destroy();
					laneContainer.Notes.FindFirstChild(`${i}.2`)?.Destroy();
				}
				
				visibleNotes.delete(i);
				
				if (noteData.millisecond > currentMillisecond) break;
			}
		}
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
	
	const songSets: string[] = [];
	for (const set of ReplicatedStorage.WaitForChild('Songs').GetChildren()) {
		if (set.IsA('Folder')) songSets.push(set.Name);
	}
	
	dropdownInput<'metadata'>(editorUI.Content.Metadata.Set, 'metadata', 'setName', songSets);
	
	const allCharts = new Map<string, ModuleScript>();
	const songsList: string[] = [];
	
	for (const set of ReplicatedStorage.WaitForChild('Songs').GetChildren()) {
		if (!set.IsA('Folder')) continue;
		
		for (const song of set.GetChildren()) {
			if (!song.IsA('Folder')) continue;
			
			for (const difficulty of song.GetChildren()) {
				if (difficulty.IsA('ModuleScript')) {
					const key = `'${song.Name}' [${difficulty}] in '${set.Name}'`;
					allCharts.set(key, difficulty);
					songsList.push(key);
				}
			}
		}
	}
	
	let selectedSongTarget: ModuleScript | undefined = undefined;
	
	dropdownInputCallback(editorUI.Content.Load.Target, songsList, (song) => {
		selectedSongTarget = allCharts.get(song);
	});
	
	editorUI.Lanes.InputChanged.Connect((input) => {
		if (input.UserInputType === Enum.UserInputType.MouseWheel) {
			const delta = math.sign(input.Position.Z);
			currentMillisecond += delta * 500;
			
			playedNotes.clear();
		}
	});
	
	editorUI.Content.Load.Load.MouseButton1Click.Connect(() => {
		if (!selectedSongTarget) return;
		
		try {
			chart = MainGameplay.loadSongModule(selectedSongTarget);
			
			editorUI.Content.Load.Load.Text = 'Loaded!';
			task.delay(0.2, () => editorUI.Content.Load.Load.Text = 'Load chart!');
			
			refreshPreview();
		} catch (err) {  }
	});
	
	editorUI.RefreshPreview.MouseButton1Click.Connect(() => {
		refreshPreview();
	});
	
	const pauseHotkey = new UserInput.Hotkey('EditorPlaybackToggle', Enum.KeyCode.Space);
	
	pauseHotkey.onPress(() => {
		isPlaying = !isPlaying;
		
		playedNotes.clear();
		
		if (isPlaying) {
			playingStartTime = os.clock() - currentMillisecond / 1000;
			
			if (music) {
				music.Play();
				music.TimePosition = currentMillisecond / 1000;
			}
		} else {
			if (music) music.Stop();
		}
	});
	
	editorUI.Visible = true;
	
	refreshPreview();
	
	RunService.BindToRenderStep('EditorUpdate', Enum.RenderPriority.Last.Value + 10, (dt) => {
		if (isPlaying) {
			currentMillisecond = math.floor((os.clock() - playingStartTime) * 1000);
			
			for (const [i, note] of visibleNotes) {
				const laneHeight = laneFrames[note.lane % chart.metadata.totalLanes].AbsoluteSize.Y;
				const yOffset = calculateYOffset(note.millisecond, laneHeight);
				
				if (!playedNotes.has(i) && yOffset >= laneHeight * (hitPosition / 480) - laneWidth) {
					const sound = (ReplicatedStorage.WaitForChild('normal-hitnormal') as Sound).Clone();
					sound.Parent = Workspace;
					sound.Destroy();
					
					playedNotes.add(i);
				}
			}
		}
		
		updateNotes();
		
		editorUI.Info.Milliseconds.Text = `${currentMillisecond}ms`;
	});
}