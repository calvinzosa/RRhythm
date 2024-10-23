-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
local Workspace = _services.Workspace
local Constants = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants").Constants
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local OsuBeatmapConverter = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "OsuBeatmapConverter")
local Gameplay = TS.import(script, script, "MainGameplay")
local UserInput = TS.import(script, script, "UserInput")
local Preloader = TS.import(script, script, "Preloader")
local player = Players.LocalPlayer
local eventsFolder = ReplicatedStorage:WaitForChild("Events")
local stagesFolder = Workspace:WaitForChild("Stages")
print("[src/client/index.client.ts:20]", `Hello {player.Name}!`)
UserInput.init()
Preloader.preload()
local cachedCharts = {}
local function promptTriggered(prompt, stage, playerNumber)
	if not player.Character then
		return nil
	end
	if player.Character:GetAttribute(Constants.Attributes.Character.IsAttachedStage) ~= nil then
		local _result = stage.Parent
		if _result ~= nil then
			_result = _result.Name
		end
		print("[src/client/index.client.ts:31]", `Leaving '{_result}' stage`)
	else
		local _result = stage.Parent
		if _result ~= nil then
			_result = _result.Name
		end
		print("[src/client/index.client.ts:33]", `Joining '{_result}' stage as Player{playerNumber}`)
	end
	eventsFolder.JoinStage:FireServer(stage, playerNumber)
end
local function newStage(stage)
	local _result = stage.Parent
	if _result ~= nil then
		_result = _result.Name
	end
	if _result == "1Player" then
		local prompt1 = stage:WaitForChild("Player1"):WaitForChild("Trigger")
		local prompt2 = stage:WaitForChild("Player2"):WaitForChild("Trigger")
		prompt1.Triggered:Connect(function()
			return promptTriggered(prompt1, stage, 1)
		end)
		prompt2.Triggered:Connect(function()
			return promptTriggered(prompt2, stage, 2)
		end)
	end
end
for _, stage in stagesFolder:GetDescendants() do
	if stage:IsA("Model") then
		newStage(stage)
	end
end
stagesFolder.DescendantAdded:Connect(function(stage)
	if stage:IsA("Model") then
		newStage(stage)
	end
end);
(eventsFolder:WaitForChild("StartSongSelection")).OnClientEvent:Connect(TS.async(function()
	while true do
		local selectedSong = TS.await(Gameplay.startSongSelection())
		local didSelect = eventsFolder.ChooseSong:InvokeServer(selectedSong)
		if didSelect == "selected" or selectedSong == "<Exit>" then
			break
		else
			task.wait(0.5)
		end
	end
end));
(eventsFolder:WaitForChild("EndSongSelection")).OnClientEvent:Connect(function()
	Gameplay.endSongSelection()
end);
(eventsFolder:WaitForChild("StageStartSong")).OnClientEvent:Connect(TS.async(function(data, stage)
	local chart = Gameplay.loadSongModule(data)
	local stats = TS.await(Gameplay.start(chart, data.Parent, stage, true, false))
	Gameplay.showGrade(chart, unpack(stats))
end));
(eventsFolder:WaitForChild("UpdateStagePreview")).OnClientEvent:Connect(function(preview, updateData, module)
	local _value = preview:GetAttribute(Constants.Attributes.StagePreview.IsOngoing)
	if not (_value ~= 0 and _value == _value and _value ~= "" and _value) then
		return nil
	end
	local _module = module
	if not (cachedCharts[_module] ~= nil) then
		local _module_1 = module
		local _arg1 = Gameplay.loadSongModule(module)
		cachedCharts[_module_1] = _arg1
	end
	local _exp = preview
	local _exp_1 = module.Parent
	local _exp_2 = updateData
	local _module_1 = module
	Gameplay.updatePreview(_exp, _exp_1, _exp_2, cachedCharts[_module_1])
end);
(eventsFolder:WaitForChild("EndStagePreview")).OnClientEvent:Connect(function(preview)
	preview.SurfaceGui.Lanes:ClearAllChildren()
	preview:SetAttribute(Constants.Attributes.StagePreview.IsOngoing, nil)
end);
(eventsFolder:WaitForChild("StartStagePreview")).OnClientEvent:Connect(function(preview)
	preview:SetAttribute(Constants.Attributes.StagePreview.IsOngoing, true)
end)
