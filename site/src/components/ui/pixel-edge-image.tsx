import { useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';

interface PixelEdgeImageProps {
	src: string;
	alt: string;
	className?: string;
	/** Grid size; keep cols/rows equal to the image ratio for square pixels. */
	cols?: number;
	rows?: number;
	seed?: number;
	/** Area kept clear of pixels (e.g. a face), in 0–1 image coordinates. */
	protect?: { x0: number; y0: number; x1: number; y1: number };
	/** Every pixel clears on reveal, showing the whole photo. */
	fullReveal?: boolean;
	/** Keep the photo in colour instead of black & white. */
	color?: boolean;
}

const seeded = (seed: number) => () => {
	seed = (seed * 16807) % 2147483647;
	return (seed - 1) / 2147483646;
};

// 0 = black, 1 = photo shows through, 2 = stray white pixel
type Cell = 0 | 1 | 2;

const REVEAL_MS = 700;

/**
 * A photo whose edges are eaten away by big stair-stepped pixels — unevenly,
 * so the image feels cut out of the page rather than framed. An optional
 * protected area (a face) always stays clear. The pixels open up when it
 * scrolls into view.
 */
export default function PixelEdgeImage({
	src,
	alt,
	className,
	cols = 12,
	rows = 15,
	seed = 9,
	protect,
	fullReveal = false,
	color = false,
}: PixelEdgeImageProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);

	const cells = useMemo(() => {
		const random = seeded(seed);
		const between = (a: number, b: number) => a + Math.floor(random() * (b - a + 1));
		const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

		// How many cells each edge eats, row by row / column by column.
		// Uneven on purpose: deep on the left (top-heavy), light on the right
		// (bottom-heavy), top bitten on the left, bottom bitten on the right.
		const left = Array.from({ length: rows }, (_, y) => clamp(Math.round(3.5 - (2.4 * y) / rows) + between(-1, 1), 1, 5));
		const right = Array.from({ length: rows }, (_, y) => clamp(Math.round(0.8 + (1.9 * y) / rows) + between(-1, 1), 0, 4));
		const top = Array.from({ length: cols }, (_, x) => clamp(Math.round(2.7 - (2.6 * x) / cols) + between(-1, 0), 0, 4));
		const bottom = Array.from({ length: cols }, (_, x) => clamp(Math.round(0.2 + (2.4 * x) / cols) + between(-1, 0), 0, 4));

		const base: Cell[] = Array.from({ length: cols * rows }, (_, i) => {
			const x = i % cols;
			const y = Math.floor(i / cols);
			return x < left[y] || x >= cols - right[y] || y < top[x] || y >= rows - bottom[x] ? 0 : 1;
		});
		const at = (x: number, y: number) => (x < 0 || y < 0 || x >= cols || y >= rows ? 0 : base[y * cols + x]);
		// Distance (in cells, max 2) from a black cell to the nearest photo cell
		const reach = (x: number, y: number) => {
			let best = 9;
			for (let dy = -2; dy <= 2; dy++)
				for (let dx = -2; dx <= 2; dx++)
					if (at(x + dx, y + dy) === 1) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dy)));
			return best;
		};

		return base.map((value, i) => {
			const x = i % cols;
			const y = Math.floor(i / cols);
			let type: Cell = value;

			const near = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)];
			if (value === 1) {
				// Bites along the frontier, and a few holes inside the photo
				if (near.includes(0) && random() < 0.16) type = 0;
				else if (random() < 0.012) type = 0;
			} else {
				// Loose photo / white pixels floating in the black, up to 2 cells out
				const d = reach(x, y);
				const r = random();
				if (d === 1) {
					if (r < 0.2) type = 1;
					else if (r < 0.25) type = 2;
				} else if (d === 2) {
					if (r < 0.05) type = 1;
					else if (r < 0.065) type = 2;
				}
			}

			// Never cover the protected area
			if (
				protect &&
				(x + 1) / cols > protect.x0 &&
				x / cols < protect.x1 &&
				(y + 1) / rows > protect.y0 &&
				y / rows < protect.y1
			)
				type = 1;

			return { x, y, type, delay: random() * REVEAL_MS };
		});
	}, [cols, rows, seed, protect]);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext('2d');
		if (!wrapper || !canvas || !ctx) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const styles = getComputedStyle(document.documentElement);
		const ink = styles.getPropertyValue('--color-ink').trim() || '#0e0e0e';
		const paper = styles.getPropertyValue('--color-paper').trim() || '#f2f2f2';
		let elapsed = 0;
		let start = 0;
		let frame = 0;

		const draw = () => {
			const { width, height } = wrapper.getBoundingClientRect();
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(width * dpr);
			canvas.height = Math.round(height * dpr);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			const cw = canvas.width / cols;
			const ch = canvas.height / rows;
			for (const cell of cells) {
				const revealed = elapsed >= cell.delay;
				if (revealed && (cell.type === 1 || fullReveal)) continue;
				ctx.fillStyle = revealed && cell.type === 2 ? paper : ink;
				// Snap to whole device pixels so neighbouring cells never leave seams
				const x0 = Math.floor(cell.x * cw);
				const y0 = Math.floor(cell.y * ch);
				ctx.fillRect(x0, y0, Math.ceil((cell.x + 1) * cw) - x0, Math.ceil((cell.y + 1) * ch) - y0);
			}
		};

		const tick = (now: number) => {
			if (!start) start = now;
			elapsed = now - start;
			draw();
			if (elapsed < REVEAL_MS) frame = requestAnimationFrame(tick);
		};

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				observer.disconnect();
				if (reduced) {
					elapsed = REVEAL_MS;
					draw();
				} else frame = requestAnimationFrame(tick);
			},
			{ threshold: 0.25 }
		);

		draw();
		observer.observe(wrapper);
		window.addEventListener('resize', draw);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', draw);
		};
	}, [cells, cols, rows, fullReveal]);

	return (
		<div ref={wrapperRef} className={cn('relative overflow-hidden', className)}>
			<img src={src} alt={alt} className={cn('absolute inset-px h-[calc(100%-2px)] w-[calc(100%-2px)] object-cover', !color && 'grayscale')} />
			<canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
		</div>
	);
}
