-- Compiled with roblox-ts v3.0.0
local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))
local _services = TS.import(script, game:GetService("ReplicatedStorage"), "rbxts_include", "node_modules", "@rbxts", "services")
local Players = _services.Players
local ReplicatedStorage = _services.ReplicatedStorage
local RunService = _services.RunService
local TweenService = _services.TweenService
local Workspace = _services.Workspace
local UserInput = TS.import(script, script.Parent, "UserInput")
local Types = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Types")
local Utils = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Utils")
local Constants = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "Constants").Constants
local LZWCompression = TS.import(script, game:GetService("ReplicatedStorage"), "Shared", "LZWCompression").default
local Compression = LZWCompression.new()
local eventsFolder = ReplicatedStorage:WaitForChild("Events")
local templatesFolder = ReplicatedStorage:WaitForChild("Templates")
local skinsFolder = ReplicatedStorage:WaitForChild("Skins")
local songsFolder = ReplicatedStorage:WaitForChild("Songs")
local categoryButtonTemplate = templatesFolder:WaitForChild("CategoryButton")
local songButtonTemplate = templatesFolder:WaitForChild("SongButton")
local difficultyButtonTemplate = templatesFolder:WaitForChild("DifficultyButton")
local camera = Workspace.CurrentCamera or Workspace:WaitForChild("Camera")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local screenGui = playerGui:WaitForChild("ScreenGui")
local laneHotkeys = {}
local maxAccuracy = 200
local minAccuracy = -200
local defaultHitPosition = 460
local heldLanes = {}
local laneFrames = {}
local averageError = { 0, 0 }
local allHitErrors = { {}, {} }
local hitPositions = { 0, 0, 0, 0 }
local devAutoPlay = false
local originalCameraCFrame = CFrame.identity
local bindedKeys = { Enum.KeyCode.Q, Enum.KeyCode.W, Enum.KeyCode.LeftBracket, Enum.KeyCode.RightBracket }
local laneWidth = 75
local lanePadding = 1
local noteSpeed = 0
local selectedNoteSkin = "CirclesV1"
local maxVisibleNotes = 200
local accuracyFormat = '<stroke thickness="2" color="#000" joins="miter"><b>%s</b></stroke>'
local comboFormat = '<stroke thickness="2" color="#000" joins="miter"><b>%d</b></stroke>'
local totalScore = 0
local maxScore = 0
local notesMax = 0
local notes300 = 0
local notes200 = 0
local notes100 = 0
local notes50 = 0
local notesMisses = 0
local noteCombo = 0
local highestCombo = 0
local bpm = 0
local scrollSpeed = 0
local endTime = 0
local isPlaying = false
if RunService:IsStudio() then
	local toggleAutoplay = UserInput.Hotkey.new("ToggleAutoplay", Enum.KeyCode.M)
	toggleAutoplay:onPress(function()
		devAutoPlay = not devAutoPlay
		return devAutoPlay
	end)
end
local function calculateAccuracy(nMax, n300, n200, n100, n50, nMiss)
	-- Same as osu!mania's accuracy formula
	local accuracy = (300 * (nMax + n300) + 200 * n200 + 100 * n100 + 50 * n50) / (300 * (nMax + n300 + n200 + n100 + n50 + nMiss))
	return accuracy * 100
end
local function calculateDifficulty(chart)
	local length = 0
	for _, note in chart.notes do
		if note.millisecond > length then
			length = note.millisecond
		end
	end
	local averageNoteDensity = -1
	local highestNoteDensity = -math.huge
	for i = 0, length, 5000 do
		local noteDensity = 0
		for _, note in chart.notes do
			if note.millisecond >= i and note.millisecond <= i + 5000 then
				noteDensity += 1
			elseif note.millisecond > i + 5000 then
				break
			end
		end
		if noteDensity > highestNoteDensity then
			highestNoteDensity = noteDensity
		end
		if averageNoteDensity >= 0 then
			averageNoteDensity = (averageNoteDensity + noteDensity) / 2
		else
			averageNoteDensity = noteDensity
		end
	end
	local difficultyNumber = 3 * (((10 / chart.difficulty.maxHealth) ^ (1 / 2) * chart.difficulty.overallDifficulty ^ (2 / 3) * (1 + highestCombo / 10) ^ (1 / 3)) ^ (1 + averageNoteDensity / (10 * highestNoteDensity)))
	local difficultyWord
	if difficultyNumber > 20 then
		difficultyWord = "???"
	elseif difficultyNumber >= 15 then
		difficultyWord = "Expert+"
	elseif difficultyNumber >= 12.5 then
		difficultyWord = "Expert"
	elseif difficultyNumber >= 10 then
		difficultyWord = "Insane"
	elseif difficultyNumber >= 5 then
		difficultyWord = "Hard"
	elseif difficultyNumber >= 2.5 then
		difficultyWord = "Normal"
	else
		difficultyWord = "Easy"
	end
	return difficultyNumber, difficultyWord
end
local function calculateActualNoteSpeed(noteSpeed, bpm, scrollSpeed)
	local bps = bpm / 60
	local totalScrollSpeed = scrollSpeed * noteSpeed
	local pixelsPerSecond = totalScrollSpeed * bps
	return pixelsPerSecond * 25
end
local function updateHUD(comboChanged, accuracyChanged)
	if comboChanged then
		screenGui.ComboCounter.Combo.Text = string.format(comboFormat, noteCombo)
		screenGui.ComboCounter.Combo.UIScale.Scale = 1.2
		local comboInfoScale = TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
		TweenService:Create(screenGui.ComboCounter.Combo.UIScale, comboInfoScale, {
			Scale = 1,
		}):Play()
	end
	if accuracyChanged then
		screenGui.AccuracyDisplay.GroupTransparency = 0
		screenGui.AccuracyDisplay.Accuracy.UIScale.Scale = 1.2
		local accuracyInfoScale = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
		local accuracyInfoTransparency = TweenInfo.new(2, Enum.EasingStyle.Linear)
		TweenService:Create(screenGui.AccuracyDisplay.Accuracy.UIScale, accuracyInfoScale, {
			Scale = 1,
		}):Play()
		TweenService:Create(screenGui.AccuracyDisplay, accuracyInfoTransparency, {
			GroupTransparency = 1,
		}):Play()
	end
	if noteCombo > highestCombo then
		highestCombo = noteCombo
	end
	local accuracy = string.format("%.3f", calculateAccuracy(notesMax, notes300, notes200, notes100, notes50, notesMisses))
	screenGui.InfoHUD.Score.Text = `<stroke thickness="1" color="#000" joins="miter">Score: <b>{Utils.formatNumber(totalScore)}</b></stroke>`
	screenGui.InfoHUD.Accuracy.Text = `<stroke thickness="1" color="#000" joins="miter">Accuracy: <b>{accuracy}%</b></stroke>`
	screenGui.InfoHUD.Combo.Text = `<stroke thickness="1" color="#000" joins="miter">Combo: <b>{Utils.formatNumber(noteCombo)}x</b></stroke>`
	screenGui.InfoHUD.Misses.Text = `<stroke thickness="1" color="#000" joins="miter">Misses: <b>{Utils.formatNumber(notesMisses)}</b></stroke>`
