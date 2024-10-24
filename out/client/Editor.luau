-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local Players = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").Players
local MainGameplay = TS.import(script, script.Parent, "MainGameplay")
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local screenGui = playerGui:WaitForChild("ScreenGui")
local hasInitialized = false
local function init()
	if hasInitialized then
		return nil
	end
	hasInitialized = true
	local editorUI = screenGui.Editor
	local chart = {
		metadata = {
			title = "--",
			audioName = "--",
			setName = "--",
			description = "--",
			difficulty = "--",
			source = "--",
			artist = "--",
			mappers = {},
			searchTags = {},
			totalLanes = -1,
		},
		difficulty = {
			damageRate = -1,
			maxHealth = 10,
			overallDifficulty = -1,
		},
		timings = {},
		events = {},
		notes = {},
	}
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
					otherTab.BackgroundColor3 = if isSelected then Color3.fromRGB(55, 55, 55) else Color3.fromRGB(45, 45, 45)
					underline.Visible = isSelected
				end
			end
		end)
	end
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
	-- dropdownInput<'metadata'>(editorUI.Content.Metadata.Set, 'setName');
	editorUI.RefreshPreview.MouseButton1Click:Connect(function()
		for _, lane in editorUI.Lanes:GetChildren() do
			if lane:IsA("CanvasGroup") then
				lane:Destroy()
			end
		end
		for lane = 1, chart.metadata.totalLanes do
		end
	end)
	editorUI.Visible = true
end
return {
	init = init,
}
