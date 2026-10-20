import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PixelCurtainProps {
	/** When true the blocks cover the area, when false they vanish. */
	covered: boolean;
	cols?: number;
	rows?: number;
	/** Total time for every block to flip, in ms. */
	duration?: number;
	className?: string;
	cellClassName?: string;
}

/**
 * A grid of blocks that appear or disappear in random order — the pixel
 * dissolve used for modal openings and button hovers.
 */
export default function PixelCurtain({
	covered,
	cols = 16,
	rows = 10,
	duration = 300,
	className,
	cellClassName = 'bg-paper',
}: PixelCurtainProps) {
	const delays = useMemo(
		() => Array.from({ length: cols * rows }, () => Math.random() * duration),
		[cols, rows, duration]
	);

	return (
		<div
			aria-hidden="true"
			className={cn('pointer-events-none absolute inset-0 grid', className)}
			style={{
				gridTemplateColumns: `repeat(${cols}, 1fr)`,
				gridTemplateRows: `repeat(${rows}, 1fr)`,
			}}
		>
			{delays.map((delay, i) => (
				<span
					key={i}
					className={cn('transition-opacity duration-0', cellClassName)}
					style={{
						opacity: covered ? 1 : 0,
						transitionDelay: `${delay}ms`,
						// Avoid hairline gaps between blocks
						margin: '-0.5px',
					}}
				/>
			))}
		</div>
	);
}