end
local function calculateYPosition(elapsedTime, noteData, noteSpeed, bpm, scrollSpeed, laneHeight, hitPosition, heldTimings, distanceTravelled, heldTimeIndex)
	if distanceTravelled == nil then
		distanceTravelled = 0
	end
	if heldTimeIndex == nil then
		heldTimeIndex = 0
	end
	local movementHeight = laneHeight * (hitPosition / 480)
	local noteRemainingTime = noteData.millisecond - elapsedTime
	local currentSpeed = calculateActualNoteSpeed(noteSpeed, bpm, scrollSpeed) / 1000
	local remainingPointTime = if heldTimeIndex < #heldTimings then heldTimings[heldTimeIndex + 1].millisecond - elapsedTime else math.huge
	if noteRemainingTime < remainingPointTime then
		distanceTravelled += noteRemainingTime * currentSpeed
		return movementHeight - distanceTravelled
	end
	distanceTravelled += remainingPointTime * currentSpeed
	if distanceTravelled > movementHeight then
		return movementHeight - distanceTravelled
	end
	local removedTiming = heldTimings[heldTimeIndex + 1]
	local _exp = elapsedTime + remainingPointTime
	local _exp_1 = noteData
	local _exp_2 = noteSpeed
	local _condition = removedTiming.bpm
	if _condition == nil then
		_condition = bpm
	end
	local _condition_1 = removedTiming.scrollSpeed
	if _condition_1 == nil then
		_condition_1 = scrollSpeed
	end
	return calculateYPosition(_exp, _exp_1, _exp_2, _condition, _condition_1, laneHeight, hitPosition, heldTimings, distanceTravelled, heldTimeIndex + 1)
end
local function averageAllNumbers(list)
	if #list == 0 then
		return 0
	end
	local total = 0
	for _, number in list do
		total += number
	end
	return total / #list
end
local function hitNote(hitOffset, j, note, noteObject, createdNotes)
	local _condition = (noteObject.isHoldNote and noteObject.isReleased)
	if not _condition then
		local _condition_1 = noteObject.isTailNote
		if _condition_1 then
			local _result = noteObject.holdNote
			if _result ~= nil then
				_result = _result.isReleased
			end
			_condition_1 = _result
		end
		_condition = _condition_1
	end
	if _condition then
		return nil
	end
	if hitOffset > 0 then
		local _exp = allHitErrors[1]
		local _hitOffset = hitOffset
		table.insert(_exp, _hitOffset)
	else
		local _exp = allHitErrors[2]
		local _hitOffset = hitOffset
		table.insert(_exp, _hitOffset)
	end
	averageError[1] = averageAllNumbers(allHitErrors[1])
	averageError[2] = averageAllNumbers(allHitErrors[2])
	local hitPercentage = if hitOffset > 0 then hitOffset / maxAccuracy else hitOffset / minAccuracy
	noteCombo += 1
	local scoreBoost = 0
	if hitPercentage < 0.125 then
		scoreBoost = 300
		notesMax += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Marvelous!!")
	elseif hitPercentage < 0.3 then
		scoreBoost = 300
		notes300 += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Perfect!")
	elseif hitPercentage < 0.6 then
		scoreBoost = 200
		notes200 += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Great")
	elseif hitPercentage < 0.7 then
		scoreBoost = 100
		notes100 += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Ok")
	elseif hitPercentage < 0.85 then
		scoreBoost = 50
		notes50 += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Bad")
	else
		scoreBoost = 0
		noteCombo = 0
		notesMisses += 1
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Miss")
	end
	totalScore += scoreBoost
	updateHUD(true, true)
	noteObject.didPress = true
	local _createdNotes = createdNotes
	local _arg0 = j - 1
	table.remove(_createdNotes, _arg0 + 1)
	if noteObject.isTailNote and noteObject.holdNote ~= nil then
		local _result = note.Parent
		if _result ~= nil then
			_result:Destroy()
		end
		local _createdNotes_1 = createdNotes
		local _holdNote = noteObject.holdNote
		local holdIndex = (table.find(_createdNotes_1, _holdNote) or 0) - 1
		if holdIndex >= 0 then
			table.remove(createdNotes, holdIndex + 1)
		end
	end
	note:Destroy()
end
local function laneOnPress(lane, startTime, laneNumber, createdNotes)
	local currentTime = os.clock()
	local elapsedTime = (currentTime - startTime) * 1000
	lane.JudgementLine.Note.BackgroundTransparency = 0.8
	for j, _binding in ipairs(createdNotes) do
		local note = _binding.note
		local noteData = _binding.noteData
		local noteObject = createdNotes[j]
		if noteData.lane + 1 ~= laneNumber or noteObject.isTailNote then
			continue
		end
		local hitOffset = noteData.millisecond - elapsedTime
		if hitOffset > minAccuracy and hitOffset < maxAccuracy then
			if noteObject.isHoldNote then
				local _laneNumber = laneNumber
				heldLanes[_laneNumber] = noteObject
				noteObject.isHeld = true
				noteCombo += 1
				updateHUD(true, false)
			else
				hitNote(hitOffset, j, note, noteObject, createdNotes)
			end
			break
		end
	end
	local sound = (ReplicatedStorage:WaitForChild("normal-hitnormal")):Clone()
	sound.Parent = Workspace
	sound:Destroy()
end
local function laneOnRelease(lane, laneNumber, startTime, createdNotes)
	local elapsedTime = (os.clock() - startTime) * 1000
	lane.JudgementLine.Note.BackgroundTransparency = 1
	local _laneNumber = laneNumber
	local holdNote = heldLanes[_laneNumber]
	if holdNote == nil or holdNote.isReleased then
		return nil
	end
	if holdNote.tailNote ~= nil then
		local hitOffset = holdNote.tailNote.noteData.millisecond - elapsedTime
		if hitOffset > minAccuracy and hitOffset < maxAccuracy then
			local _createdNotes = createdNotes
			local _tailNote = holdNote.tailNote
			hitNote(hitOffset, (table.find(_createdNotes, _tailNote) or 0) - 1, holdNote.tailNote.note, holdNote.tailNote, createdNotes)
			holdNote.didPress = true
			holdNote.tailNote.didPress = true
		else
			holdNote.isHeld = false
			local _laneNumber_1 = laneNumber
			heldLanes[_laneNumber_1] = nil
			noteCombo = 0
			notesMisses += 1
			screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Miss")
			updateHUD(true, true)
		end
	end
	holdNote.isReleased = true
