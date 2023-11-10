export function isMouseEvent(evt: MouseEvent | TouchEvent): evt is MouseEvent {
	return !!(evt as MouseEvent).button;
}
export function isLeftClick(evt: MouseEvent) {
	return evt.button === 0;
}
