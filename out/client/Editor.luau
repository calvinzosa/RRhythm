-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
local RunService = _services.RunService
local Workspace = _services.Workspace
local MainGameplay = TS.import(script, script.Parent, "MainGameplay")
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local UserInput = TS.import(script, script.Parent, "UserInput")
local camera = Workspace.CurrentCamera or Workspace:WaitForChild("Camera")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local screenGui = playerGui:WaitForChild("ScreenGui")
local skinsFolder = ReplicatedStorage:WaitForChild("Skins")
local hasInitialized = false
local function init()
	if hasInitialized then
		return nil
	end
	hasInitialized = true
	camera.CameraType = Enum.CameraType.Scriptable
	local editorUI = screenGui.Editor
	local chart = {
		metadata = {
			title = "Example Chart",
			audioName = "--",
			setName = "--",
			description = "--",
			difficulty = "--",
			source = "--",
			artist = "--",
			mappers = {},
			searchTags = {},
			totalLanes = 4,
		},
		difficulty = {
			damageRate = 2,
			maxHealth = 10,
			overallDifficulty = 0,
		},
		timings = {},
		events = {},
		notes = {},
	}
	local editorSkinFolder = skinsFolder:WaitForChild("Editor")
	local laneFrames = {}
	local laneTemplates = {}
	local noteTravelTime = 1500
	local laneWidth = 70
	local hitPosition = 400
	local lanePadding = 0
	local playedNotes = {}
	local visibleNotes = {}
	local currentMillisecond = 0
	local beatSnapDivisor = 4
	local numShownBeats = 10
	local isPlaying = false
	local playingStartTime = os.clock()
	local music = nil
	for _, tab in editorUI.Content.Tabs.Content:GetChildren() do
		if not tab:IsA("TextButton") then
			continue
		end
		tab.MouseButton1Click:Connect(function()
			for _1, frame in editorUI.Content:GetChildren() do
				if not frame:IsA("ScrollingFrame") then
					continue
				end
				frame.Visible = (frame.Name == tab.Name)
			end
			for _1, otherTab in editorUI.Content.Tabs.Content:GetChildren() do
				if not otherTab:IsA("TextButton") then
					continue
				end
				local underline = otherTab:FindFirstChild("Underline")
				local _result = underline
				if _result ~= nil then
					_result = _result:IsA("Frame")
				end
				if _result then
					local isSelected = (otherTab.Name == tab.Name)
					otherTab.AutoButtonColor = not isSelected
					otherTab.BackgroundColor3 = if isSelected then Color3.fromRGB(75, 75, 75) else Color3.fromRGB(65, 65, 65)
					underline.Visible = isSelected
				end
			end
		end)
	end
	local refreshPreview
	local function textInput(input, category, property, filter)
		input.Value.FocusLost:Connect(function()
			input.Value.Text = if filter then filter(input.Value.ContentText) else input.Value.Text
			local _arg0 = chart[category][property]
			if type(_arg0) == "number" then
				local _condition = tonumber(input.Value.Text)
				if _condition == nil then
					_condition = 0
				end
				chart[category][property] = _condition
			else
				chart[category][property] = input.Value.Text
			end
			refreshPreview()
		end)
	end
	local function listInput(list, category, property)
		local template = list.List.Template:Clone()
		list.List.Template:Destroy()
		list.List.Value.Add.MouseButton1Click:Connect(function()
			if #list.List.Value.ContentText == 0 then
				return nil
			end
			local item = template:Clone()
			item.Text = list.List.Value.ContentText
			item.Parent = list.List
			item.MouseButton1Click:Connect(function()
				local _exp = (chart[category][property])
				local _text = item.Text
				local index = (table.find(_exp, _text) or 0) - 1
				if index >= 0 then
					table.remove((chart[category][property]), index + 1)
				end
				item:Destroy()
			end)
			list.List.Value.Text = ""
			local _exp = (chart[category][property])
			local _text = item.Text
			table.insert(_exp, _text)
			refreshPreview()
		end)
	end
	local function dropdownInput(dropdown, category, property, items)
		local dropdownTemplate = ReplicatedStorage:WaitForChild("Templates"):WaitForChild("DropdownItem")
		for _, text in items do
			local button = dropdownTemplate:Clone()
			button.Text = text
			button.Parent = dropdown.Dropdown.Items
			button.MouseButton1Click:Connect(function()
				chart[category][property] = text
				refreshPreview()
				dropdown.Dropdown.Text = text
				dropdown.Dropdown.Items.Visible = false
				dropdown.Dropdown.Arrow.Rotation = -45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.025, 0, 0.5, 0)
				dropdown.ZIndex = 1
			end)
		end
		dropdown.Dropdown.MouseButton1Click:Connect(function()
			dropdown.Dropdown.Items.Visible = not dropdown.Dropdown.Items.Visible
			if dropdown.Dropdown.Items.Visible then
				dropdown.Dropdown.Arrow.Rotation = 45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.05, 0, 0.5, 0)
				dropdown.ZIndex = 2
			else
				dropdown.Dropdown.Arrow.Rotation = -45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.025, 0, 0.5, 0)
				dropdown.ZIndex = 1
			end
		end)
	end
	local function dropdownInputCallback(dropdown, items, callback)
		local dropdownTemplate = ReplicatedStorage:WaitForChild("Templates"):WaitForChild("DropdownItem")
		for _, text in items do
			local button = dropdownTemplate:Clone()
			button.Text = text
			button.Parent = dropdown.Dropdown.Items
			button.MouseButton1Click:Connect(function()
				callback(text)
				dropdown.Dropdown.Text = text
				dropdown.Dropdown.Items.Visible = false
				dropdown.Dropdown.Arrow.Rotation = -45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.025, 0, 0.5, 0)
				dropdown.ZIndex = 1
			end)
		end
		dropdown.Dropdown.MouseButton1Click:Connect(function()
			dropdown.Dropdown.Items.Visible = not dropdown.Dropdown.Items.Visible
			if dropdown.Dropdown.Items.Visible then
				dropdown.Dropdown.Arrow.Rotation = 45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.05, 0, 0.5, 0)
				dropdown.ZIndex = 2
			else
				dropdown.Dropdown.Arrow.Rotation = -45
				dropdown.Dropdown.Arrow.Position = UDim2.new(0.025, 0, 0.5, 0)
				dropdown.ZIndex = 1
			end
		end)
	end
	local function createNumberFilter(round, min, max, defaultValue)
		local function empty(number)
			return number
		end
		local roundFunc = if round then math.round else empty
		return function(text)
			local _condition = tonumber(text)
			if _condition == nil then
				_condition = tonumber((string.gsub(text, "[^%d]", "")))
				if _condition == nil then
					_condition = defaultValue
				end
			end
			return tostring(roundFunc(math.clamp(_condition, min, max)))
		end
	end
	local updateNotes
	function refreshPreview()
		for _, lane in editorUI.Lanes:GetChildren() do
			if lane:IsA("CanvasGroup") then
				lane:Destroy()
			end
		end
		editorUI.Content.Metadata.Title.Value.Text = chart.metadata.title
		editorUI.Content.Metadata.AudioName.Value.Text = chart.metadata.audioName
		editorUI.Content.Metadata.Description.Value.Text = chart.metadata.description
		editorUI.Content.Metadata.Set.Dropdown.Text = chart.metadata.setName
		editorUI.Content.Metadata.Difficulty.Value.Text = chart.metadata.difficulty
		editorUI.Content.Metadata.OverallDifficulty.Value.Text = tostring(chart.difficulty.overallDifficulty)
		editorUI.Content.Metadata.LaneCount.Value.Text = tostring(chart.metadata.totalLanes)
		editorUI.Content.Metadata.Source.Value.Text = chart.metadata.source
		editorUI.Content.Metadata.Artist.Value.Text = chart.metadata.artist
		for _, item in editorUI.Content.Metadata.Mappers.List:GetChildren() do
			if item:IsA("TextButton") then
				item:Destroy()
			end
		end
		for _, item in editorUI.Content.Metadata.Tags.List:GetChildren() do
			if item:IsA("TextButton") then
				item:Destroy()
			end
		end
		table.clear(laneTemplates)
		for _, subKeyFolder in editorSkinFolder:GetChildren() do
			if not subKeyFolder:IsA("Folder") then
				continue
			end
			TS.try(function()
				local lanes = MainGameplay.parseSubKeyName(subKeyFolder.Name, chart.metadata.totalLanes)
				for _1, lane in lanes do
					laneTemplates[lane] = {
						Lane = subKeyFolder:FindFirstChild("Lane"),
						Note = subKeyFolder:FindFirstChild("Note"),
						HoldNote = subKeyFolder:FindFirstChild("HoldNote"),
						TailNote = subKeyFolder:FindFirstChild("TailNote"),
						BodyNote = subKeyFolder:FindFirstChild("BodyNote"),
					}
				end
			end, function(err) end)
		end
		for i = 1, chart.metadata.totalLanes do
			if laneTemplates[i] == nil then
				laneTemplates[i] = {
					Lane = skinsFolder:FindFirstChild("CirclesV1"):FindFirstChild("1>-3,-1&-1"):FindFirstChild("Lane"),
					Note = skinsFolder:FindFirstChild("CirclesV1"):FindFirstChild("1>-3,-1&-1"):FindFirstChild("Note"),
					HoldNote = skinsFolder:FindFirstChild("CirclesV1"):FindFirstChild("1>-3,-1&-1"):FindFirstChild("HoldNote"),
					TailNote = skinsFolder:FindFirstChild("CirclesV1"):FindFirstChild("1>-3,-1&-1"):FindFirstChild("TailNote"),
					BodyNote = skinsFolder:FindFirstChild("CirclesV1"):FindFirstChild("1>-3,-1&-1"):FindFirstChild("BodyNote"),
				}
			end
		end
		local setFolder = ReplicatedStorage:WaitForChild("Songs"):FindFirstChild(chart.metadata.setName)
		local _songFolder = setFolder
		if _songFolder ~= nil then
			_songFolder = _songFolder:FindFirstChild(chart.metadata.title)
		end
		local songFolder = _songFolder
		local _audio = songFolder
		if _audio ~= nil then
			_audio = _audio:FindFirstChild(chart.metadata.audioName)
		end
		local audio = _audio
		local _result = audio
		if _result ~= nil then
			_result = _result:IsA("Sound")
		end
		if _result then
			music = audio
		else
			music = nil
		end
		local totalLanes = chart.metadata.totalLanes
		for _, lane in laneFrames do
			lane:Destroy()
		end
		table.clear(laneFrames)
		for i = 1, totalLanes do
			local lane = laneTemplates[i].Lane:Clone()
			lane.Name = tostring(i)
			lane.ZIndex = i
			lane.Size = UDim2.new(0, laneWidth, 1, 0)
			lane.Position = UDim2.new(0, (editorUI.Lanes.AbsoluteSize.X / 2) - laneWidth * (totalLanes / 2 - i + 1), 0, 0)
			lane.UIPadding.PaddingLeft = UDim.new(0, lanePadding)
			lane.UIPadding.PaddingRight = UDim.new(0, lanePadding)
			lane.JudgementLine.Position = UDim2.new(0.5, 0, hitPosition / 480, 0)
			lane.Parent = editorUI.Lanes
			table.insert(laneFrames, lane)
		end
		updateNotes()
	end
	local function calculateYOffset(noteMillisecond, laneHeight)
		return ((currentMillisecond + noteTravelTime - noteMillisecond) / noteTravelTime) * (laneHeight * (hitPosition / 480) - laneWidth)
	end
	function updateNotes()
		for i, noteData in ipairs(chart.notes) do
			local laneContainer = laneFrames[noteData.lane % chart.metadata.totalLanes + 1]
			local laneHeight = laneContainer.AbsoluteSize.Y
			local laneWidth = laneContainer.AbsoluteSize.X
			local template = laneTemplates[noteData.lane % chart.metadata.totalLanes + 1]
			local yOffset = calculateYOffset(noteData.millisecond, laneHeight)
			local tailOffset = 0
			if noteData.type == 1 then
				tailOffset = calculateYOffset(noteData.millisecond + noteData.holdLength, laneHeight)
			end
			if (yOffset >= 0 and yOffset < laneHeight) or (noteData.type == 1 and tailOffset >= 0 and tailOffset < laneHeight) or (noteData.type == 1 and yOffset > laneHeight and tailOffset < 0) then
				if noteData.type == 0 then
					local note = laneContainer.Notes:FindFirstChild(`{i}.0`)
					if not note then
						note = template.Note:Clone()
						note.Name = `{i}.0`
						note.Parent = laneContainer.Notes
					end
					note.Position = UDim2.new(0, 0, 0, math.round(yOffset))
				elseif noteData.type == 1 then
					local holdNote = laneContainer.Notes:FindFirstChild(`{i}.0`)
					if not holdNote then
						holdNote = template.HoldNote:Clone()
						holdNote.Name = `{i}.0`
						holdNote.Parent = laneContainer.Notes
					end
					holdNote.Position = UDim2.new(0, 0, 0, math.round(yOffset))
					local tailNote = laneContainer.Notes:FindFirstChild(`{i}.2`)
					if not tailNote then
						tailNote = template.HoldNote:Clone()
						tailNote.Name = `{i}.2`
						tailNote.Parent = laneContainer.Notes
					end
					tailNote.Position = UDim2.new(0, 0, 0, math.round(tailOffset))
					local bodyNote = laneContainer.Notes:FindFirstChild(`{i}.1`)
					if not bodyNote then
						bodyNote = template.BodyNote:Clone()
						bodyNote.Name = `{i}.1`
						bodyNote.Parent = laneContainer.Notes
					end
					local topOffset = holdNote.Position.Y.Offset
					local bottomOffset = tailNote.Position.Y.Offset
					local _arg0 = template.BodyNote:GetAttribute("OffsetTop")
					if type(_arg0) == "number" then
						bottomOffset += math.round(laneWidth * (template.BodyNote:GetAttribute("OffsetTop")))
					end
					local _arg0_1 = template.BodyNote:GetAttribute("OffsetBottom")
					if type(_arg0_1) == "number" then
						topOffset += math.round(laneWidth * (template.BodyNote:GetAttribute("OffsetBottom")))
					end
					bodyNote.Position = UDim2.new(0, 0, 0, bottomOffset)
					bodyNote.Size = UDim2.new(1, 0, 0, topOffset - bottomOffset)
				end
				if not (visibleNotes[i] ~= nil) then
					visibleNotes[i] = noteData
				end
			else
				local _result = laneContainer.Notes:FindFirstChild(`{i}.0`)
				if _result ~= nil then
					_result:Destroy()
				end
				if noteData.type == 1 then
					local _result_1 = laneContainer.Notes:FindFirstChild(`{i}.1`)
					if _result_1 ~= nil then
						_result_1:Destroy()
					end
					local _result_2 = laneContainer.Notes:FindFirstChild(`{i}.2`)
					if _result_2 ~= nil then
						_result_2:Destroy()
					end
				end
				visibleNotes[i] = nil
				if noteData.millisecond > currentMillisecond then
					break
				end
			end
		end
	end
	textInput(editorUI.Content.Metadata.Title, "metadata", "title")
	textInput(editorUI.Content.Metadata.AudioName, "metadata", "audioName")
	textInput(editorUI.Content.Metadata.Description, "metadata", "description")
	textInput(editorUI.Content.Metadata.Difficulty, "metadata", "difficulty")
	textInput(editorUI.Content.Metadata.OverallDifficulty, "difficulty", "overallDifficulty", createNumberFilter(false, 0, 100, 0))
	textInput(editorUI.Content.Metadata.LaneCount, "metadata", "totalLanes", createNumberFilter(true, 1, 20, 4))
	textInput(editorUI.Content.Metadata.Source, "metadata", "source")
	textInput(editorUI.Content.Metadata.Artist, "metadata", "artist")
	listInput(editorUI.Content.Metadata.Mappers, "metadata", "mappers")
	listInput(editorUI.Content.Metadata.Tags, "metadata", "searchTags")
	local songSets = {}
	for _, set in ReplicatedStorage:WaitForChild("Songs"):GetChildren() do
		if set:IsA("Folder") then
			local _name = set.Name
			table.insert(songSets, _name)
		end
	end
	dropdownInput(editorUI.Content.Metadata.Set, "metadata", "setName", songSets)
	local allCharts = {}
	local songsList = {}
	for _, set in ReplicatedStorage:WaitForChild("Songs"):GetChildren() do
		if not set:IsA("Folder") then
			continue
		end
		for _1, song in set:GetChildren() do
			if not song:IsA("Folder") then
				continue
			end
			for _2, difficulty in song:GetChildren() do
				if difficulty:IsA("ModuleScript") then
					local key = `'{song.Name}' [{difficulty}] in '{set.Name}'`
					allCharts[key] = difficulty
					table.insert(songsList, key)
				end
			end
		end
	end
	local selectedSongTarget = nil
	dropdownInputCallback(editorUI.Content.Load.Target, songsList, function(song)
		local _song = song
		selectedSongTarget = allCharts[_song]
	end)
	editorUI.Lanes.InputChanged:Connect(function(input)
		if input.UserInputType == Enum.UserInputType.MouseWheel then
			local delta = math.sign(input.Position.Z)
			currentMillisecond += delta * 500
			table.clear(playedNotes)
		end
	end)
	editorUI.Content.Load.Load.MouseButton1Click:Connect(function()
		if not selectedSongTarget then
			return nil
		end
		TS.try(function()
			chart = MainGameplay.loadSongModule(selectedSongTarget)
			editorUI.Content.Load.Load.Text = "Loaded!"
			task.delay(0.2, function()
				local _exp = editorUI.Content.Load.Load
				_exp.Text = "Load chart!"
				return _exp.Text
			end)
			refreshPreview()
		end, function(err) end)
	end)
	editorUI.RefreshPreview.MouseButton1Click:Connect(function()
		refreshPreview()
	end)
	local pauseHotkey = UserInput.Hotkey.new("EditorPlaybackToggle", Enum.KeyCode.Space)
	pauseHotkey:onPress(function()
		isPlaying = not isPlaying
		table.clear(playedNotes)
		if isPlaying then
			playingStartTime = os.clock() - currentMillisecond / 1000
			if music then
				music:Play()
				music.TimePosition = currentMillisecond / 1000
			end
		else
			if music then
				music:Stop()
			end
		end
	end)
	editorUI.Visible = true
	refreshPreview()
	RunService:BindToRenderStep("EditorUpdate", Enum.RenderPriority.Last.Value + 10, function(dt)
		if isPlaying then
			currentMillisecond = math.floor((os.clock() - playingStartTime) * 1000)
			for i, note in visibleNotes do
				local laneHeight = laneFrames[note.lane % chart.metadata.totalLanes + 1].AbsoluteSize.Y
				local yOffset = calculateYOffset(note.millisecond, laneHeight)
				if not (playedNotes[i] ~= nil) and yOffset >= laneHeight * (hitPosition / 480) - laneWidth then
					local sound = (ReplicatedStorage:WaitForChild("normal-hitnormal")):Clone()
					sound.Parent = Workspace
					sound:Destroy()
					playedNotes[i] = true
				end
			end
		end
		updateNotes()
		editorUI.Info.Milliseconds.Text = `{currentMillisecond}ms`
	end)
end
return {
	init = init,
}
