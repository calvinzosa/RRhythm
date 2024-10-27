/*
local s = ''
local function check(i,l)
	if #s == 0 then
		s = string.format('\nexport type %s = %s & {\n',i.Name,i.ClassName)
	end
	local indent = string.rep('	',l)
	for _, child in i:GetChildren() do
		local childType = string.format('%s%s: %s', indent, child.Name, child.ClassName)
		if #child:GetChildren() > 0 then
			s..=`{childType} & \{\n`
			check(child,l+1)
			s..=`{indent}};\n`
		else
			s..=`{childType};\n`
		end
	end
end
check(game, 1)s..='};\n'print(s)
*/

// Standard Types

export type Grade = 'X' | 'S' | 'A' | 'B' | 'C' | 'D';
export type RoundStats = [ number, number, number, number, number, number, number, number, number, number, number ];

export type InfoUpdateData =
	{
		isSelected: false,
		songTitle?: string,
		chart: undefined,
	} | {
		isSelected: true,
		songTitle: string,
		chart: Chart,
	}

// Replicated Storage

export type EventsFolder = Folder & {
	ChooseSong: RemoteFunction;
	JoinStage: RemoteEvent;
	UpdateStats: RemoteEvent;
	StartSongSelection: RemoteEvent;
	EndSongSelection: RemoteEvent;
	StageStartSong: RemoteEvent;
	UpdateStagePreview: RemoteEvent;
	StartStagePreview: RemoteEvent;
	EndStagePreview: RemoteEvent;
};

export type SkinFolder = Folder & {
	Note: UINote;
	HoldNote: UIHoldNote;
	TailNote: UITailNote;
	BodyNote: UIBodyNote;
	Lane: UILane;
};

// ProfileService Data

export type ProfileOwnedAnimation = ProfileBaseOwnedItem & {
	Type: 0,
	AnimationName: string,
};

export type ProfileOwnedEmote = ProfileBaseOwnedItem & {
	Type: 1,
	EmoteName: string,
};

export type ProfileOwnedSkin = ProfileBaseOwnedItem & {
	Type: 2,
	SkinName: string,
};

export type ProfileOwnedCaption = ProfileBaseOwnedItem & {
	Type: 3,
	CaptionName: string,
};

export type ProfileBaseOwnedItem = {
	DatePurchased: string,
};

export type ProfileOwnedItem =
	| ProfileOwnedAnimation
	| ProfileOwnedEmote
	| ProfileOwnedSkin
	| ProfileOwnedCaption;

// Models

export type StagePlayer = Part & {
	Trigger: ProximityPrompt;
	Attachment0: Attachment;
	RigidConstraint: RigidConstraint;
	Character: ObjectValue;
};

export type StagePreview = Part & {
	SurfaceGui: SurfaceGui & {
		Background: Frame;
		Lanes: CanvasGroup;
		InfoHUD: UIInfoHUD;
		AccuracyDisplay: UIAccuracyDisplay;
		ComboCounter: UIComboCounter;
	};
};

export type StageModel = Model & {
	Base: Part;
	Camera: Part;
	SongInfo: Part & {
		SurfaceGui: SurfaceGui & {
			TextLabel: TextLabel;
		}
	}
};

// User Interface

export type UITooltip = Frame & {
	Left: Frame & {
		UIListLayout: UIListLayout;
		Tail: ImageLabel;
		Label: TextLabel & {
			UISizeConstraint: UISizeConstraint;
			UIPadding: UIPadding;
		};
	};
	Right: Frame & {
		UIListLayout: UIListLayout;
		Tail: ImageLabel;
		Label: TextLabel & {
			UISizeConstraint: UISizeConstraint;
			UIPadding: UIPadding;
		};
	};
};

export type UIGrade = Frame & {
	Icon: ImageLabel;
};

