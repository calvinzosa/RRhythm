import {
	Players,
	RunService,
} from '@rbxts/services';

import { Icon } from '@rbxts/topbar-plus';

import { $print } from 'rbxts-transform-debug';

const player = Players.LocalPlayer;

Icon.modifyBaseTheme(['IconLabel', 'FontFace', Font.fromEnum(Enum.Font.BuilderSans)]);
Icon.modifyBaseTheme(['NoticeLabel', 'FontFace', Font.fromEnum(Enum.Font.BuilderSans)]);

export const Settings = new Icon().setImage('rbxassetid://9753762469').setCaption('Settings').oneClick(false).autoDeselect(true);

export const ShopEnter = new Icon().setImage('rbxassetid://12122755689').setLabel('Enter').oneClick(true);
export const ShopAnimations = new Icon().setImage('rbxassetid://11932783331').setLabel('Animations').oneClick(true);
export const ShopEmotes = new Icon().setImage('rbxassetid://7035631382').setLabel('Emotes').oneClick(true);
export const ShopSkins = new Icon().setImage('rbxassetid://17333707046').setLabel('Skins').oneClick(true);
export const ShopCaptions = new Icon().setImage('rbxassetid://15671472002').setLabel('Captions').oneClick(true);

export const ShopDropdown = new Icon().setImage('rbxassetid://13429538917').setCaption('Shop').oneClick(false).autoDeselect(false).setDropdown([
	ShopEnter,
	ShopAnimations,
	ShopEmotes,
	ShopSkins,
	ShopCaptions,
]).modifyTheme(['Dropdown', 'MaxIcons', 3]);

export const Profile = new Icon().setImage('rbxassetid://13805569043').setCaption('Profile').oneClick(false).autoDeselect(true);

export const GameMenu = new Icon().setImage('rbxassetid://11207519213').setCaption('Game Menu').setMenu([
	Settings,
	ShopDropdown,
	Profile,
]);

ShopEnter.selected.Connect(() => ShopDropdown.deselect());
ShopAnimations.selected.Connect(() => ShopDropdown.deselect());
ShopEmotes.selected.Connect(() => ShopDropdown.deselect());
ShopSkins.selected.Connect(() => ShopDropdown.deselect());
ShopCaptions.selected.Connect(() => ShopDropdown.deselect());