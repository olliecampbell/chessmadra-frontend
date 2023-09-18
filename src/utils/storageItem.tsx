import { Setter } from "solid-js";
import { Accessor, createSignal } from "solid-js";
import { Preferences } from "@capacitor/preferences";

export class StorageItem<T> {
	key: string;
	private _value: Accessor<T>;
	private _setValue: Setter<T>;
	private _loaded: boolean;

	constructor(key: string, defaultValue: T) {
		this.key = key;
		const [value, setValue] = createSignal(defaultValue);
		this._value = value;
		this._setValue = setValue;
		this._loaded = false;
		this.load().then((value) => setValue(value));
	}

	async load() {
		if (typeof window === "undefined") {
			return;
		}
		return Preferences.get({ key: this.key }).then(({ value }) => {
			this._loaded = true;
			if (value) {
				this.value = JSON.parse(value);
			} else {
				this.value = null;
			}
			return this.value;
		});
	}

	save() {
		if (this.value === undefined) {
			Preferences.remove({ key: this.key });
		} else {
			Preferences.set({ key: this.key, value: JSON.stringify(this._value()) });
		}
	}

	get value(): T | undefined {
		if (!this._loaded) {
			return undefined;
		}
		return this._value();
	}

	set value(v: T) {
		// @ts-ignore
		this._setValue(v);
		this.save();
	}
}