end
local function parseSubKeyName(name, keyCount)
	local operators = { "&", ">", "," }
	local tokens = {}
	local number = ""
	for _, character in string.split(name, "") do
		if table.find(operators, character) ~= nil then
			if #number > 0 then
				local _number = number
				table.insert(tokens, _number)
				number = ""
			end
			if character ~= "," then
				table.insert(tokens, character)
			end
		else
			number ..= character
		end
	end
	if #number > 0 then
		local _number = number
		table.insert(tokens, _number)
	end
	local includedLanes = {}
	for i = 2, #tokens, 3 do
		local operator = tokens[i]
		local leftNumber = tonumber(tokens[i - 1])
		local rightNumber = tonumber(tokens[i + 1])
		if table.find(tokens, operator) ~= nil and leftNumber ~= nil and rightNumber ~= nil then
			if leftNumber < 0 then
				leftNumber += keyCount + 1
			end
			if rightNumber < 0 then
				rightNumber += keyCount + 1
			end
			if operator == "&" then
				local _leftNumber = leftNumber
				local _rightNumber = rightNumber
				-- ▼ Array.push ▼
				table.insert(includedLanes, _leftNumber)
				table.insert(includedLanes, _rightNumber)
				-- ▲ Array.push ▲
			elseif operator == ">" then
				for i = leftNumber, rightNumber do
					table.insert(includedLanes, i)
				end
			end
		end
	end
	for i, lane in ipairs(includedLanes) do
		if lane < 0 or table.find(includedLanes, lane, i + 1) ~= nil then
			table.remove(includedLanes, i + 1)
		end
	end
	return includedLanes
