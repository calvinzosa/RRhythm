-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
local LZWCompression = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "LZWCompression").default
local Constants = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants").Constants
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local Compression = LZWCompression.new()
local eventsFolder = ReplicatedStorage:WaitForChild("Events")
local selectedPlayerSongs = {}
local activePreviews = {}
local activeSongs = {}
local function attachPlayer(player, character, rootPart, rootAttachment, playerNumber, stage)
	if stage:GetAttribute(Constants.Attributes.Stage.Status) ~= "Waiting" then
		return nil
	end
	local stagePlayer = stage:FindFirstChild(`Player{playerNumber}`)
	if not stagePlayer then
		return nil
	end
	if character:GetAttribute(Constants.Attributes.Character.IsAttachedStage) == nil then
		stagePlayer.Trigger.Enabled = false
		stagePlayer.RigidConstraint.Attachment1 = rootAttachment
		stagePlayer.Character.Value = character
		local _result = player.Character
		if _result ~= nil then
			_result:SetAttribute(Constants.Attributes.Character.StagePlayerNumber, playerNumber)
		end
		character:SetAttribute(Constants.Attributes.Character.IsAttachedStage, true)
	else
		stagePlayer.Trigger.Enabled = true
		stagePlayer.RigidConstraint.Attachment1 = nil
		stagePlayer.Character.Value = nil
		local _result = player.Character
		if _result ~= nil then
			_result:SetAttribute(Constants.Attributes.Character.StagePlayerNumber, nil)
		end
		character:SetAttribute(Constants.Attributes.Character.IsAttachedStage, nil)
	end
end
local function selectSong(player, song)
	print("[src/server/Stages.ts:55]", `{player.Name} selected '{song}'`)
	local _player = player
	local _song = song
	selectedPlayerSongs[_player] = _song
	return true
