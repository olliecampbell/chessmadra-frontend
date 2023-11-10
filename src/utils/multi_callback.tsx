// biome-ignore lint: ignore Function type
class MultiCallback<T extends Function = () => void> {
	private callbacks: T[] = [];

	add(callback: T) {
		this.callbacks.push(callback);
	}

	callAndClear() {
		this.call();
		this.clear();
	}

	call() {
		this.callbacks.forEach((cb) => cb());
	}

	clear() {
		this.callbacks = [];
	}
}
