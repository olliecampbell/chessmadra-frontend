export class StorageItem<T> {
  key: string
  private _value: T

  constructor(key: string, defaultValue: T) {
    this.key = key
    this._value = this.load() || defaultValue
    this[key] = 'blah'
  }

  private load() {
    if (typeof window !== 'undefined') {
      let s = localStorage.getItem(this.key)
      if (s) {
        return JSON.parse(s)
      }
    }
    return null
  }

  private save() {
    localStorage.setItem(this.key, JSON.stringify(this._value))
  }

  get value(): T {
    return this._value
  }

  set value(v: T) {
    this._value = v
    this.save()
  }
}
