import { cn } from '@/lib/utils';

interface DecodeTextProps {
	text: string;
	as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'a';
	className?: string;
	/** Controls when the text appears. When omitted, it is shown right away. */
	play?: boolean;
	/** Fades the text out. */
	out?: boolean;
	delay?: number;
	duration?: number;
	/** Kept for compatibility: the text no longer replays an effect. */
	replay?: number;
}

/**
 * Plain text that fades in when `play` turns on and fades out with `out`
 * (no binary decoding).
 */
export default function DecodeText({
	text,
	as: Tag = 'span',
	className,
	play,
	out = false,
	delay = 0,
	duration = 1000,
}: DecodeTextProps) {
	const visible = (play ?? true) && !out;

	return (
		<Tag className={cn('relative', className)}>
			<span
				className="transition-opacity ease-out motion-reduce:transition-none"
				style={{
					opacity: visible ? 1 : 0,
					transitionDuration: `${Math.min(duration, 1000) * 0.5}ms`,
					transitionDelay: visible ? `${delay * 0.5}ms` : '0ms',
				}}
			>
				{text}
			</span>
		</Tag>
	);
}