end
local finish
local function start(chart, songFolder, stage, debugMode, autoplay)
	return TS.Promise.new(function(resolve)
		if not table.isfrozen(chart) then
			Utils.deepFreeze(chart)
		end
		if isPlaying then
			finish()
		end
		isPlaying = true
		print("[src/client/MainGameplay.ts:368]", "Initializing gameplay...")
		local selectedSkinFolder = skinsFolder:WaitForChild(selectedNoteSkin, 5)
		if not selectedSkinFolder then
			selectedSkinFolder = skinsFolder:WaitForChild("Circles V1")
		end
		local laneTemplates = {}
		for _, subKeyFolder in selectedSkinFolder:GetChildren() do
			if not subKeyFolder:IsA("Folder") then
				continue
			end
			TS.try(function()
				local lanes = parseSubKeyName(subKeyFolder.Name, chart.metadata.totalLanes)
				for _1, lane in lanes do
					laneTemplates[lane] = {
						Lane = subKeyFolder:FindFirstChild("Lane"),
						Note = subKeyFolder:FindFirstChild("Note"),
						HoldNote = subKeyFolder:FindFirstChild("HoldNote"),
						TailNote = subKeyFolder:FindFirstChild("TailNote"),
						BodyNote = subKeyFolder:FindFirstChild("BodyNote"),
					}
				end
			end, function(err)
				warn("[src/client/MainGameplay.ts:391]", `Error while parsing sub key folder '{subKeyFolder}' - {err}`)
			end)
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
		for _, hotkey in laneHotkeys do
			hotkey:destroy()
		end
		table.clear(laneHotkeys)
		table.clear(heldLanes)
		for _, frame in laneFrames do
			frame:Destroy()
		end
		table.clear(laneFrames)
		local totalLanes = chart.metadata.totalLanes
		screenGui.Transition.Size = UDim2.new(0, 0, 1, 0)
		screenGui.Transition.Position = UDim2.new(0, 0, 0, 0)
		screenGui.Transition.AnchorPoint = Vector2.new(0, 0)
		TweenService:Create(screenGui.Transition, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			Size = UDim2.new(1, 0, 1, 0),
		}):Play()
		task.wait(1)
		print("[src/client/MainGameplay.ts:426]", "Finished transition")
		averageError[1] = 0
		averageError[2] = 0
		table.clear(allHitErrors[1])
		table.clear(allHitErrors[2])
		table.clear(hitPositions)
		totalScore = 0
		maxScore = #chart.notes * 300
		notesMax = 0
		notes300 = 0
		notes200 = 0
		notes100 = 0
		notes50 = 0
		notesMisses = 0
		noteCombo = 0
		highestCombo = 0
		bpm = 60
		scrollSpeed = 1
		endTime = 0
		if debugMode then
			screenGui.DebugHUD.Visible = true
		end
		screenGui.ComboCounter.Combo.Text = string.format(comboFormat, 0)
		screenGui.ComboCounter.Visible = true
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "")
		screenGui.AccuracyDisplay.Visible = true
		screenGui.InfoHUD.Visible = true
		screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "3")
		updateHUD(true, true)
		local startTime, createdNotes
		for i = 1, totalLanes do
			table.insert(hitPositions, defaultHitPosition)
			local lane = laneTemplates[i].Lane:Clone()
			lane.Name = tostring(i)
			lane.ZIndex = i
			lane.Size = UDim2.new(0, laneWidth, 1, 0)
			lane.Position = UDim2.new(0, (camera.ViewportSize.X / 2) - laneWidth * (totalLanes / 2 - i + 1), 0, 0)
			lane.UIPadding.PaddingLeft = UDim.new(0, lanePadding)
			lane.UIPadding.PaddingRight = UDim.new(0, lanePadding)
			lane.JudgementLine.Position = UDim2.new(0.5, 0, defaultHitPosition / 480, 0)
			lane.Parent = screenGui.Lanes
			table.insert(laneFrames, lane)
			local hotkey = UserInput.Hotkey.new(`Lane{i}`, bindedKeys[i])
			if autoplay or devAutoPlay then
				hotkey.canPress = false
			end
			hotkey:onPress(function()
				return laneOnPress(lane, startTime, i, createdNotes)
			end)
			hotkey:onRelease(function()
				return laneOnRelease(lane, i, startTime, createdNotes)
			end)
			table.insert(laneHotkeys, hotkey)
		end
		screenGui.Lanes.Visible = true
		print("[src/client/MainGameplay.ts:487]", `Created {totalLanes} lanes and binded {#laneHotkeys} keys`)
		startTime = os.clock() + 4
		local countdown = 3
		local heldNotes = {}
		local heldTimings = {}
		local heldEvents = {}
		createdNotes = {}
		local createdNoteId = 0
		local loadStartTime = os.clock()
		for _, timing in ipairs(chart.timings) do
			table.insert(heldTimings, timing)
			if timing.millisecond > endTime then
				endTime = timing.millisecond
			end
		end
		table.sort(heldTimings, function(a, b)
			return a.millisecond < b.millisecond
		end)
		for i, note in ipairs(chart.notes) do
			if note.lane < 0 or note.lane >= totalLanes then
				warn("[src/client/MainGameplay.ts:509]", `> Note #{i} is not in a valid lane ({note.lane}), the mininum is 0 and the maximum is {totalLanes - 1}`)
				continue
			end
			if note.type == 0 then
				local _arg0 = {
					type = 0,
					millisecond = note.millisecond,
					lane = note.lane,
				}
				table.insert(heldNotes, _arg0)
			elseif note.type == 1 then
				local _arg0 = {
					type = 1,
					millisecond = note.millisecond,
					lane = note.lane,
					holdLength = note.holdLength,
				}
				table.insert(heldNotes, _arg0)
			end
			if note.millisecond > endTime then
				endTime = note.millisecond
			end
		end
		table.sort(heldNotes, function(a, b)
			return a.millisecond < b.millisecond
		end)
		local _condition = heldTimings[1].bpm
		if _condition == nil then
			_condition = 60
		end
		bpm = _condition
		local _condition_1 = heldTimings[1].scrollSpeed
		if _condition_1 == nil then
			_condition_1 = 1
		end
		scrollSpeed = _condition_1
		print("[src/client/MainGameplay.ts:536]", `Loaded {#heldNotes} notes, {#heldTimings} timings, and {#heldEvents} events in {string.format("%.4f", (os.clock() - loadStartTime) / 1000)}ms`)
		TS.try(function()
			RunService:UnbindFromRenderStep("GameplayUpdate")
		end, function(err) end)
		local music = songFolder:WaitForChild(chart.metadata.audioName)
		screenGui.Transition.Size = UDim2.new(1, 0, 1, 0)
		screenGui.Transition.Position = UDim2.new(1, 0, 0, 0)
		screenGui.Transition.AnchorPoint = Vector2.new(1, 0)
		TweenService:Create(screenGui.Transition, TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.In), {
			Size = UDim2.new(0, 0, 1, 0),
		}):Play()
		originalCameraCFrame = camera.CFrame
		camera.CameraType = Enum.CameraType.Scriptable
		camera.CFrame = stage.Camera.CFrame
		task.wait(1)
		print("[src/client/MainGameplay.ts:558]", "Finished second transition")
		local lastPreviewUpdateTime = os.clock()
		TS.try(function()
			eventsFolder.UpdateStagePreview:FireServer(Compression:compress(`0,nan,0,0,{bpm},{scrollSpeed}|`))
		end, function(err) end)
		RunService:BindToRenderStep("GameplayUpdate", Enum.RenderPriority.Last.Value, function(dt)
			for _, hotkey in laneHotkeys do
				if autoplay or devAutoPlay then
					hotkey.canPress = false
				end
			end
			local currentTime = os.clock()
			local elapsedTime = math.floor((currentTime - startTime) * 1000)
			-- scrollSpeed = 1;
			-- bpm = 250;
			-- hitPosition = 480 - (((elapsedTime / 1000) * calculateActualNoteSpeed(noteSpeed, bpm, scrollSpeed) * 2) / camera.ViewportSize.Y * 240) % 240;
			-- for (const lane of laneFrames) lane.JudgementLine.Position = new UDim2(0.5, 0, hitPosition / 480, 0);
			if countdown > 0 then
				if countdown == 3 and elapsedTime >= -2000 then
					countdown = 2
					screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "2")
					updateHUD(false, true)
				elseif countdown == 2 and elapsedTime >= -1000 then
					countdown = 1
					screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "1")
					updateHUD(false, true)
				elseif countdown == 1 and elapsedTime >= 0 then
					countdown = 0
				end
			end
			if elapsedTime >= 0 then
				if #heldNotes == 0 then
					if #createdNotes == 0 or not music.IsPlaying then
						RunService:UnbindFromRenderStep("GameplayUpdate")
						task.delay(4, TS.async(function()
							return resolve(TS.await(finish()))
						end))
						return nil
					end
				elseif not music.IsPlaying then
					music:Play()
				end
			end
			local totalRemoves = 0
			for _, noteData in ipairs(heldNotes) do
				if #createdNotes >= maxVisibleNotes then
					break
				end
				local hitPosition = hitPositions[noteData.lane + 1]
				local laneHeight = laneFrames[noteData.lane + 1].AbsoluteSize.Y
				local yPosition = calculateYPosition(elapsedTime, noteData, noteSpeed, bpm, scrollSpeed, laneHeight, hitPosition, heldTimings)
				if yPosition >= 0 and yPosition <= laneHeight + laneWidth then
					totalRemoves += 1
					local laneContainer = laneFrames[noteData.lane + 1]
					local template = laneTemplates[noteData.lane + 1]
					if noteData.type == 0 then
						local newNote = template.Note:Clone()
						newNote.Position = UDim2.new(0, 0, 0, 0)
						newNote.AnchorPoint = Vector2.new(0, 1)
						newNote.Parent = laneContainer.Notes
						local _arg0 = {
							note = newNote,
							noteData = noteData,
							isTailNote = false,
							isHoldNote = false,
							didAutoPress = false,
							didPress = false,
							id = createdNoteId,
						}
						table.insert(createdNotes, _arg0)
						createdNoteId += 1
					elseif noteData.type == 1 then
						local group = Instance.new("CanvasGroup")
						group.Position = UDim2.new(0, 0, 0, 0)
						group.Size = UDim2.new(1, 0, 1, 0)
						group.BackgroundTransparency = 1
						local holdNote = template.HoldNote:Clone()
						holdNote.Position = UDim2.new(0, 0, 0, 0)
						holdNote.AnchorPoint = Vector2.new(0, 1)
						holdNote.Parent = group
						local tailNote = template.TailNote:Clone()
						tailNote.Position = UDim2.new(0, 0, 0, 0)
						tailNote.AnchorPoint = Vector2.new(0, 1)
						tailNote.Parent = group
						local bodyNote = template.BodyNote:Clone()
						bodyNote.Position = UDim2.new(0, 0, 0, 0)
						bodyNote.AnchorPoint = Vector2.new(0, 0)
						bodyNote.Parent = group
						group.Parent = laneContainer.Notes
						local holdObject = {
							note = holdNote,
							bodyNote = bodyNote,
							noteData = {
								type = 1,
								holdLength = noteData.holdLength,
								lane = noteData.lane,
								millisecond = noteData.millisecond,
							},
							isTailNote = false,
							isHoldNote = true,
							isHeld = false,
							didPress = false,
							didAutoPress = false,
							isReleased = false,
							tailNote = nil,
							id = createdNoteId,
						}
						createdNoteId += 1
						local tailObject = {
							note = tailNote,
							noteData = {
								type = 1,
								holdLength = noteData.holdLength,
								lane = noteData.lane,
								millisecond = noteData.millisecond + noteData.holdLength,
							},
							isTailNote = true,
							isHoldNote = false,
							didAutoPress = false,
							didPress = false,
							holdNote = holdObject,
							id = createdNoteId,
						}
						createdNoteId += 1
						holdObject.tailNote = tailObject
						-- ▼ Array.push ▼
						table.insert(createdNotes, holdObject)
						table.insert(createdNotes, tailObject)
						-- ▲ Array.push ▲
					end
				else
					break
				end
			end
			for _ = 1, totalRemoves do
				table.remove(heldNotes, 1)
			end
			local removeIndices = {}
			for i, _binding in ipairs(createdNotes) do
				local noteData = _binding.noteData
				local note = _binding.note
				local noteObject = createdNotes[i]
				local laneHeight = laneFrames[noteData.lane + 1].AbsoluteSize.Y
				if noteObject.didPress then
					local _i = i
					table.insert(removeIndices, _i)
					continue
				end
				local hitPosition = hitPositions[noteData.lane + 1]
				local yOffset = calculateYPosition(elapsedTime, noteData, noteSpeed, bpm, scrollSpeed, laneHeight, hitPosition, heldTimings)
				local hitOffset = noteData.millisecond - elapsedTime
				local hitPercentage = if hitOffset > 0 then hitOffset / maxAccuracy else hitOffset / minAccuracy
				if (autoplay or devAutoPlay) and hitPercentage <= 0.1 then
					local hotkey = laneHotkeys[noteData.lane + 1]
					if noteData.type == 0 then
						hotkey:release()
						hotkey:press()
						hotkey:release()
					elseif noteData.type == 1 then
						if noteObject.isHoldNote and not noteObject.didAutoPress then
							hotkey:release()
							hotkey:press()
							noteObject.didAutoPress = true
						end
						if noteObject.isTailNote and not noteObject.didAutoPress then
							hotkey:release()
							noteObject.didAutoPress = true
						end
					end
				end
				if noteObject.isHoldNote and note.Parent ~= nil then
					if noteObject.isReleased then
						(note.Parent).GroupTransparency = 0.5
					else
						(note.Parent).GroupTransparency = 0
					end
				end
				note.Position = UDim2.new(0, 0, 0, yOffset)
				if noteObject.isHoldNote then
					if noteObject.isHeld and not noteObject.isReleased then
						note.Position = UDim2.new(0, 0, 0, laneHeight * (hitPosition / 480))
					else
						if elapsedTime >= noteData.millisecond + maxAccuracy and not noteObject.isReleased then
							noteObject.isReleased = true
							noteCombo = 0
							notesMisses += 1
							screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Miss")
							updateHUD(true, true)
						end
					end
					local halfSize = laneWidth // 2
					local topOffset = calculateYPosition(elapsedTime, noteObject.tailNote.noteData, noteSpeed, bpm, scrollSpeed, laneHeight, hitPosition, heldTimings) - halfSize
					local bottomOffset = note.Position.Y.Offset - halfSize
					noteObject.bodyNote.Position = UDim2.new(0, 0, 0, topOffset)
					noteObject.bodyNote.Size = UDim2.new(1, 0, 0, bottomOffset - topOffset)
				else
					local _condition_2 = noteObject.isTailNote
					if _condition_2 then
						local _result = noteObject.holdNote
						if _result ~= nil then
							_result = _result.isHeld
						end
						_condition_2 = _result
						if _condition_2 then
							_condition_2 = yOffset >= laneHeight * (hitPosition / 480)
						end
					end
					if _condition_2 then
						hitNote(0, i, note, noteObject, createdNotes)
						local _arg0 = noteData.lane + 1
						heldLanes[_arg0] = nil
					end
				end
				local _condition_2 = (not noteObject.isHoldNote and not noteObject.isTailNote)
				if not _condition_2 then
					local _condition_3 = noteObject.isTailNote
					if _condition_3 then
						local _result = noteObject.holdNote
						if _result ~= nil then
							_result = _result.isReleased
						end
						_condition_3 = _result
					end
					_condition_2 = _condition_3
				end
				if _condition_2 then
					if elapsedTime >= noteData.millisecond + maxAccuracy then
						if autoplay or devAutoPlay then
							laneHotkeys[noteData.lane + 1]:release()
						end
						local doMiss = true
						if noteObject.isTailNote and noteObject.holdNote ~= nil then
							if noteObject.holdNote.isReleased then
								doMiss = false
							end
							local _result = note.Parent
							if _result ~= nil then
								_result:Destroy()
							end
							local _holdNote = noteObject.holdNote
							local holdIndex = (table.find(createdNotes, _holdNote) or 0) - 1
							if holdIndex >= 0 and not (table.find(removeIndices, holdIndex) ~= nil) then
								local _arg0 = holdIndex + 1
								table.insert(removeIndices, _arg0)
							end
						end
						if doMiss then
							noteCombo = 0
							notesMisses += 1
							screenGui.AccuracyDisplay.Accuracy.Text = string.format(accuracyFormat, "Miss")
							updateHUD(true, true)
						end
						note:Destroy()
						local _i = i
						if not (table.find(removeIndices, _i) ~= nil) then
							local _i_1 = i
							table.insert(removeIndices, _i_1)
						end
					end
				end
			end
			table.sort(removeIndices, function(a, b)
				return a > b
			end)
			for _, index in removeIndices do
				local _arg0 = index - 1
				local removedNote = table.remove(createdNotes, _arg0 + 1)
				if removedNote ~= nil then
					removedNote.note:Destroy()
					if removedNote.isHoldNote or removedNote.isTailNote then
						if removedNote.isHoldNote then
							removedNote.bodyNote:Destroy()
						end
						local _result = removedNote.note.Parent
						if _result ~= nil then
							_result:Destroy()
						end
					end
				end
			end
			for i, timing in ipairs(heldTimings) do
				if elapsedTime >= timing.millisecond then
					if timing.type == 0 then
						if timing.bpm ~= nil then
							bpm = timing.bpm
						end
						if timing.scrollSpeed ~= nil then
							scrollSpeed = timing.scrollSpeed
						end
					end
					local _arg0 = i - 1
					table.remove(heldTimings, _arg0 + 1)
				else
					break
				end
			end
			if os.clock() - lastPreviewUpdateTime > 0.067 then
				local accuracy = calculateAccuracy(notesMax, notes300, notes200, notes100, notes50, notesMisses)
				local previewData = `{totalScore},{math.round(accuracy * 100)},{notesMisses},{noteCombo},{selectedNoteSkin}|`
				for _, note in createdNotes do
					local laneHeight = laneFrames[note.noteData.lane + 1].AbsoluteSize.Y
					local position = note.note.Position.Y.Offset
					previewData ..= `{note.noteData.lane},{math.round((position / laneHeight) * 1000)},{if note.isTailNote then 1 elseif note.isHoldNote then 2 else 0},{note.id}|`
				end
				eventsFolder.UpdateStagePreview:FireServer(Compression:compress(previewData))
				lastPreviewUpdateTime = os.clock()
			end
			if debugMode then
				local pressedNotes = {}
				for _, hotkey in laneHotkeys do
					local _arg0 = if hotkey.isPressed then "1" else "0"
					table.insert(pressedNotes, _arg0)
				end
				local minutes = elapsedTime // 60000
				local seconds = (elapsedTime / 1000) % 60
				local milliseconds = elapsedTime % 1000
				if elapsedTime < 0 then
					minutes = math.ceil(elapsedTime / 60000)
					seconds = 60 - seconds
					milliseconds = 1000 - milliseconds
					screenGui.DebugHUD.Time.TextColor3 = Color3.fromRGB(255, 255, 0)
				else
					screenGui.DebugHUD.Time.TextColor3 = Color3.fromRGB(255, 255, 255)
				end
				screenGui.DebugHUD.NoteSpeed.Text = string.format("NoteSpeed: %.1f", noteSpeed)
				screenGui.DebugHUD.ScrollSpeed.Text = string.format("ScrollSpeed: %.3fx", scrollSpeed)
				screenGui.DebugHUD.BPM.Text = string.format("BPM: %.3fBPM", bpm)
				screenGui.DebugHUD.BPM.Text = string.format("BPM: %.3fBPM", bpm)
				screenGui.DebugHUD.PixelsPerSecond.Text = string.format("Pixels/s: %dpx/s", calculateActualNoteSpeed(noteSpeed, bpm, scrollSpeed))
				screenGui.DebugHUD.Time.Text = string.format("Time: %02d:%02d.%03d/%02d:%02d.%03d", minutes, seconds, milliseconds, endTime // 60000, (endTime / 1000) % 60, endTime % 1000)
				screenGui.DebugHUD.RenderedNotes.Text = string.format("RenderedNotes: %d", #createdNotes)
				screenGui.DebugHUD.PressedNotes.Text = `PressedNotes: {table.concat(pressedNotes, ",")}`
				screenGui.DebugHUD.HitPosition.Text = string.format("HitPosition: %s", table.concat(hitPositions, ","))
				screenGui.DebugHUD.AverageError.Text = string.format("AvgHitErr: %dms,%dms", averageError[1], averageError[2])
				screenGui.DebugHUD.Autoplay.Text = `Autoplay: {autoplay or devAutoPlay}`
				screenGui.DebugHUD.NoteSkin.Text = `NoteSkin: {selectedNoteSkin}`
				screenGui.DebugHUD.FPS.Text = string.format("FPS: %.2f", 1 / dt)
			end
			camera.CameraType = Enum.CameraType.Scriptable
			camera.CFrame = stage.Camera.CFrame
		end)
		print("[src/client/MainGameplay.ts:877]", "Binded main gameplay loop")
	end)
