import { HttpService, ReplicatedStorage } from '@rbxts/services';
import { $git } from 'rbxts-transform-debug';

export function init() {
	while (true) {
		const changelogURL = 'https://raw.githubusercontent.com/calvinzosa/RRhythm/refs/heads/main/CHANGELOG.md';
		
		const response = HttpService.RequestAsync({
			Url: changelogURL,
		});
		
		if (response.Success) {
			(ReplicatedStorage.FindFirstChild('Changelogs') as StringValue).Value = response.Body;
			
			break;
		} else {
			task.wait(10);
		}
	}
}