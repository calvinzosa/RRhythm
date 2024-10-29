/**
 * Adds commas to numbers every 3 digits
 * @param number The number to format
 * @returns Formatted number
 */
export function formatNumber(number: number, rounded=false): string {
	const [wholeNumber, decimal] = math.modf(number);
	const formatted = number >= 0 ? tostring(wholeNumber).reverse().gsub('(%d%d%d)', '%1,')[0].reverse().gsub('^,', '')[0] : `-${formatNumber(wholeNumber * -1)}`;
	
	return formatted + (rounded ? `.${math.abs(decimal) > 0 ? string.sub(tostring(decimal), 3) : 0}` : '');
}

/**
 * Returns a random float between `min` and `max`
 * @param min The mininum limit
 * @param max The maximum limit
 * @returns Random float between `min` and `max`
 */
export function randomFloat(min: number, max: number) {
	return math.random() * (max - min) + min;
}

/**
 * Calls `:Destroy()` on an instance after a given amount of seconds
 * @param instance The instance or array of instances to destroy
 * @param seconds How long to wait until `:Destroy()` is called
 * @returns `void`
 */
export async function destroyAfter(instance: Instance | Instance[], seconds: number) {
	return new Promise<void>((resolve) => {
		task.delay(seconds, () => {
			if (typeIs(instance, 'Instance')) instance.Destroy();
			else for (const otherInstance of instance) otherInstance.Destroy();
			
			resolve();
		});
	});
}