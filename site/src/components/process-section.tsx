import { useEffect, useRef, useState } from 'react';
import DecodeText from '@/components/ui/decode-text';
import PixelIcon from '@/components/ui/pixel-icon';
import { COPY, PROCESS } from '@/data/site';
import { cn } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');
const SEGMENTS = 48;

function Step({ step, index, lit }: { step: (typeof PROCESS)[number]; index: number; lit: boolean }) {
	const [hover, setHover] = useState(0);
	return (
		<li
			onMouseEnter={() => lit && setHover((h) => h + 1)}
			className={cn(
				'group relative border-t pt-8 transition-[border-color,opacity] duration-700 [transition-timing-function:steps(5)]',
				lit ? 'border-paper opacity-100' : 'border-line opacity-35'
			)}
		>
			<div className="flex items-start justify-between">
				<PixelIcon name={step.icon} on={lit} replay={hover} className={cn('w-14 md:w-16', lit && 'text-accent')} />
				<span className="text-[10px] uppercase tracking-[0.25em] text-stone">{step.duration}</span>
			</div>
			<p className="mt-10 text-[11px] tabular-nums tracking-[0.2em] text-stone">{pad(index + 1)}</p>
			<h3 className="mt-2 font-pixel text-3xl uppercase leading-none md:text-4xl">
				<DecodeText text={step.title} play={lit} duration={1500} />
			</h3>
			<p className="mt-4 max-w-xs text-[13px] leading-relaxed text-paper/70">{step.text}</p>
		</li>
	);
}

export default function ProcessSection() {
	const trackRef = useRef<HTMLDivElement>(null);
	const [progress, setProgress] = useState(0);

	// The bar fills as the section scrolls through the middle of the screen
	useEffect(() => {
		const track = trackRef.current;
		if (!track) return;
		let frame = 0;
		const update = () => {
			frame = 0;
			const rect = track.getBoundingClientRect();
			// Fill over about two thirds of a screen of scrolling
			const start = window.innerHeight * 0.9;
			const end = window.innerHeight * 0.25;
			setProgress(Math.min(1, Math.max(0, (start - rect.top) / (start - end))));
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
			cancelAnimationFrame(frame);
		};
	}, []);

	const filled = Math.round(progress * SEGMENTS);
	// Each step lights up when the bar reaches its column
	const litCount = Math.min(PROCESS.length, Math.floor(progress * PROCESS.length + 1));

	return (
		<section id="processus" className="relative z-10 scroll-mt-20 border-t border-line bg-ink">
			<div className="mx-auto max-w-[1400px] px-5 pb-24 pt-16 md:px-10 md:pb-36 md:pt-20">
				<div className="flex flex-col items-center text-center">
					<DecodeText as="p" text={COPY.process.label} className="text-[11px] uppercase tracking-[0.25em] text-label" />
					<h2 className="mt-5 font-pixel text-[clamp(2.5rem,7vw,6rem)] uppercase leading-[0.9] tracking-tight">
						{COPY.process.title.map((line, i) => (
							<DecodeText key={line} text={line} className="block" delay={i * 150} duration={1200 + i * 100} />
						))}
					</h2>
				</div>

				<div ref={trackRef} className="mt-16 md:mt-24">
					{/* Pixel progress bar */}
					<div className="mb-10 flex items-center gap-4 text-[10px] uppercase tracking-[0.25em] text-stone">
						<span className="tabular-nums">{String(Math.round(progress * 100)).padStart(3, '0')}%</span>
						<div className="flex flex-1 gap-[3px]" aria-hidden="true">
							{Array.from({ length: SEGMENTS }, (_, i) => (
								<span key={i} className={cn('h-2 flex-1', i < filled ? 'bg-accent' : 'bg-line')} />
							))}
						</div>
						<span>{progress >= 1 ? 'Export terminé ✓' : 'Rendu en cours'}</span>
					</div>

					<ol className="grid gap-12 md:grid-cols-3 lg:gap-8">
						{PROCESS.map((step, i) => (
							<Step key={step.title} step={step} index={i} lit={i < litCount} />
						))}
					</ol>
				</div>
			</div>
		</section>
	);
}
