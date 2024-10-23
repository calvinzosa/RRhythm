-- Compiled with roblox-ts v3.0.0
local OsuFile = {}
do
	local _container = OsuFile
	local NoteType
	do
		local _inverse = {}
		NoteType = setmetatable({}, {
			__index = _inverse,
		})
		NoteType.NormalNote = 1
		_inverse[1] = "NormalNote"
		NoteType.HoldNote = 128
		_inverse[128] = "HoldNote"
	end
	_container.NoteType = NoteType
end
local ImageIds = {}
do
	local _container = ImageIds
	local RankImages = {
		X = "rbxassetid://77723793937127",
		S = "rbxassetid://134774167253219",
		A = "rbxassetid://133894751806162",
		B = "rbxassetid://74910966303660",
		C = "rbxassetid://86986699918371",
		D = "rbxassetid://71384548149260",
	}
	_container.RankImages = RankImages
end
local Attributes = {}
do
	local _container = Attributes
	local Character = {
		IsAttachedStage = "IsAttachedStage",
		StagePlayerNumber = "StagePlayerNumber",
	}
	_container.Character = Character
	local Stage = {
		Status = "Status",
	}
	_container.Stage = Stage
	local StagePreview = {
		IsOngoing = "IsOngoing",
	}
	_container.StagePreview = StagePreview
end
return {
	OsuFile = OsuFile,
	ImageIds = ImageIds,
	Attributes = Attributes,
}
