import { Setter } from "solid-js";
import { Accessor, createSignal } from "solid-js";

export class StorageItem<T> {
  key: string;
  private _value: Accessor<T>;
  private _setValue: Setter<T>;

  constructor(key: string, defaultValue: T) {
    this.key = key;
    const [value, setValue] = createSignal((this.load() || defaultValue) as T);
    this._value = value;
    this._setValue = setValue;
  }

  private load() {
    if (typeof window !== "undefined" && window.localStorage) {
      const s = localStorage.getItem(this.key);
      if (s) {
        return JSON.parse(s);
      }
    }
    return null;
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this._value()));
  }

  get value(): T {
    return this._value();
  }

  set value(v: T) {
    // @ts-ignore
    this._setValue(v);
    this.save();
  }
}
