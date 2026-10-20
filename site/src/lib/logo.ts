/**
 * The "Duo" logo on an 8 × 8 grid: a large square top-right in the accent
 * colour and a small one bottom-left, joined by a corner.
 */
export const LOGO = {
	size: 8,
	accent: { x: 3, y: 0, size: 5 },
	ink: { x: 0, y: 5, size: 3 },
} as const;

/** Standalone SVG of the logo (used for the favicon), on a square background. */
export function logoSvg(ink: string, paper: string, accent: string): string {
	const { accent: a, ink: i } = LOGO;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 10 10" shape-rendering="crispEdges">` +
		`<rect x="-1" y="-1" width="10" height="10" fill="${ink}"/>` +
		`<rect x="${a.x}" y="${a.y}" width="${a.size}" height="${a.size}" fill="${accent}"/>` +
		`<rect x="${i.x}" y="${i.y}" width="${i.size}" height="${i.size}" fill="${paper}"/>` +
		`</svg>`
	);
}
