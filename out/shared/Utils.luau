-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
--[[
	*
	 * Recursively calls `table.freeze` on a table and its' sub-tables
	 * @param tableObject The table to deep freeze recursively
	 * @returns `void`
	 
]]
local function deepFreeze(tableObject)
	table.freeze(tableObject)
	for _, value in tableObject do
		if type(value) == "table" then
			deepFreeze(value)
		end
	end
end
--[[
	*
	 * Adds commas to numbers every 3 digits
	 * @param number The number to format
	 * @returns Formatted number
	 
]]
local function formatNumber(number)
	return if number >= 0 then (string.gsub(string.reverse((string.gsub(string.reverse(tostring(number)), "(%d%d%d)", "%1,"))), "^,", "")) else `-{formatNumber(number * -1)}`
end
--[[
	*
	 * Returns a random float between `min` and `max`
	 * @param min The mininum limit
	 * @param max The maximum limit
	 * @returns Random float between `min` and `max`
	 
]]
local function randomFloat(min, max)
	return math.random() * (max - min) + min
end
--[[
	*
	 * Calls `:Destroy()` on an instance after a given amount of seconds
	 * @param instance The instance or array of instances to destroy
	 * @param seconds How long to wait until `:Destroy()` is called
	 * @returns `void`
	 
]]
local destroyAfter = TS.async(function(instance, seconds)
	return TS.Promise.new(function(resolve)
		task.delay(seconds, function()
			local _instance = instance
			if typeof(_instance) == "Instance" then
				instance:Destroy()
			else
				for _, otherInstance in instance do
					otherInstance:Destroy()
				end
			end
			resolve()
		end)
	end)
end)
return {
	deepFreeze = deepFreeze,
	formatNumber = formatNumber,
	randomFloat = randomFloat,
	destroyAfter = destroyAfter,
}