end
function finish()
	return TS.Promise.new(function(resolve)
		print("[src/client/MainGameplay.ts:883]", "Finishing gameplay...")
		TS.try(function()
			RunService:UnbindFromRenderStep("GameplayUpdate")
		end, function(err) end)
		local roundStats = { maxScore, notesMax, notes300, notes200, notes100, notes50, notesMisses, noteCombo, highestCombo, averageError[1], averageError[2] }
		TweenService:Create(camera, TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut), {
			CFrame = originalCameraCFrame,
		}):Play()
		task.delay(2, function()
			camera.CameraType = Enum.CameraType.Custom
			return camera.CameraType
		end)
		for _, hotkey in laneHotkeys do
			hotkey:destroy()
		end
		table.clear(laneHotkeys)
		local info = TweenInfo.new(2, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
		for _, lane in laneFrames do
			local _exp = TweenInfo.new(Utils.randomFloat(0.5, 2), Enum.EasingStyle.Quad, Enum.EasingDirection.In)
			local _object = {}
			local _left = "Position"
			local _position = lane.Position
			local _uDim2 = UDim2.new(0, 0, 1, 0)
			_object[_left] = _position + _uDim2
			_object.Rotation = math.random(-90, 90)
			TweenService:Create(lane, _exp, _object):Play()
		end
		Utils.destroyAfter(laneFrames, info.Time)
		table.clear(laneFrames)
		print("[src/client/MainGameplay.ts:925]", "Cleared lanes")
		isPlaying = false
		TweenService:Create(screenGui.ComboCounter, info, {
			GroupTransparency = 1,
		}):Play()
		TweenService:Create(screenGui.AccuracyDisplay, info, {
			GroupTransparency = 1,
		}):Play()
		local _exp = screenGui.InfoHUD
		local _object = {}
		local _left = "Position"
		local _position = screenGui.InfoHUD.Position
		local _uDim2 = UDim2.new(-1.5, 0, 0, 0)
		_object[_left] = _position + _uDim2
		TweenService:Create(_exp, info, _object):Play()
		local _exp_1 = screenGui.DebugHUD
		local _object_1 = {}
		local _left_1 = "Position"
		local _position_1 = screenGui.DebugHUD.Position
		local _uDim2_1 = UDim2.new(-2, 0, 0, 0)
		_object_1[_left_1] = _position_1 + _uDim2_1
		TweenService:Create(_exp_1, info, _object_1):Play()
		print("[src/client/MainGameplay.ts:945]", "Cleared UI")
		task.wait(info.Time)
		if not isPlaying then
			screenGui.Lanes.Visible = false
			screenGui.ComboCounter.Visible = false
			screenGui.AccuracyDisplay.Visible = false
			screenGui.InfoHUD.Visible = false
			screenGui.DebugHUD.Visible = false
		end
		resolve(roundStats)
	end)