export type UISongSelector = Frame & {
	UICorner: UICorner;
	UIListLayout: UIListLayout;
	UIPadding: UIPadding;
	Topbar: Frame & {
		Close: TextButton & {
			UIAspectRatioConstraint: UIAspectRatioConstraint;
		};
		Title: TextLabel & {
			UIFlexItem: UIFlexItem;
		};
		UIListLayout: UIListLayout;
		TimeLeft: TextLabel;
	};
	Content: Frame & {
		UIListLayout: UIListLayout;
		Songs: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			UIFlexItem: UIFlexItem;
		};
		Info: Frame & {
			UIListLayout: UIListLayout;
			Composer: TextLabel;
			UIPadding: UIPadding;
			SongTitle: TextLabel;
			Mappers: TextLabel;
			UIFlexItem: UIFlexItem;
			StarDifficulty: TextLabel;
			Duration: TextLabel;
			MaxHealth: TextLabel;
			OverallDifficulty: TextLabel;
			MaxCombo: TextLabel;
			KeyCount: TextLabel;
			Difficulties: ScrollingFrame & {
				UIListLayout: UIListLayout;
				UIPadding: UIPadding;
			};
		};
		Categories: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			UIFlexItem: UIFlexItem;
		};
		UIFlexItem: UIFlexItem;
	};
	Bottom: Frame & {
		UIListLayout: UIListLayout;
		Skip: TextButton & {
			UIFlexItem: UIFlexItem;
		};
		Select: TextButton & {
			UIFlexItem: UIFlexItem;
		};
	};
};

export type UIStatsContainer = Frame & {
	Header: TextLabel;
	UIPadding: UIPadding;
	UIListLayout: UIListLayout;
	Content: Frame & {
		UIFlexItem: UIFlexItem;
		UIListLayout: UIListLayout;
		Marvelous: TextLabel;
		UIPadding: UIPadding;
		Perfect: TextLabel;
		Great: TextLabel;
		Ok: TextLabel;
		Bad: TextLabel;
		Misses: TextLabel;
		Accuracy: TextLabel;
		HitError: TextLabel;
		HighestCombo: TextLabel;
		TotalScore: TextLabel;
	};
	Close: TextButton & {
		UIPadding: UIPadding;
	};
};

export type UIComboCounter = CanvasGroup & {
	Combo: TextLabel & {
		UIScale: UIScale;
	};
};

export type UIAccuracyDisplay = CanvasGroup & {
	Accuracy: TextLabel & {
		UIScale: UIScale;
	};
};

export type UIInfoHUD = Frame & {
	UIListLayout: UIListLayout;
	Accuracy: TextLabel;
	Combo: TextLabel;
	Misses: TextLabel;
	Score: TextLabel;
};

export type UIDebugHUD = Frame & {
	FPS: TextLabel;
	NoteSkin: TextLabel;
	Autoplay: TextLabel;
	HitPosition: TextLabel;
	AverageError: TextLabel;
	PressedNotes: TextLabel;
	RenderedNotes: TextLabel;
	Time: TextLabel;
	PixelsPerSecond: TextLabel;
	BPM: TextLabel;
	ScrollSpeed: TextLabel;
	NoteSpeed: TextLabel;
	UIListLayout: UIListLayout;
};

export type UIEditorTextInput = Frame & {
	UIListLayout: UIListLayout;
	Property: TextLabel & {
		UIFlexItem: UIFlexItem;
		UIPadding: UIPadding;
	};
	Value: TextBox & {
		UIFlexItem: UIFlexItem;
		UIPadding: UIPadding;
		UIStroke: UIStroke;
	};
	UIPadding: UIPadding;
};

export type UIEditorDropdownItem = TextButton & {
	UIPadding: UIPadding;
};

export type UIEditorDropdown = Frame & {
	UIListLayout: UIListLayout;
	Property: TextLabel & {
		UIFlexItem: UIFlexItem;
		UIPadding: UIPadding;
	};
	UIPadding: UIPadding;
	Dropdown: TextButton & {
		UIPadding: UIPadding;
		UIStroke: UIStroke;
		UIFlexItem: UIFlexItem;
		Items: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIStroke: UIStroke;
		};
		Arrow: ImageLabel & {
			UIAspectRatioConstraint: UIAspectRatioConstraint;
		};
	};
};

export type UIEditorList = Frame & {
	UIListLayout: UIListLayout;
	Property: TextLabel & {
		UIFlexItem: UIFlexItem;
		UIPadding: UIPadding;
	};
	UIPadding: UIPadding;
	List: Frame & {
		UIFlexItem: UIFlexItem;
		UIListLayout: UIListLayout;
		Value: TextBox & {
			UIPadding: UIPadding;
			UIStroke: UIStroke;
			Add: TextButton & {
				UIAspectRatioConstraint: UIAspectRatioConstraint;
			};
		};
		Template: TextButton & {
			UIStroke: UIStroke;
			UIPadding: UIPadding;
		};
	};
};

