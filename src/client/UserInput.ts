import {
	UserInputService,
} from '@rbxts/services';

import { $print } from 'rbxts-transform-debug';

const hotkeyObjects = new Map<string, Hotkey>();

export class Hotkey {
	keyCode: Enum.KeyCode;
	name: string;
	canPress: boolean;
	isPressed: boolean;
	destroyed: boolean;
	private _onPress: (() => void)[] = [];
	private _onRelease: (() => void)[] = [];
	
	constructor(name: string, keyCode: Enum.KeyCode) {
		this.keyCode = keyCode;
		this.name = name;
		this.isPressed = false;
		this.destroyed = false;
		this.canPress = true;
		
		hotkeyObjects.get(name)?.destroy();
		hotkeyObjects.set(name, this);
	}
	
	onPress(callback: () => void) {
		this._onPress.push(callback);
	}
	
	onRelease(callback: () => void) {
		this._onRelease.push(callback);
	}
	
	press(fromInput: boolean = false) {
		if (this.isPressed || (!this.canPress && fromInput)) return;
		this.isPressed = true;
		for (const callback of this._onPress) callback();
	}
	
	release(fromInput: boolean = false) {
		if (!this.isPressed || (!this.canPress && fromInput)) return;
		this.isPressed = false;
		for (const callback of this._onRelease) callback();
	}
	
	destroy() {
		this._onPress.clear();
		this._onRelease.clear();
		this.destroyed = true;
		hotkeyObjects.delete(this.name);
	}
}

export function init() {
	const activeKeys = new Set<Enum.KeyCode>();
	
	function clearAllActiveKeys() {
		$print('Releasing all active hotkeys because player tabbed out of game window or focused onto a text box');
		
		if (!activeKeys.isEmpty()) {
			for (const key of activeKeys) {
				for (const [, hotkey] of hotkeyObjects) {
					if (hotkey.keyCode === key) hotkey.release(true);
				}
			}
			
			activeKeys.clear();
		}
	}
	
	UserInputService.InputBegan.Connect((input) => {
		if (input.KeyCode !== Enum.KeyCode.Unknown && !activeKeys.has(input.KeyCode)) {
			activeKeys.add(input.KeyCode);
			
			for (const [, hotkey] of hotkeyObjects) {
				if (hotkey.keyCode === input.KeyCode) hotkey.press(true);
			}
		}
	});
	
	UserInputService.InputEnded.Connect((input) => {
		if (input.KeyCode !== Enum.KeyCode.Unknown && activeKeys.has(input.KeyCode)) {
			activeKeys.delete(input.KeyCode);
			
			for (const [, hotkey] of hotkeyObjects) {
				if (hotkey.keyCode === input.KeyCode) hotkey.release(true);
			}
		}
	});
	
	UserInputService.WindowFocusReleased.Connect(clearAllActiveKeys);
	UserInputService.TextBoxFocused.Connect(clearAllActiveKeys);
	UserInputService.TextBoxFocusReleased.Connect(clearAllActiveKeys);
}