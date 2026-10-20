import { LOGO } from '@/lib/logo';
import { cn } from '@/lib/utils';

/**
 * The "Duo" logo: a large accent square and a small one in the text colour,
 * joined by a corner. White on white when the site has no accent.
 */
export default function PixelLogo({ className }: { className?: string }) {
	const { accent, ink } = LOGO;
	return (
		<svg
			viewBox={`0 0 ${LOGO.size} ${LOGO.size}`}
			shapeRendering="crispEdges"
			aria-hidden="true"
			className={cn('h-5 w-auto shrink-0', className)}
		>
			<rect x={accent.x} y={accent.y} width={accent.size} height={accent.size} className="fill-accent" />
			<rect x={ink.x} y={ink.y} width={ink.size} height={ink.size} fill="currentColor" />
		</svg>
	);
}
