-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local ReplicatedStorage = _services.ReplicatedStorage
local Workspace = _services.Workspace
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local Stages = TS.import(script, game:GetService("ServerScriptService"), "Server", "Stages")
local Attributes = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants").Attributes
local eventsFolder = ReplicatedStorage:WaitForChild("Events")
local stagesFolder = Workspace:WaitForChild("Stages")
for _, stageType in stagesFolder:GetChildren() do
	for _1, stage in stageType:GetChildren() do
		stage:SetAttribute(Attributes.Stage.Status, "Waiting")
	end
end
Stages.init()
eventsFolder.JoinStage.OnServerEvent:Connect(function(player, stage, playerNumber)
	local _stage = stage
	local _condition = not (typeof(_stage) == "Instance")
	if not _condition then
		_condition = not stage:IsA("Model")
		if not _condition then
			local _result = stage.Parent
			if _result ~= nil then
				_result = _result.Parent
			end
			_condition = _result ~= stagesFolder
		end
	end
	if _condition then
		return nil
	end
	local _playerNumber = playerNumber
	local _condition_1 = not (type(_playerNumber) == "number")
	if not _condition_1 then
		_condition_1 = (playerNumber ~= 1 and playerNumber ~= 2)
	end
	if _condition_1 then
		return nil
	end
	local character = player.Character
	local _result = character
	if _result ~= nil then
		_result = _result:FindFirstChild("HumanoidRootPart")
	end
	local rootPart = _result
	local _result_1 = rootPart
	if _result_1 ~= nil then
		_result_1 = _result_1:FindFirstChild("RootAttachment")
	end
	local rootAttachment = _result_1
	if not character or not rootPart or not rootAttachment then
		return nil
	end
	if stage:GetAttribute(Attributes.Stage.Status) ~= "Waiting" then
		return nil
	end
	print("[src/server/index.server.ts:30]", `Attaching {player.Name} to '{stage.Parent.Name}' stage as Player{playerNumber}`)
	Stages.attachPlayer(player, character, rootPart, rootAttachment, playerNumber, stage)
	Stages.updateStage(stage)
end)
eventsFolder.ChooseSong.OnServerInvoke = function(player, song)
	local _condition = (song ~= "<None>" and song ~= "<Exit>")
	if _condition then
		local _song = song
		local _condition_1 = not (typeof(_song) == "Instance")
		if not _condition_1 then
			_condition_1 = not song:IsA("ModuleScript")
		end
		_condition = _condition_1
	end
	if _condition then
		return false
	end
	local didSet = Stages.selectSong(player, song)
	if didSet then
		return "selected"
	end
	return false
end
