/**
 * Recursively calls `table.freeze` on a table and its' sub-tables
 * @param tableObject The table to deep freeze recursively
 * @returns `void`
 */
export function deepFreeze(tableObject: any): void {
	table.freeze(tableObject);
	for (const [, value] of tableObject as Map<any, any>) if (typeIs(value, 'table')) deepFreeze(value);
}

/**
 * Adds commas to numbers every 3 digits
 * @param number The number to format
 * @returns Formatted number
 */
export function formatNumber(number: number): string {
	return number >= 0 ? tostring(number).reverse().gsub('(%d%d%d)', '%1,')[0].reverse().gsub('^,', '')[0] : `-${formatNumber(number * -1)}`;
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