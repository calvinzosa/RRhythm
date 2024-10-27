import {
	GuiService,
	Players,
	ReplicatedStorage,
	RunService,
	StarterGui,
	TweenService,
	UserInputService,
	Workspace,
} from '@rbxts/services';

import { $print, $package } from 'rbxts-transform-debug';

import { Constants } from 'shared/Constants';
import * as Types from 'shared/Types';
import * as Utils from 'shared/Utils';

import * as MainGameplay from './MainGameplay';
import * as Editor from './Editor';
import * as UserInput from './UserInput';
import * as Preloader from './Preloader';
import * as Topbar from './Topbar';

const player = Players.LocalPlayer;
const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;
const stagesFolder = Workspace.WaitForChild('Stages') as Folder;

$print(`Hello ${player.Name}!`);

UserInput.init();
Preloader.preload();

const cachedCharts = new Map<ModuleScript, Types.Chart>();

if (RunService.IsStudio()) {
	const editorToggleKeybind = new UserInput.Hotkey('DevToggleEditor', Enum.KeyCode.O);
	
	editorToggleKeybind.onPress(() => Editor.init());
}

function promptTriggered(prompt: ProximityPrompt, stage: Types.StageModel, playerNumber: number) {
	if (!player.Character) return;
	
	if (player.Character.GetAttribute(Constants.Attributes.Character.IsAttachedStage) !== undefined) {
		$print(`Leaving '${stage.Parent?.Name}' stage`);
	} else {
		$print(`Joining '${stage.Parent?.Name}' stage as Player${playerNumber}`);
	}
	
	eventsFolder.JoinStage.FireServer(stage, playerNumber);
}

function newStage(stage: Types.StageModel) {
	if (stage.Parent?.Name === '1Player') {
		const prompt1 = stage.WaitForChild('Player1').WaitForChild('Trigger') as ProximityPrompt;
		const prompt2 = stage.WaitForChild('Player2').WaitForChild('Trigger') as ProximityPrompt;
		
		prompt1.Triggered.Connect(() => promptTriggered(prompt1, stage, 1));
		prompt2.Triggered.Connect(() => promptTriggered(prompt2, stage, 2));
	}
}

for (const stage of stagesFolder.GetDescendants()) {
	if (stage.IsA('Model')) newStage(stage as Types.StageModel);
}

stagesFolder.DescendantAdded.Connect((stage) => {
	if (stage.IsA('Model')) newStage(stage as Types.StageModel);
});

RunService.BindToRenderStep('MainUpdate', Enum.RenderPriority.Last.Value, (dt) => {
	if (MainGameplay.isPlaying) MainGameplay.gameUpdate(dt);
});

UserInputService.InputChanged.Connect((input) => {
	if (input.UserInputType === Enum.UserInputType.MouseMovement) {
		const playerGui = player.FindFirstChild('PlayerGui') as PlayerGui | undefined;
		const screenGui = playerGui?.FindFirstChild('ScreenGui') as Types.UIMain | undefined;
		if (!playerGui || !screenGui) return;
		
		const guiObjects = playerGui.GetGuiObjectsAtPosition(input.Position.X, input.Position.Y);
		if (guiObjects.size() === 0) return;
		
		let highestObject: GuiObject | undefined = undefined;
		
		for (const object of guiObjects) {
			if (object.IsDescendantOf(screenGui) && typeIs(object.GetAttribute('Tooltip'), 'string') && object.Visible) {
				if (!highestObject || object.ZIndex > highestObject.ZIndex) highestObject = object;
			}
		}
		
		const tooltip = screenGui.Tooltip;
		
		if (highestObject !== undefined) {
			const text = highestObject.GetAttribute('Tooltip') as string;
			
			tooltip.Left.Label.Text = text;
			tooltip.Right.Label.Text = text;
			
			if ((tooltip.Left.Label.AbsolutePosition.X + tooltip.Left.Label.AbsoluteSize.X) >= screenGui.AbsoluteSize.X) {
				tooltip.Left.Visible = false;
				tooltip.Right.Visible = true;
			} else {
				tooltip.Left.Visible = true;
				tooltip.Right.Visible = false;
			}
			
			tooltip.Position = new UDim2(0, input.Position.X, 0, input.Position.Y + GuiService.TopbarInset.Height);
			tooltip.Visible = true;
		} else {
			tooltip.Visible = false;
		}
	}
});