end
local function updateStage(stage)
	local players = {}
	local _result = stage.Parent
	if _result ~= nil then
		_result = _result.Name
	end
	if _result == "1Player" then
		local _result_1 = stage:FindFirstChild("Player1")
		if _result_1 ~= nil then
			_result_1 = _result_1:FindFirstChild("Character")
		end
		local _result_2 = _result_1
		if _result_2 ~= nil then
			_result_2 = _result_2.Value
		end
		local character1 = _result_2
		local _result_3 = stage:FindFirstChild("Player2")
		if _result_3 ~= nil then
			_result_3 = _result_3:FindFirstChild("Character")
		end
		local _result_4 = _result_3
		if _result_4 ~= nil then
			_result_4 = _result_4.Value
		end
		local character2 = _result_4
		if character1 ~= nil then
			local player = Players:GetPlayerFromCharacter(character1)
			if player and not (table.find(players, player) ~= nil) then
				table.insert(players, player)
			end
		elseif character2 ~= nil then
			local player = Players:GetPlayerFromCharacter(character2)
			if player and not (table.find(players, player) ~= nil) then
				table.insert(players, player)
			end
		end
	end
	if #players == 0 then
		return print("[src/server/Stages.ts:76]", "no players")
	end
	stage:SetAttribute(Constants.Attributes.Stage.Status, "Choosing")
	for _, player in players do
		eventsFolder.StartSongSelection:FireClient(player)
	end
	while true do
		task.wait(0.5)
		local hasAllChosen = true
		for _, player in players do
			if not (selectedPlayerSongs[player] ~= nil) then
				hasAllChosen = false
				break
			end
		end
		if hasAllChosen then
			break
		end
	end
	local availableSongs = {}
	for _, player in players do
		local song = selectedPlayerSongs[player]
		if song == "<Exit>" then
			print("[src/server/Stages.ts:103]", "Exiting stage")
			stage:SetAttribute(Constants.Attributes.Stage.Status, "Waiting")
			for _1, otherPlayer in players do
				selectedPlayerSongs[otherPlayer] = nil
				local character = otherPlayer.Character
				local _result_1 = character
				if _result_1 ~= nil then
					_result_1 = _result_1:FindFirstChild("HumanoidRootPart")
				end
				local rootPart = _result_1
				local _result_2 = rootPart
				if _result_2 ~= nil then
					_result_2 = _result_2:FindFirstChild("RootAttachment")
				end
				local rootAttachment = _result_2
				if character and rootPart and rootAttachment and character:GetAttribute(Constants.Attributes.Character.IsAttachedStage) == true then
					local _condition = character:GetAttribute(Constants.Attributes.Character.StagePlayerNumber)
					if _condition == nil then
						_condition = 1
					end
					attachPlayer(otherPlayer, character, rootPart, rootAttachment, _condition, stage)
					print("[src/server/Stages.ts:123]", `De-attached {otherPlayer.Name}`)
				end
				activeSongs[player] = nil
				activePreviews[player] = nil
				eventsFolder.EndSongSelection:FireClient(otherPlayer)
			end
			return nil
		end
		if song ~= nil and song ~= "<None>" then
			table.insert(availableSongs, song)
		end
		selectedPlayerSongs[player] = nil
	end
	local chosenSong = nil
	if #availableSongs > 0 then
		chosenSong = availableSongs[math.random(#players)]
	else
		chosenSong = nil
	end
	if chosenSong ~= nil then
		local chart = (require(chosenSong)).default
		stage.SongInfo.SurfaceGui.TextLabel.Text = `{chart.metadata.title} by {chart.metadata.artist} // {table.concat(chart.metadata.mappers, ", ")}`
		for _, player in players do
			local character = player.Character
			if not character then
				continue
			end
			local _condition = character:GetAttribute(Constants.Attributes.Character.StagePlayerNumber)
			if _condition == nil then
				_condition = 1
			end
			local playerNumber = _condition
			local preview = stage:FindFirstChild(`Preview{playerNumber}`)
			if preview ~= nil then
				eventsFolder.StartStagePreview:FireAllClients(preview)
				preview:SetAttribute(Constants.Attributes.StagePreview.IsOngoing, true)
				activeSongs[player] = chart
				local _arg1 = {
					preview = preview,
					module = chosenSong,
					totalScore = 0,
					accuracy = 0 / 0,
					notesMisses = 0,
					noteCombo = 0,
				}
				activePreviews[player] = _arg1
			end
		end
		task.wait(1.5)
		local length = 0
		for _, note in chart.notes do
			if note.millisecond > length then
				length = note.millisecond
			end
		end
		length += 6000
		stage:SetAttribute(Constants.Attributes.Stage.Status, "Playing")
		for _, player in players do
			eventsFolder.StageStartSong:FireClient(player, chosenSong, stage)
		end
		local startTime = os.clock()
		local currentTime = startTime
		while (currentTime - startTime) * 1000 < length do
			task.wait(0.5)
			currentTime = os.clock()
		end
	else
		for _, player in players do
			eventsFolder.EndSongSelection:FireClient(player)
		end
	end
	local _result_1 = stage.Parent
	if _result_1 ~= nil then
		_result_1 = _result_1.Name
	end
	print("[src/server/Stages.ts:197]", `Cleaning up '{_result_1}' stage`)
	stage:SetAttribute(Constants.Attributes.Stage.Status, "Waiting")
	for _, player in players do
		local character = player.Character
		local _result_2 = character
		if _result_2 ~= nil then
			_result_2 = _result_2:FindFirstChild("HumanoidRootPart")
		end
		local rootPart = _result_2
		local _result_3 = rootPart
		if _result_3 ~= nil then
			_result_3 = _result_3:FindFirstChild("RootAttachment")
		end
		local rootAttachment = _result_3
		if character and rootPart and rootAttachment and character:GetAttribute(Constants.Attributes.Character.IsAttachedStage) == true then
			local _condition = character:GetAttribute(Constants.Attributes.Character.StagePlayerNumber)
			if _condition == nil then
				_condition = 1
			end
			attachPlayer(player, character, rootPart, rootAttachment, _condition, stage)
		end
		local _result_4 = character
		if _result_4 ~= nil then
			_result_4 = _result_4:GetAttribute(Constants.Attributes.Character.StagePlayerNumber)
		end
		local _condition = _result_4
		if _condition == nil then
			_condition = 1
		end
		local playerNumber = _condition
		local preview = stage:FindFirstChild(`Preview{playerNumber}`)
		if preview ~= nil then
			eventsFolder.EndStagePreview:FireAllClients(preview)
			preview:SetAttribute(Constants.Attributes.StagePreview.IsOngoing, nil)
		end
		activePreviews[player] = nil
		activeSongs[player] = nil
	end
end
local function init()
	eventsFolder.UpdateStagePreview.OnServerEvent:Connect(function(player, updateData)
		local _updateData = updateData
		if not (type(_updateData) == "string") then
			return nil
		end
		local _exitType, _returns = TS.try(function()
			updateData = Compression:decompress(updateData)
		end, function(err)
			return TS.TRY_RETURN, {}
		end)
		if _exitType then
			return unpack(_returns)
		end
		local _player = player
		local actualPreview = activePreviews[_player]
		local _condition = not actualPreview
		if not _condition then
			local _value = actualPreview.preview:GetAttribute(Constants.Attributes.StagePreview.IsOngoing)
			_condition = not (_value ~= 0 and _value == _value and _value ~= "" and _value)
		end
		if _condition then
			return nil
		end
		for _, otherPlayer in Players:GetPlayers() do
			if otherPlayer.Character ~= nil and otherPlayer:DistanceFromCharacter(actualPreview.preview.Position) < 25 then
				eventsFolder.UpdateStagePreview:FireClient(otherPlayer, actualPreview.preview, updateData, actualPreview.module)
			end
		end
	end)
end
return {
	attachPlayer = attachPlayer,
	selectSong = selectSong,
	updateStage = updateStage,
	init = init,
}
