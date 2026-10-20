import { useState, type ReactNode } from 'react';
import PixelCurtain from '@/components/ui/pixel-curtain';
import { cn } from '@/lib/utils';

interface PixelButtonProps {
	children: ReactNode;
	href?: string;
	onClick?: () => void;
	className?: string;
	cursor?: string;
	type?: 'button' | 'submit';
}

/** A bordered button whose background fills in with random pixel blocks on hover. */
export default function PixelButton({
	children,
	href,
	onClick,
	className,
	cursor,
	type = 'button',
}: PixelButtonProps) {
	const [hover, setHover] = useState(false);
	const filled = className?.includes('bg-paper') ?? false;
	const classes = cn(
		'group relative inline-flex cursor-pointer items-center justify-center gap-3 overflow-hidden border border-paper px-6 py-4 text-[11px] uppercase tracking-[0.2em] outline-none transition-colors duration-200 [transition-timing-function:steps(2)] focus-visible:ring-1 focus-visible:ring-paper focus-visible:ring-offset-4 focus-visible:ring-offset-ink',
		className,
		filled ? (hover ? 'text-paper' : 'text-ink') : hover ? 'text-ink' : 'text-paper'
	);
	const content = (
		<>
			<PixelCurtain
				covered={hover}
				cols={14}
				rows={3}
				duration={260}
				cellClassName={filled ? 'bg-ink' : 'bg-paper'}
			/>
			<span className="relative flex items-center gap-3">{children}</span>
		</>
	);
	const handlers = {
		onMouseEnter: () => setHover(true),
		onMouseLeave: () => setHover(false),
		onFocus: () => setHover(true),
		onBlur: () => setHover(false),
		'data-cursor': cursor,
	};

	return href ? (
		<a href={href} onClick={onClick} className={classes} {...handlers}>
			{content}
		</a>
	) : (
		<button type={type} onClick={onClick} className={classes} {...handlers}>
			{content}
		</button>
	);
}
