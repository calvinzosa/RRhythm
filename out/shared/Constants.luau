-- Compiled with roblox-ts v3.0.0
local Constants = {}
do
	local _container = Constants
	local OsuFile = {}
	do
		local _container_1 = OsuFile
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
		_container_1.NoteType = NoteType
	end
	_container.OsuFile = OsuFile
	local ImageIds = {}
	do
		local _container_1 = ImageIds
		local RankImages = {
			X = "rbxassetid://77723793937127",
			S = "rbxassetid://134774167253219",
			A = "rbxassetid://133894751806162",
			B = "rbxassetid://74910966303660",
			C = "rbxassetid://86986699918371",
			D = "rbxassetid://71384548149260",
		}
		_container_1.RankImages = RankImages
	end
	_container.ImageIds = ImageIds
	local Attributes = {}
	do
		local _container_1 = Attributes
		local Character = {
			IsAttachedStage = "IsAttachedStage",
			StagePlayerNumber = "StagePlayerNumber",
		}
		_container_1.Character = Character
		local Stage = {
			Status = "Status",
		}
		_container_1.Stage = Stage
		local StagePreview = {
			IsOngoing = "IsOngoing",
		}
		_container_1.StagePreview = StagePreview
	end
	_container.Attributes = Attributes
end
return {
	Constants = Constants,
}