export type UIEditor = Frame & {
	Lanes: CanvasGroup;
	Info: Frame & {
		Milliseconds: TextLabel;
	};
	Content: Frame & {
		Tabs: Frame & {
			Content: Frame & {
				UIListLayout: UIListLayout;
				Metadata: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
				View: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
				Timings: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
				Events: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
				Load: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
				Export: TextButton & {
					UIFlexItem: UIFlexItem;
					UIPadding: UIPadding;
					Underline: Frame;
				};
			};
		};
		Metadata: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			Title: UIEditorTextInput
			AudioName: UIEditorTextInput;
			Set: UIEditorDropdown;
			Description: UIEditorTextInput;
			Difficulty: UIEditorTextInput;
			OverallDifficulty: UIEditorTextInput;
			LaneCount: UIEditorTextInput;
			Source: UIEditorTextInput;
			Artist: UIEditorTextInput;
			Mappers: UIEditorList;
			Tags: UIEditorList;
		};
		View: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			BeatSnapDivisor: UIEditorTextInput;
			LaneWidth: UIEditorTextInput;
			HitPosition: UIEditorTextInput;
		};
		Timings: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			TextLabel: TextLabel;
		};
		Events: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			TextLabel: TextLabel;
		};
		Load: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			Target: UIEditorDropdown;
			Load: TextButton;
		};
		Export: ScrollingFrame & {
			UIListLayout: UIListLayout;
			UIPadding: UIPadding;
			TextLabel: TextLabel;
		};
	};
	RefreshPreview: TextButton & {
		UIPadding: UIPadding;
		UIStroke: UIStroke;
	};
};

export type UILane = CanvasGroup & {
	UIPadding: UIPadding;
	Notes: Frame;
	JudgementLine: Frame & {
		UIAspectRatioConstraint: UIAspectRatioConstraint;
		Note: Frame & {
			UICorner: UICorner;
			UIStroke: UIStroke;
		};
	};
};

export type UINote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIHoldNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UITailNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIBodyNote = Frame & {
	UIAspectRatioConstraint: UIAspectRatioConstraint;
	Note: Frame & {
		UICorner: UICorner;
	};
};

export type UIMain = ScreenGui & {
	Tooltip: UITooltip;
	Lanes: CanvasGroup;
	Transition: Frame;
	Grade: UIGrade;
	SongSelector: UISongSelector;
	StatsContainer: UIStatsContainer;
	ComboCounter: UIComboCounter;
	AccuracyDisplay: UIAccuracyDisplay;
	InfoHUD: UIInfoHUD;
	Editor: UIEditor;
	DebugHUD: UIDebugHUD;
};

// Gameplay

export type NormalCreatedNote = BaseCreatedNote & {
	isTailNote: false;
	isHoldNote: false;
	note: UINote;
};

export type TailCreatedNote = BaseCreatedNote & {
	isTailNote: true;
	isHoldNote: false;
	note: UITailNote;
	holdNote?: HoldCreatedNote;
};

export type HoldCreatedNote = BaseCreatedNote & {
	isTailNote: false;
	isHoldNote: true;
	note: UIHoldNote;
	bodyNote: UIBodyNote;
	tailNote?: TailCreatedNote;
	isHeld: boolean;
	isReleased: boolean;
};

export type BaseCreatedNote = {
	isHoldNote: boolean;
	isTailNote: boolean;
	noteData: NoteObject;
	didPress: boolean;
	didAutoPress: boolean;
	id: number;
};

export type CreatedNote =
	| NormalCreatedNote
	| TailCreatedNote
	| HoldCreatedNote;

export type BaseTimingObject = {
	type: number;
	millisecond: number;
	volume?: number;
};

export type NormalTimingObject = BaseTimingObject & {
	type: 0;
	bpm?: number | -1;
	scrollSpeed?: number | -1;
};

export type BaseNoteObject = {
	type: number;
	millisecond: number;
	lane: number;
};

export type NormalNoteObject = BaseNoteObject & {
	type: 0;
};

export type HoldNoteObject = BaseNoteObject & {
	type: 1;
	holdLength: number;
};

export type TimingObject =
	| NormalTimingObject;

export type NoteObject =
	| NormalNoteObject
	| HoldNoteObject;

export type EventObject = {};

export type Chart = {
	metadata: {
		title: string;
		audioName: string;
		setName: string;
		description: string;
		difficulty: string;
		source: string;
		artist: string;
		mappers: (number | string)[];
		searchTags: string[];
		totalLanes: number;
	},
	difficulty: {
		damageRate: number;
		maxHealth: number;
		overallDifficulty: number;
	},
	events?: EventObject[];
	timings: TimingObject[];
	notes: NoteObject[];
};