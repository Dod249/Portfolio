import { useEffect, useMemo, useState } from 'react';
import { scrollToSection } from '@/lib/scroll';

// The page as an editing timeline: each section is a clip on track V1,
// the playhead follows the scroll and the timecode runs with it.
const CLIPS = [
	{ id: 'top', label: 'Intro' },
	{ id: 'travaux', label: 'Travaux' },
	{ id: 'processus', label: 'Processus' },
	{ id: 'apropos', label: 'À propos' },
	{ id: 'contact', label: 'Contact' },
];
const TOTAL_SECONDS = 3 * 60 + 12; // the "sequence" lasts 03:12
const FPS = 25;
const pad = (n: number) => String(n).padStart(2, '0');

function timecode(ratio: number) {
	const frames = Math.round(ratio * TOTAL_SECONDS * FPS);
	const s = Math.floor(frames / FPS);
	return `00:${pad(Math.floor(s / 60))}:${pad(s % 60)}:${pad(frames % FPS)}`;
}

export default function TimelineBar() {
	const [progress, setProgress] = useState(0);
	const [widths, setWidths] = useState<number[]>(CLIPS.map(() => 1));

	useEffect(() => {
		let frame = 0;
		const measure = () => {
			const tops = CLIPS.map((c) => document.getElementById(c.id)?.getBoundingClientRect().top ?? 0).map(
				(t) => t + window.scrollY
			);
			const end = document.documentElement.scrollHeight;
			setWidths(tops.map((t, i) => Math.max(1, (tops[i + 1] ?? end) - t)));
		};
		const update = () => {
			frame = 0;
			const max = document.documentElement.scrollHeight - window.innerHeight;
			setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		measure();
		update();
		const late = window.setTimeout(measure, 1500);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', measure);
		return () => {
			window.clearTimeout(late);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', measure);
			cancelAnimationFrame(frame);
		};
	}, []);

	// Decorative audio waveform, fixed once
	const wave = useMemo(() => {
		let seed = 7;
		return Array.from({ length: 140 }, () => {
			seed = (seed * 16807) % 2147483647;
			return 0.2 + (seed / 2147483647) * 0.8;
		});
	}, []);

	const total = widths.reduce((a, b) => a + b, 0);
	let acc = 0;
	const active = widths.findIndex((w) => {
		acc += w / total;
		return progress <= acc + 1e-6;
	});

	return (
		<div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 font-mono text-[10px] uppercase tracking-[0.12em] backdrop-blur-md">
			<div className="flex items-center gap-4 px-3 pt-1.5 text-stone md:px-5">
				<span className="tabular-nums text-accent">{timecode(progress)}</span>
				<span className="hidden sm:inline">Séquence — Hugo Dodeur</span>
				<span className="ml-auto tabular-nums">{pad(Math.round(progress * 100))}%</span>
			</div>
			<div className="flex gap-2 px-3 pb-2 pt-1 md:px-5">
				<div className="flex w-5 flex-col gap-[3px] text-stone">
					<span className="flex h-6 items-center">V1</span>
					<span className="hidden h-4 items-center sm:flex">A1</span>
				</div>
				<div className="relative min-w-0 flex-1">
					<div className="flex h-6 gap-[2px]">
						{CLIPS.map((clip, i) => (
							<button
								key={clip.id}
								type="button"
								onClick={() => scrollToSection(clip.id)}
								style={{ flexGrow: widths[i], flexBasis: 0 }}
								className={
									'min-w-0 cursor-pointer truncate rounded-[3px] border px-1.5 text-left transition-colors ' +
									(i === active
										? 'border-accent bg-accent/40 text-paper'
										: 'border-accent/40 bg-accent/15 text-paper/70 hover:bg-accent/30')
								}
							>
								{clip.label}
							</button>
						))}
					</div>
					<div className="mt-[3px] hidden h-4 items-center gap-px overflow-hidden rounded-[3px] bg-[#1d3b2a]/60 px-0.5 sm:flex" aria-hidden="true">
						{wave.map((h, i) => (
							<span key={i} className="w-[2px] flex-1 bg-[#5fd38d]/70" style={{ height: `${h * 100}%` }} />
						))}
					</div>
					{/* Playhead */}
					<span
						aria-hidden="true"
						className="pointer-events-none absolute -top-1.5 bottom-0 w-px bg-[#ff4d4d]"
						style={{ left: `${progress * 100}%` }}
					>
						<span className="absolute -left-[4px] -top-0 h-2 w-[9px] bg-[#ff4d4d] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
					</span>
				</div>
			</div>
		</div>
	);
}
