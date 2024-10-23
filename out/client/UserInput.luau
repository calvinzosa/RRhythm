-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local UserInputService = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services").UserInputService
local hotkeyObjects = {}
local Hotkey
do
	Hotkey = setmetatable({}, {
		__tostring = function()
			return "Hotkey"
		end,
	})
	Hotkey.__index = Hotkey
	function Hotkey.new(...)
		local self = setmetatable({}, Hotkey)
		return self:constructor(...) or self
	end
	function Hotkey:constructor(name, keyCode)
		self._onPress = {}
		self._onRelease = {}
		self.keyCode = keyCode
		self.name = name
		self.isPressed = false
		self.destroyed = false
		self.canPress = true
		local _name = name
		local _result = hotkeyObjects[_name]
		if _result ~= nil then
			_result:destroy()
		end
		local _name_1 = name
		local _self = self
		hotkeyObjects[_name_1] = _self
	end
	function Hotkey:onPress(callback)
		local __onPress = self._onPress
		local _callback = callback
		table.insert(__onPress, _callback)
	end
	function Hotkey:onRelease(callback)
		local __onRelease = self._onRelease
		local _callback = callback
		table.insert(__onRelease, _callback)
	end
	function Hotkey:press(fromInput)
		if fromInput == nil then
			fromInput = false
		end
		if self.isPressed or (not self.canPress and fromInput) then
			return nil
		end
		self.isPressed = true
		for _, callback in self._onPress do
			callback()
		end
	end
	function Hotkey:release(fromInput)
		if fromInput == nil then
			fromInput = false
		end
		if not self.isPressed or (not self.canPress and fromInput) then
			return nil
		end
		self.isPressed = false
		for _, callback in self._onRelease do
			callback()
		end
	end
	function Hotkey:destroy()
		table.clear(self._onPress)
		table.clear(self._onRelease)
		self.destroyed = true
		local _name = self.name
		hotkeyObjects[_name] = nil
	end
end
local function init()
	local activeKeys = {}
	local function clearAllActiveKeys()
		print("[src/client/UserInput.ts:61]", "Releasing all active hotkeys because player tabbed out of game window or focused onto a text box")
		if not (next(activeKeys) == nil) then
			for key in activeKeys do
				for _, hotkey in hotkeyObjects do
					if hotkey.keyCode == key then
						hotkey:release(true)
					end
				end
			end
			table.clear(activeKeys)
		end
	end
	UserInputService.InputBegan:Connect(function(input)
		local _condition = input.KeyCode ~= Enum.KeyCode.Unknown
		if _condition then
			local _keyCode = input.KeyCode
			_condition = not (activeKeys[_keyCode] ~= nil)
		end
		if _condition then
			local _keyCode = input.KeyCode
			activeKeys[_keyCode] = true
			for _, hotkey in hotkeyObjects do
				if hotkey.keyCode == input.KeyCode then
					hotkey:press(true)
				end
			end
		end
	end)
	UserInputService.InputEnded:Connect(function(input)
		local _condition = input.KeyCode ~= Enum.KeyCode.Unknown
		if _condition then
			local _keyCode = input.KeyCode
			_condition = activeKeys[_keyCode] ~= nil
		end
		if _condition then
			local _keyCode = input.KeyCode
			activeKeys[_keyCode] = nil
			for _, hotkey in hotkeyObjects do
				if hotkey.keyCode == input.KeyCode then
					hotkey:release(true)
				end
			end
		end
	end)
	UserInputService.WindowFocusReleased:Connect(clearAllActiveKeys)
	UserInputService.TextBoxFocused:Connect(clearAllActiveKeys)
	UserInputService.TextBoxFocusReleased:Connect(clearAllActiveKeys)
end
return {
	init = init,
	Hotkey = Hotkey,
}
