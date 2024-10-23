import {
    ContentProvider,
} from '@rbxts/services';

import { $print } from 'rbxts-transform-debug';
import * as Constants from 'shared/Constants';

export function preload() {
    const content: (Instance | string)[] = [];
    
    for (const [, imageId] of pairs(Constants.ImageIds.RankImages)) {
        content.push(imageId);
        
        const imageLabel = new Instance('ImageLabel');
        imageLabel.Image = imageId;
        content.push(imageLabel);
    }
    
    ContentProvider.PreloadAsync(content, (contentId, status) => $print(`Loaded '${contentId}' with status ${status.Name}`));
    
    for (const instance of content) if (typeIs(instance, 'Instance')) instance.Destroy();
}