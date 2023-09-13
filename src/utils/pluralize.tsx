export function pluralize(length: number, singular: string, _plural?: string) {
	const plural = _plural ?? `${singular}s`;
	const x = length === 1 ? singular : plural;
	return `${length} ${x}`;
}

export function plural(length: number, singular: string, _plural?: string) {
	const plural = _plural ?? `${singular}s`;
	const x = length === 1 ? singular : plural;
	return `${x}`;
}