end
local function showGrade(chart, totalScore, notesMax, notes300, notes200, notes100, notes50, notesMisses, noteCombo, highestCombo, maxError, minError)
	local accuracy = calculateAccuracy(notesMax, notes300, notes200, notes100, notes50, notesMisses)
	local grade = "D"
	if accuracy == 100 then
		grade = "X"
	elseif accuracy >= 95 then
		grade = "S"
	elseif accuracy >= 90 then
		grade = "A"
	elseif accuracy >= 80 then
		grade = "B"
	elseif accuracy >= 70 then
		grade = "C"
	end
	screenGui.Grade.Icon.Image = Constants.ImageIds.RankImages[grade]
	screenGui.Grade.Position = UDim2.new(1.8, 0, 0.5, 0)
	screenGui.Grade.Rotation = 359
	screenGui.Grade.Visible = true
	local maxScore = 0
	local maxCombo = 0
	for _, note in chart.notes do
		maxScore += 300
		if note.type == 0 then
			maxCombo += 1
		elseif note.type == 1 then
			maxCombo += 2
		end
	end
	screenGui.StatsContainer.Content.Marvelous.Text = `Marvelous: {Utils.formatNumber(notesMax)}`
	screenGui.StatsContainer.Content.Perfect.Text = `Perfect: {Utils.formatNumber(notes300)}`
	screenGui.StatsContainer.Content.Great.Text = `Great: {Utils.formatNumber(notes200)}`
	screenGui.StatsContainer.Content.Ok.Text = `Ok: {Utils.formatNumber(notes100)}`
	screenGui.StatsContainer.Content.Bad.Text = `Bad: {Utils.formatNumber(notes50)}`
	screenGui.StatsContainer.Content.Misses.Text = `Misses: {Utils.formatNumber(notesMisses)}`
	screenGui.StatsContainer.Content.Accuracy.Text = `Accuracy: {string.format("%.3f", accuracy)}%`
	screenGui.StatsContainer.Content.HitError.Text = `Avg. Hit Error: +{string.format("%.1f", math.abs(maxError))}ms, -{string.format("%.1f", math.abs(minError))}ms`
	screenGui.StatsContainer.Content.HighestCombo.Text = `Highest Combo: {Utils.formatNumber(highestCombo)}x / {Utils.formatNumber(maxCombo)}x`
	screenGui.StatsContainer.Content.TotalScore.Text = `Total Score: {Utils.formatNumber(totalScore)} / {Utils.formatNumber(maxScore)}`
	screenGui.StatsContainer.Position = UDim2.new(-0.99, 0, 0.5, 0)
	screenGui.StatsContainer.Visible = true
	local infoOut = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local infoIn = TweenInfo.new(1, Enum.EasingStyle.Quad, Enum.EasingDirection.In)
	TweenService:Create(screenGui.Grade, infoOut, {
		Position = UDim2.new(0.8, 0, 0.5, 0),
		Rotation = 6,
	}):Play()
	TweenService:Create(screenGui.StatsContainer, infoOut, {
		Position = UDim2.new(0.01, 0, 0.5, 0),
	}):Play()
	task.wait(infoOut.Time)
	screenGui.StatsContainer.Close.MouseButton1Click:Wait()
	TweenService:Create(screenGui.Grade, infoIn, {
		Position = UDim2.new(1.8, 0, 0.5, 0),
		Rotation = 359,
	}):Play()
	TweenService:Create(screenGui.StatsContainer, infoIn, {
		Position = UDim2.new(-0.99, 0, 0.5, 0),
	}):Play()