Topbar.Settings.toggled.Connect((isSelected) => {
	if (isSelected) {
		Topbar.GameMenu.lock();
	} else {
		if (!Topbar.Profile.isSelected) Topbar.GameMenu.unlock();
	}
});

Topbar.ShopEnter.selected.Connect(() => {
	
});

Topbar.Profile.toggled.Connect((isSelected) => {
	if (isSelected) {
		Topbar.GameMenu.lock();
	} else {
		if (!Topbar.Settings.isSelected) Topbar.GameMenu.unlock();
	}
});

(eventsFolder.WaitForChild('StartSongSelection') as RemoteEvent).OnClientEvent.Connect(async () => {
	while (true) {
		const selectedSong = await MainGameplay.startSongSelection();
		
		const didSelect: string | false = eventsFolder.ChooseSong.InvokeServer(selectedSong);
		if (didSelect === 'selected' || selectedSong === '<Exit>') break;
		else task.wait(0.5);
	}
});

(eventsFolder.WaitForChild('EndSongSelection') as RemoteEvent).OnClientEvent.Connect(() => {
	MainGameplay.endSongSelection();
});

(eventsFolder.WaitForChild('StageStartSong') as RemoteEvent).OnClientEvent.Connect(async (data: ModuleScript, stage: Types.StageModel) => {
	const chart = MainGameplay.loadSongModule(data);
	const stats = await MainGameplay.start(chart, data.Parent as Folder, stage, true, false);
	
	MainGameplay.showGrade(chart, ...stats);
});

(eventsFolder.WaitForChild('UpdateStagePreview') as RemoteEvent).OnClientEvent.Connect((preview: Types.StagePreview, updateData: string, module: ModuleScript) => {
	if (!preview.GetAttribute(Constants.Attributes.StagePreview.IsOngoing)) return;
	
	if (!cachedCharts.has(module)) cachedCharts.set(module, MainGameplay.loadSongModule(module));
	
	MainGameplay.updatePreview(preview, module.Parent as Folder, updateData, cachedCharts.get(module)!);
});

(eventsFolder.WaitForChild('StartStagePreview') as RemoteEvent).OnClientEvent.Connect((preview: Types.StagePreview) => {
	preview.SurfaceGui.InfoHUD.Visible = true;
	preview.SurfaceGui.InfoHUD.Position = new UDim2(0.5, 0, 0.995, 0);
	preview.SurfaceGui.InfoHUD.Score.Text = `<stroke thickness="1" color="#000" joins="miter">Score: <b>0</b></stroke>`;
	preview.SurfaceGui.InfoHUD.Accuracy.Text = `<stroke thickness="1" color="#000" joins="miter">Accuracy: <b>-nan(ind)%</b></stroke>`;
	preview.SurfaceGui.InfoHUD.Combo.Text = `<stroke thickness="1" color="#000" joins="miter">Combo: <b>0x</b></stroke>`;
	preview.SurfaceGui.InfoHUD.Misses.Text = `<stroke thickness="1" color="#000" joins="miter">Misses: <b>0</b></stroke>`;
	
	preview.SurfaceGui.Lanes.ClearAllChildren();
	preview.SetAttribute(Constants.Attributes.StagePreview.IsOngoing, true);
});

