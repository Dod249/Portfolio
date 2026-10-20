import type { ReactNode } from 'react';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

/** Fades content in with a stepped, pixel-like motion when it enters the view. */
export default function Reveal({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const [ref, inView] = useInView<HTMLDivElement>(0.15);
	return (
		<div
			ref={ref}
			className={cn(
				'transition-[opacity,transform] duration-[400ms] [transition-timing-function:steps(5,end)] motion-reduce:transition-none',
				inView ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0',
				className
			)}
			style={{ transitionDelay: `${delay * 0.5}ms` }}
		>
			{children}
		</div>
	);
}
