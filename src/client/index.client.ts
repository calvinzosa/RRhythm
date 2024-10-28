import {
	GuiService,
	Players,
	ReplicatedStorage,
	RunService,
	StarterGui,
	TextService,
	TweenService,
	UserInputService,
	Workspace,
} from '@rbxts/services';

import { $print, $package, $git } from 'rbxts-transform-debug';

import { Constants } from 'shared/Constants';
import * as Types from 'shared/Types';
import * as Utils from 'shared/Utils';

import * as MainGameplay from './MainGameplay';
import * as Settings from './Settings';
import * as Editor from './Editor';
import * as UserInput from './UserInput';
import * as Topbar from './Topbar';
import * as Markdown from './Markdown';

import {} from './Preloader';

const player = Players.LocalPlayer;
const screenGui = player.WaitForChild('PlayerGui').WaitForChild('ScreenGui') as Types.UIMain;
const eventsFolder = ReplicatedStorage.WaitForChild('Events') as Types.EventsFolder;
const stagesFolder = Workspace.WaitForChild('Stages') as Folder;

let previousTextBounds: [GuiObject | undefined, Vector2 | undefined] = [undefined, undefined];

$print(`Hello ${player.Name}!`);

UserInput.init();
Settings.init();

task.spawn(() => {
	const changelogs = ReplicatedStorage.WaitForChild('Changelogs') as StringValue;
	let start = '# Contents of `CHANGELOGS.md`\n--------\n';
	
	Markdown.parse(start + changelogs.Value, screenGui.ChangelogsContainer.Content.Markdown);
	
	changelogs.Changed.Connect((newValue) => {
		Markdown.parse(start + newValue, screenGui.ChangelogsContainer.Content.Markdown);
	});
});

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
			
			const params = new Instance('GetTextBoundsParams');
			params.Text = text;
			params.Width = 400;
			params.Size = 32;
			params.Font = Font.fromEnum(Enum.Font.BuilderSans);
			
			let textBounds = new Vector2(params.Width, params.Size);
			
			if (previousTextBounds[0] !== highestObject) {
				try {
					textBounds = TextService.GetTextBoundsAsync(params);
				} catch (err) {  }
			} else if (previousTextBounds[1] !== undefined) textBounds = previousTextBounds[1];
			
			previousTextBounds[0] = highestObject;
			previousTextBounds[1] = textBounds;
			
			params.Destroy();
			
			tooltip.Left.Label.Text = text;
			tooltip.Right.Label.Text = text;
			tooltip.Right.Label.Size = new UDim2(0, textBounds.X + 12, 0, textBounds.Y + 12);
			tooltip.Left.Label.Size = new UDim2(0, textBounds.X + 12, 0, textBounds.Y + 12);
			
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

function toggleContainer(container: GuiObject, isSelected: boolean) {
	if (isSelected) {
		container.Position = new UDim2(0.5, 0, -1, 0);
		container.Size = new UDim2(0.7, 0, 0.9, GuiService.TopbarInset.Height * -1.5);
		container.Rotation = 90;
		container.Visible = true;
		
		TweenService.Create(container, new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			Position: new UDim2(0.5, 0, 0.5, GuiService.TopbarInset.Height.idiv(2)),
			Rotation: 0,
		}).Play();
	} else {
		container.Position = new UDim2(0.5, 0, 0.5, GuiService.TopbarInset.Height.idiv(2));
		container.Rotation = 0;
		
		TweenService.Create(container, new TweenInfo(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
			Position: new UDim2(0.5, 0, 2, 0),
			Rotation: -90,
		}).Play();
	}
}

Topbar.Settings.toggled.Connect((isSelected) => {
	const container = screenGui.SettingsContainer;
	toggleContainer(container, isSelected);
});

screenGui.SettingsContainer.Topbar.Close.MouseButton1Click.Connect(() => {
	Topbar.Settings.deselect();
});

Topbar.Changelogs.toggled.Connect((isSelected) => {
	const container = screenGui.ChangelogsContainer;
	toggleContainer(container, isSelected);
});

screenGui.ChangelogsContainer.Topbar.Close.MouseButton1Click.Connect(() => {
	Topbar.Changelogs.deselect();
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