end
local function loadSongModule(module)
	return (require(module)).default
end
local endSongSelection
local function startSongSelection()
	return TS.Promise.new(function(resolve)
		local songSelector = screenGui.SongSelector
		if not songSelector then
			return resolve("<None>")
		end
		screenGui.SongSelector.Position = UDim2.new(-0.5, 0, 0.5, 0)
		screenGui.SongSelector.Rotation = 180
		screenGui.SongSelector.Visible = true
		local info = TweenInfo.new(1.5, Enum.EasingStyle.Elastic, Enum.EasingDirection.Out)
		TweenService:Create(screenGui.SongSelector, info, {
			Position = UDim2.new(0.5, 0, 0.5, 0),
			Rotation = 0,
		}):Play()
		local selectedDifficulty = nil
		local connections = {}
		local _arg0 = screenGui.SongSelector.Topbar.Close.MouseButton1Click:Once(function()
			for _, connection in connections do
				connection:Disconnect()
			end
			resolve("<Exit>")
		end)
		table.insert(connections, _arg0)
		local _arg0_1 = screenGui.SongSelector.Bottom.Skip.MouseButton1Click:Once(function()
			for _, connection in connections do
				connection:Disconnect()
			end
			resolve("<None>")
		end)
		table.insert(connections, _arg0_1)
		local _arg0_2 = screenGui.SongSelector.Bottom.Select.MouseButton1Click:Once(function()
			if selectedDifficulty ~= nil then
				for _, connection in connections do
					connection:Disconnect()
				end
				endSongSelection(selectedDifficulty, resolve)
			end
		end)
		table.insert(connections, _arg0_2)
		local function doSelection(container, list, itemType, template, orderByAttribute, callback)
			for _, item in container:GetChildren() do
				if item:IsA("TextButton") then
					item:Destroy()
				end
			end
			for _, item in list:GetChildren() do
				if not item:IsA(itemType) then
					continue
				end
				local button = template:Clone()
				button.Text = item.Name
				if orderByAttribute then
					local _condition = item:GetAttribute("Order")
					if _condition == nil then
						_condition = 0
					end
					button.Name = tostring(_condition)
				else
					button.Name = item.Name
				end
				button.Parent = container
				button.MouseButton1Click:Connect(function()
					return callback(item)
				end)
			end
		end
		local infoFrame = screenGui.SongSelector.Content.Info
		infoFrame.SongTitle.Text = "--"
		infoFrame.Composer.Text = "Select a difficulty"
		infoFrame.Mappers.Text = ""
		infoFrame.StarDifficulty.Text = ""
		infoFrame.MaxHealth.Text = ""
		infoFrame.OverallDifficulty.Text = ""
		infoFrame.Duration.Text = ""
		infoFrame.KeyCount.Text = ""
		screenGui.SongSelector.Bottom.Select.AutoButtonColor = false
		screenGui.SongSelector.Bottom.Select.BackgroundColor3 = Color3.fromRGB(102, 179, 117)
		doSelection(screenGui.SongSelector.Content.Categories, songsFolder, "Folder", categoryButtonTemplate, false, function(category)
			doSelection(screenGui.SongSelector.Content.Songs, category, "Folder", songButtonTemplate, false, function(song)
				infoFrame.SongTitle.Text = song.Name
				infoFrame.Composer.Text = "Select a difficulty"
				infoFrame.Mappers.Text = ""
				infoFrame.StarDifficulty.Text = ""
				infoFrame.MaxHealth.Text = ""
				infoFrame.OverallDifficulty.Text = ""
				infoFrame.Duration.Text = ""
				infoFrame.KeyCount.Text = ""
				screenGui.SongSelector.Bottom.Select.AutoButtonColor = false
				screenGui.SongSelector.Bottom.Select.BackgroundColor3 = Color3.fromRGB(102, 179, 117)
				selectedDifficulty = nil
				doSelection(screenGui.SongSelector.Content.Info.Difficulties, song, "ModuleScript", difficultyButtonTemplate, false, function(difficulty)
					selectedDifficulty = difficulty
					local chart = loadSongModule(difficulty)
					local length = 0
					for _, note in chart.notes do
						if note.millisecond > length then
							length = note.millisecond
						end
					end
					local minutes = length // 60000
					local seconds = (length / 1000) % 60
					local difficultyNumber, difficultyWord = calculateDifficulty(chart)
					infoFrame.Composer.Text = `Composer: {chart.metadata.artist}`
					infoFrame.Mappers.Text = `Mappers: {table.concat(chart.metadata.mappers, ", ")}`
					infoFrame.StarDifficulty.Text = `DIF: {difficultyWord} (@{string.format("%.1f", difficultyNumber)})`
					infoFrame.MaxHealth.Text = `HP: {chart.difficulty.maxHealth}`
					infoFrame.OverallDifficulty.Text = `OD: {chart.difficulty.overallDifficulty}`
					infoFrame.Duration.Text = `DUR: {string.format("%d:%02d", minutes, seconds)}`
					infoFrame.KeyCount.Text = `KEYS: {chart.metadata.totalLanes}K`
					screenGui.SongSelector.Bottom.Select.AutoButtonColor = true
					screenGui.SongSelector.Bottom.Select.BackgroundColor3 = Color3.fromRGB(155, 255, 175)
				end)
			end)
		end)
	end)
end
function endSongSelection(difficulty, resolve)
	for _, categoryButton in screenGui.SongSelector.Content.Categories:GetChildren() do
		if categoryButton:IsA("TextButton") then
			categoryButton:Destroy()
		end
	end
	for _, songButton in screenGui.SongSelector.Content.Songs:GetChildren() do
		if songButton:IsA("TextButton") then
			songButton:Destroy()
		end
	end
	for _, difficultyButton in screenGui.SongSelector.Content.Info.Difficulties:GetChildren() do
		if difficultyButton:IsA("TextButton") then
			difficultyButton:Destroy()
		end
	end
	local info = TweenInfo.new(1, Enum.EasingStyle.Back, Enum.EasingDirection.In)
	screenGui.SongSelector.Position = UDim2.new(0.5, 0, 0.5, 0)
	TweenService:Create(screenGui.SongSelector, info, {
		Position = UDim2.new(1.5, 0, 0.5, 0),
		Rotation = 180,
	}):Play()
	if difficulty ~= nil and resolve ~= nil then
		resolve(difficulty)
	end
