import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps {
	children: ReactNode;
	/** Base speed in px per second. */
	speed?: number;
	/** Negative values run the other way. */
	direction?: 1 | -1;
	className?: string;
}

/**
 * An endless ticker that speeds up — and flips direction — with the page
 * scroll.
 */
export default function Marquee({ children, speed = 50, direction = 1, className }: MarqueeProps) {
	const trackRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		let offset = 0;
		let boost = 0;
		let heading = direction;
		let lastY = window.scrollY;
		let last = performance.now();
		let frame = 0;

		const onScroll = () => {
			const dy = window.scrollY - lastY;
			lastY = window.scrollY;
			if (dy !== 0) heading = (dy > 0 ? direction : -direction) as 1 | -1;
			// Gentle push from the scroll, capped so it never races
			boost = Math.min(boost + Math.abs(dy) * 0.6, 120);
		};

		const tick = (now: number) => {
			const dt = Math.min((now - last) / 1000, 0.1);
			last = now;
			boost *= Math.exp(-dt * 2.5);
			offset += heading * (speed + boost) * dt;

			// The content is duplicated, so wrap at half the track width
			const half = track.scrollWidth / 2;
			if (half > 0) offset = ((offset % half) + half) % half;
			track.style.transform = `translate3d(${-offset}px, 0, 0)`;
			frame = requestAnimationFrame(tick);
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		frame = requestAnimationFrame(tick);
		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(frame);
		};
	}, [speed, direction]);

	return (
		<div className={cn('overflow-hidden', className)}>
			<div ref={trackRef} className="flex w-max will-change-transform">
				<div className="flex shrink-0 items-center">{children}</div>
				<div className="flex shrink-0 items-center" aria-hidden="true">
					{children}
				</div>
			</div>
		</div>
	);
}
