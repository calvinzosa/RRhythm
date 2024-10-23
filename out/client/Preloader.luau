-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local ContentProvider = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").ContentProvider
local Constants = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants")
local function preload()
	local content = {}
	for _, imageId in pairs(Constants.ImageIds.RankImages) do
		table.insert(content, imageId)
		local imageLabel = Instance.new("ImageLabel")
		imageLabel.Image = imageId
		table.insert(content, imageLabel)
	end
	ContentProvider:PreloadAsync(content, function(contentId, status)
		return print("[src/client/Preloader.ts:19]", `Loaded '{contentId}' with status {status.Name}`)
	end)
	for _, instance in content do
		if typeof(instance) == "Instance" then
			instance:Destroy()
		end
	end
end
return {
	preload = preload,
}