end
local function updatePreview(preview, songFolder, updateData, chart)
	local sections = string.split(updateData, "|")
	local data = sections[1]
	local _binding = string.split(data, ",")
	local stringTotalScore = _binding[1]
	local stringAccuracy = _binding[2]
	local stringNotesMisses = _binding[3]
	local stringNoteCombo = _binding[4]
	local noteSkin = _binding[5]
	local totalNotes = #chart.notes
	local maxScore = totalNotes * 300
	local _condition = tonumber(stringTotalScore)
	if _condition == nil then
		_condition = 0
	end
	local totalScore = math.clamp(_condition, 0, maxScore)
	local _condition_1 = tonumber(stringAccuracy)
	if _condition_1 == nil then
		_condition_1 = tonumber("nan")
	end
	local accuracy = math.clamp(_condition_1, 0, 100)
	local _condition_2 = tonumber(stringNotesMisses)
	if _condition_2 == nil then
		_condition_2 = 0
	end
	local notesMisses = math.clamp(_condition_2, 0, totalNotes)
	local _condition_3 = tonumber(stringNoteCombo)
	if _condition_3 == nil then
		_condition_3 = 0
	end
	local noteCombo = math.clamp(_condition_3, 0, totalNotes)
	local selectedSkinFolder = skinsFolder:FindFirstChild(noteSkin)
	if not selectedSkinFolder then
		return nil
	end
	local laneTemplates = {}
	for _, subKeyFolder in selectedSkinFolder:GetChildren() do
		if not subKeyFolder:IsA("Folder") then
			continue
		end
		TS.try(function()
			local lanes = parseSubKeyName(subKeyFolder.Name, chart.metadata.totalLanes)
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
	local totalLanes = chart.metadata.totalLanes
	local laneFrames = preview.SurfaceGui.Lanes:GetChildren()
	local usedArrows = {}
	local laneHolds = {}
	local info = TweenInfo.new(0.067, Enum.EasingStyle.Linear, Enum.EasingDirection.In)
	for i = 1, chart.metadata.totalLanes do
		if not preview.SurfaceGui.Lanes:FindFirstChild(tostring(i)) then
			local lane = laneTemplates[i].Lane:Clone()
			lane.Name = tostring(i)
			lane.ZIndex = i
			lane.Size = UDim2.new(0, laneWidth, 1, 0)
			lane.Position = UDim2.new(0, (preview.SurfaceGui.AbsoluteSize.X / 2) - laneWidth * (totalLanes / 2 - i + 1), 0, 0)
			lane.UIPadding.PaddingLeft = UDim.new(0, lanePadding)
			lane.UIPadding.PaddingRight = UDim.new(0, lanePadding)
			lane.JudgementLine.Position = UDim2.new(0.5, 0, defaultHitPosition / 480, 0)
			lane.Parent = preview.SurfaceGui.Lanes
			table.insert(laneFrames, lane)
		end
	end
	for i = 1, #sections - 2 do
		local _exp = string.split(sections[i + 1], ",")
		-- ▼ ReadonlyArray.map ▼
		local _newValue = table.create(#_exp)
		local _callback = function(value)
			local _condition_4 = tonumber(value)
			if _condition_4 == nil then
				_condition_4 = 0
			end
			return _condition_4
		end
		for _k, _v in _exp do
			_newValue[_k] = _callback(_v, _k - 1, _exp)
		end
		-- ▲ ReadonlyArray.map ▲
		local _binding_1 = _newValue
		local lane = _binding_1[1]
		local yScale = _binding_1[2]
		local noteType = _binding_1[3]
		local id = _binding_1[4]
		if lane < 0 or lane >= chart.metadata.totalLanes then
			continue
		end
		yScale /= 1000
		local laneContainer = laneFrames[lane + 1]
		if not laneContainer then
			return nil
		end
		local template = laneTemplates[lane + 1]
		if noteType == 0 then
			local note = laneContainer.Notes:FindFirstChild(tostring(id))
			if not note then
				note = template.Note:Clone()
				note.Name = tostring(id)
				note.Position = UDim2.new(0, 0, yScale, 0)
				note.AnchorPoint = Vector2.new(0, 1)
				note.Parent = laneContainer.Notes
			else
				TweenService:Create(note, info, {
					Position = UDim2.new(0, 0, yScale, 0),
				}):Play()
			end
			local _note = note
			usedArrows[_note] = true
		elseif noteType == 1 then
			local tailNote = laneContainer.Notes:FindFirstChild(tostring(id))
			if not tailNote then
				tailNote = template.TailNote:Clone()
				tailNote.Name = tostring(id)
				tailNote.Position = UDim2.new(0, 0, yScale, 0)
				tailNote.AnchorPoint = Vector2.new(0, 1)
				tailNote.Parent = laneContainer.Notes
			else
				TweenService:Create(tailNote, info, {
					Position = UDim2.new(0, 0, yScale, 0),
				}):Play()
			end
			local _tailNote = tailNote
			usedArrows[_tailNote] = true
			local _lane = lane
			local holdYScale = laneHolds[_lane]
			if holdYScale ~= 0 and holdYScale == holdYScale and holdYScale then
				local bodyNote = laneContainer.Notes:FindFirstChild(tostring(id + 0.5))
				if not bodyNote then
					bodyNote = template.BodyNote:Clone()
					bodyNote.Name = tostring(id + 0.5)
					bodyNote.Position = UDim2.new(0, 0, yScale, laneWidth // (-2))
					bodyNote.Size = UDim2.new(1, 0, holdYScale - yScale, 0)
					bodyNote.AnchorPoint = Vector2.new(0, 0)
					bodyNote.Parent = laneContainer.Notes
				else
					TweenService:Create(bodyNote, info, {
						Position = UDim2.new(0, 0, yScale, laneWidth // (-2)),
						Size = UDim2.new(1, 0, holdYScale - yScale, 0),
					}):Play()
				end
				local _lane_1 = lane
				laneHolds[_lane_1] = nil
				local _bodyNote = bodyNote
				usedArrows[_bodyNote] = true
			end
		elseif noteType == 2 then
			local holdNote = laneContainer.Notes:FindFirstChild(tostring(id))
			if not holdNote then
				holdNote = template.HoldNote:Clone()
				holdNote.Name = tostring(id)
				holdNote.Position = UDim2.new(0, 0, yScale, 0)
				holdNote.AnchorPoint = Vector2.new(0, 1)
				holdNote.Parent = laneContainer.Notes
			else
				TweenService:Create(holdNote, info, {
					Position = UDim2.new(0, 0, yScale, 0),
				}):Play()
			end
			local _lane = lane
			local _yScale = yScale
			laneHolds[_lane] = _yScale
			local _holdNote = holdNote
			usedArrows[_holdNote] = true
		end
	end
	for _, lane in laneFrames do
		local laneNumber = tonumber(lane.Name)
		if not (laneNumber ~= 0 and laneNumber == laneNumber and laneNumber) or laneNumber < 1 or laneNumber > totalLanes then
			lane:Destroy()
		else
			for _1, arrow in lane.Notes:GetChildren() do
				if not (usedArrows[arrow] ~= nil) then
					arrow:Destroy()
				end
			end
		end
	end
end
return {
	calculateAccuracy = calculateAccuracy,
	calculateDifficulty = calculateDifficulty,
	calculateActualNoteSpeed = calculateActualNoteSpeed,
	updateHUD = updateHUD,
	calculateYPosition = calculateYPosition,
	hitNote = hitNote,
	laneOnPress = laneOnPress,
	laneOnRelease = laneOnRelease,
	start = start,
	finish = finish,
	showGrade = showGrade,
	loadSongModule = loadSongModule,
	startSongSelection = startSongSelection,
	endSongSelection = endSongSelection,
	updatePreview = updatePreview,
}
