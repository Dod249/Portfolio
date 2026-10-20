import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface PixelImageProps {
	src: string;
	alt: string;
	className?: string;
	style?: CSSProperties;
	imgClassName?: string;
	/** Horizontal cell counts, from blockiest to finest, before the real image. */
	steps?: number[];
	stepDuration?: number;
	/** Change this value to replay a quick pixel glitch (e.g. on hover). */
	replay?: number;
	/** Start as soon as the image is loaded instead of waiting to be in view. */
	immediate?: boolean;
}

const DEFAULT_STEPS = [6, 16, 48];
const REPLAY_STEPS = [8, 16, 32, 64];

/**
 * An image that resolves from large pixel blocks into full resolution
 * when it scrolls into view.
 */
export default function PixelImage({
	src,
	alt,
	className,
	style,
	imgClassName,
	steps = DEFAULT_STEPS,
	stepDuration = 75,
	replay = 0,
	immediate = false,
}: PixelImageProps) {
	const wrapperRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const playRef = useRef<((sequence: number[], delay: number) => void) | null>(null);
	const firstDone = useRef(false);
	const [revealed, setRevealed] = useState(false);

	useEffect(() => {
		const wrapper = wrapperRef.current;
		const img = imgRef.current;
		const canvas = canvasRef.current;
		if (!wrapper || !img || !canvas) return;

		firstDone.current = false;
		setRevealed(false);

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setRevealed(true);
			firstDone.current = true;
			return;
		}

		const ctx = canvas.getContext('2d');
		const buffer = document.createElement('canvas');
		const bufferCtx = buffer.getContext('2d');
		if (!ctx || !bufferCtx) {
			setRevealed(true);
			return;
		}

		let timer = 0;
		const loaded = () => img.complete && img.naturalWidth > 0;

		// Draw the image "object-fit: cover" at `cells` horizontal resolution
		const drawStep = (cells: number) => {
			const { width, height } = wrapper.getBoundingClientRect();
			if (!width || !height || !loaded()) return;
			canvas.width = Math.max(1, Math.round(width));
			canvas.height = Math.max(1, Math.round(height));

			const cols = cells;
			const rows = Math.max(1, Math.round((cells * height) / width));
			buffer.width = cols;
			buffer.height = rows;

			const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
			const sw = width / scale;
			const sh = height / scale;
			const sx = (img.naturalWidth - sw) / 2;
			const sy = (img.naturalHeight - sh) / 2;

			bufferCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(buffer, 0, 0, cols, rows, 0, 0, canvas.width, canvas.height);
		};

		const play = (sequence: number[], delay: number) => {
			window.clearTimeout(timer);
			if (!loaded()) return;
			setRevealed(false);
			let i = 0;
			const tick = () => {
				if (i >= sequence.length) {
					firstDone.current = true;
					setRevealed(true);
					return;
				}
				drawStep(sequence[i]);
				i++;
				timer = window.setTimeout(tick, delay);
			};
			tick();
		};
		playRef.current = play;

		let inView = immediate;
		const start = () => {
			if (inView && loaded() && !firstDone.current) play(steps, stepDuration);
		};
		const onLoad = () => {
			drawStep(steps[0] ?? 4);
			start();
		};

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry?.isIntersecting) return;
				observer.disconnect();
				inView = true;
				start();
			},
			{ threshold: 0.25 }
		);

		if (loaded()) onLoad();
		else img.addEventListener('load', onLoad, { once: true });
		if (!immediate) observer.observe(wrapper);

		return () => {
			observer.disconnect();
			window.clearTimeout(timer);
			img.removeEventListener('load', onLoad);
			playRef.current = null;
		};
	}, [src, steps, stepDuration, immediate]);

	// Quick glitch replay, only once the first reveal is over
	useEffect(() => {
		if (replay > 0 && firstDone.current) playRef.current?.(REPLAY_STEPS, 95);
	}, [replay]);

	return (
		<div ref={wrapperRef} style={style} className={cn('relative overflow-hidden bg-line', className)}>
			<img
				ref={imgRef}
				src={src}
				alt={alt}
				crossOrigin="anonymous"
				className={cn(
					'absolute inset-0 h-full w-full object-cover',
					revealed ? 'opacity-100' : 'opacity-0',
					imgClassName
				)}
			/>
			<canvas
				ref={canvasRef}
				aria-hidden="true"
				className={cn('absolute inset-0 h-full w-full', revealed && 'invisible')}
			/>
		</div>
	);
}