(eventsFolder.WaitForChild('EndStagePreview') as RemoteEvent).OnClientEvent.Connect((preview: Types.StagePreview) => {
	preview.SurfaceGui.InfoHUD.Visible = false;
	
	TweenService.Create(preview.SurfaceGui.InfoHUD, new TweenInfo(2, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
		Position: preview.SurfaceGui.InfoHUD.Position.add(new UDim2(-1, 0, 0, 0)),
	}).Play();
	
	for (const lane of preview.SurfaceGui.Lanes.GetChildren()) {
		if (lane.IsA('GuiObject')) {
			const info = new TweenInfo(Utils.randomFloat(0.5, 2), Enum.EasingStyle.Quad, Enum.EasingDirection.In);
			
			TweenService.Create(lane, info, {
				Position: lane.Position.add(new UDim2(0, 0, 1, 0)),
				Rotation: math.random(-90, 90),
			}).Play();
			
			Utils.destroyAfter(lane, info.Time);
		} else {
			lane.Destroy();
		}
	}
	
	preview.SetAttribute(Constants.Attributes.StagePreview.IsOngoing, undefined);
});

while (true) {
	try {
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Captures, false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.Health, false);
		StarterGui.SetCoreGuiEnabled(Enum.CoreGuiType.EmotesMenu, false);
		
		break;
	} catch (err) {
		task.wait(1);
	}
}

// task.wait(2);

// Gameplay.start({
//     metadata: {
//         title: 'Test Chart #1',
//         audioName: 'testing/audio/test',
//         setName: 'testing',
//         description: 'first chart ever made for this game',
//         difficulty: '--',
//         source: '--',
//         artist: '--',
//         mappers: [156926145],
//         searchTags: ['test', 'testing'],
//         totalLanes: 4,
//     },
//     difficulty: {
//         damageRate: 5,
//         overallDifficulty: 2
//     },
//     timings: [
//         { type: 0, millisecond: 0, bpm: 120, scrollSpeed: 1, volume: 100 },
//     ],
//     events: [
		
//     ],
//     notes: [
//         { type: 0, millisecond: 0, lane: 0 },
//         { type: 0, millisecond: 100, lane: 1 },
//         { type: 0, millisecond: 200, lane: 2 },
//         { type: 0, millisecond: 300, lane: 3 },
//         { type: 0, millisecond: 400, lane: 0 },
//         { type: 0, millisecond: 500, lane: 1 },
//         { type: 0, millisecond: 600, lane: 2 },
//         { type: 0, millisecond: 700, lane: 3 },
//         { type: 0, millisecond: 800, lane: 0 },
//         { type: 0, millisecond: 900, lane: 1 },
//     ]
// }, true, false).then((data) => Gameplay.showGrade(...data));

// Gameplay.start({
//     metadata: {
//         title: 'Test Chart #1',
//         audioName: 'testing/audio/test',
//         setName: 'testing',
//         description: 'first chart ever made for this game',
//         difficulty: '--',
//         source: '--',
//         artist: '--',
//         mappers: [156926145],
//         searchTags: ['test', 'testing'],
//         totalLanes: 4,
//     },
//     difficulty: {
//         damageRate: 5,
//         overallDifficulty: 2
//     },
//     timings: [
//         { type: 0, millisecond: 0, bpm: 120, scrollSpeed: 1, volume: 100 },
//     ],
//     events: [
		
//     ],
//     notes: [
//         { type: 0, millisecond: 1000, lane: 0 },
//         { type: 0, millisecond: 1500, lane: 1 },
//         { type: 0, millisecond: 2000, lane: 2 },
//         { type: 0, millisecond: 2500, lane: 3 },
//         { type: 0, millisecond: 3000, lane: 2 },
//         { type: 0, millisecond: 3500, lane: 1 },
//         { type: 0, millisecond: 4000, lane: 0 },
//         { type: 0, millisecond: 4500, lane: 1 },
//         { type: 0, millisecond: 5000, lane: 2 },
//         { type: 0, millisecond: 5500, lane: 3 },
//         { type: 0, millisecond: 6000, lane: 2 },
//         { type: 0, millisecond: 6500, lane: 1 },
//         { type: 0, millisecond: 7000, lane: 0 },
//     ]
// });