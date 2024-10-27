import {
	Players,
	RunService,
} from '@rbxts/services';

import { Icon } from '@rbxts/topbar-plus';
import { $print } from 'rbxts-transform-debug';

import { Constants } from 'shared/Constants';

const player = Players.LocalPlayer;

Icon.modifyBaseTheme(['IconLabel', 'FontFace', Font.fromEnum(Enum.Font.BuilderSans)]);
Icon.modifyBaseTheme(['NoticeLabel', 'FontFace', Font.fromEnum(Enum.Font.BuilderSans)]);

export const Settings = new Icon().setImage(Constants.ImageIds.TopbarImages.SettingsIcon).setImageScale(0.75).setCaption('Settings').oneClick(false).autoDeselect(true);

export const ShopEnter = new Icon().setImage(Constants.ImageIds.TopbarImages.DoorIcon).setLabel('Enter').oneClick(true);
export const ShopAnimations = new Icon().setImage(Constants.ImageIds.TopbarImages.AnimationsIcon).setLabel('Animations').oneClick(true);
export const ShopEmotes = new Icon().setImage(Constants.ImageIds.TopbarImages.EmotesIcon).setLabel('Emotes').oneClick(true);
export const ShopSkins = new Icon().setImage(Constants.ImageIds.TopbarImages.SkinsIcon).setLabel('Skins').oneClick(true);
export const ShopCaptions = new Icon().setImage(Constants.ImageIds.TopbarImages.CaptionsIcon).setLabel('Captions').oneClick(true);

export const ShopDropdown = new Icon().setImage(Constants.ImageIds.TopbarImages.ShopIcon).setImageScale(0.75).setCaption('Shop').oneClick(false).autoDeselect(false)
	.setDropdown([
		ShopEnter,
		ShopAnimations,
		ShopEmotes,
		ShopSkins,
		ShopCaptions,
	]).modifyTheme(['Dropdown', 'MaxIcons', 5]);

export const Profile = new Icon().setImage(Constants.ImageIds.TopbarImages.ProfileIcon).setImageScale(0.75).setCaption('Profile').oneClick(false).autoDeselect(true);

export const GameMenu = new Icon().setImage(Constants.ImageIds.TopbarImages.MenuIcon).setImageScale(0.75).setCaption('Game Menu').setMenu([
	Settings,
	ShopDropdown,
	Profile,
]);

ShopEnter.selected.Connect(() => ShopDropdown.deselect());
ShopAnimations.selected.Connect(() => ShopDropdown.deselect());
ShopEmotes.selected.Connect(() => ShopDropdown.deselect());
ShopSkins.selected.Connect(() => ShopDropdown.deselect());
ShopCaptions.selected.Connect(() => ShopDropdown.deselect());