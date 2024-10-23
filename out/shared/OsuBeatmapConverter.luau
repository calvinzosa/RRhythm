-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local HttpService = _services.HttpService
local Workspace = _services.Workspace
local StringUtils = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "string-utils")
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local Constants = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants").Constants
local function mapNumbers(number)
	local _condition = tonumber(number)
	if _condition == nil then
		_condition = 0
	end
	return _condition
end
local function parse(beatmap, log)
	if log == nil then
		log = false
	end
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
	local currentSection = nil
	for _, line in ipairs(string.split(beatmap, "\n")) do
		if #line == 0 or StringUtils.startsWith(line, "//") then
			continue
		end
		if StringUtils.startsWith(line, "[") and StringUtils.endsWith(line, "]") then
			currentSection = string.sub(line, 2, -2)
		else
			local _binding = string.split(line, ":")
			local propertyName = _binding[1]
			local value = _binding[2]
			if currentSection == "Metadata" then
				if propertyName == "TitleUnicode" then
					chart.metadata.title = value
				elseif propertyName == "ArtistUnicode" then
					chart.metadata.artist = value
				elseif propertyName == "Creator" then
					local _exp = chart.metadata.mappers
					table.insert(_exp, value)
				elseif propertyName == "Tags" then
					local _exp = chart.metadata.searchTags
					table.insert(_exp, value)
				end
			elseif currentSection == "Difficulty" then
				if propertyName == "HPDrainRate" then
					local _condition = tonumber(value)
					if _condition == nil then
						_condition = 0
					end
					chart.difficulty.damageRate = math.clamp(_condition, 0, 10)
				elseif propertyName == "OverallDifficulty" then
					local _condition = tonumber(value)
					if _condition == nil then
						_condition = 0
					end
					chart.difficulty.overallDifficulty = math.clamp(_condition, 0, 10)
				elseif propertyName == "CircleSize" then
					local _condition = tonumber(value)
					if _condition == nil then
						_condition = 5
					end
					chart.metadata.totalLanes = math.round(_condition)
				end
			elseif currentSection == "TimingPoints" then
				local _exp = string.split(line, ",")
				-- ▼ ReadonlyArray.map ▼
				local _newValue = table.create(#_exp)
				for _k, _v in _exp do
					_newValue[_k] = mapNumbers(_v, _k - 1, _exp)
				end
				-- ▲ ReadonlyArray.map ▲
				local _binding_1 = _newValue
				local millisecond = _binding_1[1]
				local beatLength = _binding_1[2]
				local meter = _binding_1[3]
				local sampleSet = _binding_1[4]
				local sampleIndex = _binding_1[5]
				local volume = _binding_1[6]
				local uninherited = _binding_1[7]
				local effects = _binding_1[8]
				if uninherited == 1 then
					local _timings = chart.timings
					local _arg0 = {
						millisecond = millisecond,
						type = 0,
						bpm = 60000 / beatLength,
						volume = volume,
					}
					table.insert(_timings, _arg0)
				else
					local _timings = chart.timings
					local _arg0 = {
						millisecond = millisecond,
						type = 0,
						scrollSpeed = -100 / beatLength,
						volume = volume,
					}
					table.insert(_timings, _arg0)
				end
			elseif currentSection == "HitObjects" then
				local _exp = string.split((string.gsub(line, ":", ",")), ",")
				-- ▼ ReadonlyArray.map ▼
				local _newValue = table.create(#_exp)
				for _k, _v in _exp do
					_newValue[_k] = mapNumbers(_v, _k - 1, _exp)
				end
				-- ▲ ReadonlyArray.map ▲
				local _binding_1 = _newValue
				local noteX = _binding_1[1]
				local noteY = _binding_1[2]
				local noteMillisecond = _binding_1[3]
				local noteType = _binding_1[4]
				local noteHitSound = _binding_1[5]
				local noteEndMillisecond = _binding_1[6]
				local lane = math.clamp(math.floor(noteX * chart.metadata.totalLanes / 512), 0, chart.metadata.totalLanes - 1)
				if (bit32.band(noteType, Constants.OsuFile.NoteType.HoldNote)) ~= 0 then
					local _notes = chart.notes
					local _arg0 = {
						millisecond = noteMillisecond,
						type = 1,
						lane = lane,
						holdLength = noteEndMillisecond - noteMillisecond,
					}
					table.insert(_notes, _arg0)
				elseif (bit32.band(noteType, Constants.OsuFile.NoteType.NormalNote)) ~= 0 then
					local _notes = chart.notes
					local _arg0 = {
						millisecond = noteMillisecond,
						type = 0,
						lane = lane,
					}
					table.insert(_notes, _arg0)
				end
			elseif currentSection == "General" then
				if propertyName == "AudioFilename" then
					chart.metadata.audioName = StringUtils.trim(value)
				end
			end
		end
	end
	if log then
		local maxLength = 199000
		local encodedData = HttpService:JSONEncode(chart)
		local i = 0
		while #encodedData > 0 do
			local chunk = string.sub(encodedData, 1, maxLength)
			local value = Instance.new("StringValue")
			value.Value = chunk
			value.Name = `Chunk{i}`
			value.Parent = Workspace
			encodedData = string.sub(encodedData, maxLength + 1)
			i += 1
		end
	end
	return chart
end
return {
	parse = parse,
}
