import * as MarkdownParser from 'shared/MarkdownParser';

export function parse(markdown: string, frame: GuiObject) {
	let i = 0;
	
	frame.ClearAllChildren();
	
	const layout = new Instance('UIListLayout');
	layout.FillDirection = Enum.FillDirection.Vertical;
	layout.SortOrder = Enum.SortOrder.LayoutOrder;
	layout.Padding = new UDim(0, 6);
	layout.Parent = frame;
	
	for (const [blockType, blockData] of MarkdownParser.parse(markdown)) {
		if (blockType === MarkdownParser.BlockType.Paragraph) {
			const label = new Instance('TextLabel');
			label.BackgroundTransparency = 1;
			label.Size = new UDim2(1, 0, 0, 0);
			label.AutomaticSize = Enum.AutomaticSize.Y;
			label.TextWrapped = true;
			label.RichText = true;
			label.FontFace = Font.fromEnum(Enum.Font.BuilderSans);
			label.Text = '\t'.rep(blockData.Indent ?? 0) + (blockData.Text ?? '');
			label.SetAttribute('TextSize', 'N');
			label.TextColor3 = Color3.fromRGB(255, 255, 255);
			label.TextXAlignment = Enum.TextXAlignment.Left;
			label.TextYAlignment = Enum.TextYAlignment.Top;
			label.LayoutOrder = i;
			label.Parent = frame;
		} else if (blockType === MarkdownParser.BlockType.Heading) {
			const label = new Instance('TextLabel');
			label.BackgroundTransparency = 1;
			label.Size = new UDim2(1, 0, 0, 0);
			label.AutomaticSize = Enum.AutomaticSize.Y;
			label.TextWrapped = true;
			label.RichText = true;
			label.FontFace = Font.fromEnum(Enum.Font.BuilderSans);
			label.Text = '\t'.rep(blockData.Indent ?? 0) + '<b>' + (blockData.Text ?? '') + '</b>';
			
			if (blockData.Level === 1) label.SetAttribute('TextSize', 'XL');
			else if (blockData.Level === 2) label.SetAttribute('TextSize', 'L');
			else if (blockData.Level === 3) label.SetAttribute('TextSize', 'L');
			else if (blockData.Level === 4) label.SetAttribute('TextSize', 'M');
			else label.SetAttribute('TextSize', 'N');
			
			label.TextColor3 = Color3.fromRGB(255, 255, 255);
			label.TextXAlignment = Enum.TextXAlignment.Left;
			label.TextYAlignment = Enum.TextYAlignment.Top;
			label.LayoutOrder = i;
			label.Parent = frame;
		} else if (blockType === MarkdownParser.BlockType.List) {
			const container = new Instance('Frame');
			container.BackgroundTransparency = 1;
			container.Size = new UDim2(1, 0, 0, 0);
			container.AutomaticSize = Enum.AutomaticSize.Y;
			container.LayoutOrder = i;
			
			const layout = new Instance('UIListLayout');
			layout.FillDirection = Enum.FillDirection.Vertical;
			layout.SortOrder = Enum.SortOrder.LayoutOrder;
			layout.Padding = new UDim(0, 6);
			layout.Parent = container;
			
			if (blockData.Lines !== undefined) {
				for (const [j, line] of ipairs(blockData.Lines!)) {
					const label = new Instance('TextLabel');
					label.BackgroundTransparency = 1;
					label.Size = new UDim2(1, 0, 0, 0);
					label.AutomaticSize = Enum.AutomaticSize.Y;
					label.TextWrapped = true;
					label.RichText = true;
					label.FontFace = Font.fromEnum(Enum.Font.BuilderSans);
					label.Text = '\t'.rep((blockData.Indent ?? 0) + line.Level) + ' • ' + (line.Text ?? '');
					label.SetAttribute('TextSize', 'N');
					label.TextColor3 = Color3.fromRGB(255, 255, 255);
					label.TextXAlignment = Enum.TextXAlignment.Left;
					label.TextYAlignment = Enum.TextYAlignment.Top;
					label.LayoutOrder = j;
					label.Parent = container;
				}
			}
			
			container.Parent = frame;
		} else if (blockType === MarkdownParser.BlockType.Ruler) {
			const container = new Instance('Frame');
			container.BackgroundTransparency = 1;
			container.Size = new UDim2(1, 0, 0, 20);
			
			const line = new Instance('Frame');
			line.BackgroundColor3 = Color3.fromRGB(255, 255, 255);
			line.BorderSizePixel = 0;
			line.Size = new UDim2(1, 0, 0, 2);
			line.AnchorPoint = new Vector2(0.5, 0.5);
			line.Position = new UDim2(0.5, 0, 0.5, 0);
			line.Parent = container;
			
			container.Parent = frame;
		} else {
			warn(`Unsupported block type: ${blockType}`);
			continue;
		}
		
		i++;
	}
}