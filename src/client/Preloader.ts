import {
	ContentProvider,
} from '@rbxts/services';

import { Constants } from 'shared/Constants';

const content: (Instance | string)[] = [];

for (const [, imageId] of pairs(Constants.ImageIds.RankImages)) {
	content.push(imageId);
	
	const imageLabel = new Instance('ImageLabel');
	imageLabel.Image = imageId;
	content.push(imageLabel);
}

for (const [, imageId] of pairs(Constants.ImageIds.TopbarImages)) {
	content.push(imageId);
	
	const imageLabel = new Instance('ImageLabel');
	imageLabel.Image = imageId;
	content.push(imageLabel);
}

ContentProvider.PreloadAsync(content);

for (const instance of content) if (typeIs(instance, 'Instance')) instance.Destroy();