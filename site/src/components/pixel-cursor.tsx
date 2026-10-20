import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * A square cursor that trails the pointer and turns into a label
 * ("Ouvrir", "Copier"…) over elements carrying `data-cursor`.
 * Only enabled on devices with a precise pointer.
 */
export default function PixelCursor() {
	const dotRef = useRef<HTMLDivElement>(null);
	const [enabled, setEnabled] = useState(false);
	const [label, setLabel] = useState<string | null>(null);
	const [pressed, setPressed] = useState(false);

	useEffect(() => {
		const query = window.matchMedia('(hover: hover) and (pointer: fine)');
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (!query.matches || reduced) return;
		setEnabled(true);
		document.documentElement.classList.add('has-pixel-cursor');

		let x = -100;
		let y = -100;
		let tx = x;
		let ty = y;
		let frame = 0;

		const onMove = (event: PointerEvent) => {
			tx = event.clientX;
			ty = event.clientY;
			const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-cursor]');
			setLabel(target?.dataset.cursor || null);
		};
		const onDown = () => setPressed(true);
		const onUp = () => setPressed(false);
		const onLeave = () => {
			tx = -100;
			ty = -100;
		};

		const tick = () => {
			x += (tx - x) * 0.25;
			y += (ty - y) * 0.25;
			// Snap to a 2px grid for a slightly "pixel" motion
			if (dotRef.current) {
				dotRef.current.style.transform = `translate3d(${Math.round(x / 2) * 2}px, ${Math.round(y / 2) * 2}px, 0)`;
			}
			frame = requestAnimationFrame(tick);
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('pointerdown', onDown);
		window.addEventListener('pointerup', onUp);
		document.addEventListener('pointerleave', onLeave);
		frame = requestAnimationFrame(tick);

		return () => {
			document.documentElement.classList.remove('has-pixel-cursor');
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointerup', onUp);
			document.removeEventListener('pointerleave', onLeave);
			cancelAnimationFrame(frame);
		};
	}, []);

	if (!enabled) return null;

	return (
		<div
			ref={dotRef}
			aria-hidden="true"
			className="pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
		>
			<div
				className={cn(
					'-translate-x-1/2 -translate-y-1/2 bg-paper text-ink transition-[width,height,padding] duration-150 [transition-timing-function:steps(3)]',
					label
						? 'whitespace-nowrap px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.2em]'
						: pressed
							? 'h-2 w-2'
							: 'h-3 w-3'
				)}
			>
				{label}
			</div>
		</div>
	);
}
