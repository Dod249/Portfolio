import { useEffect, useState } from 'react';
import DecodeText from '@/components/ui/decode-text';
import { COPY, TESTIMONIALS } from '@/data/site';
import { useInView } from '@/hooks/use-in-view';
import { cn } from '@/lib/utils';

const INTERVAL = 8000;
const pad = (n: number) => String(n).padStart(2, '0');

/** A small square arrow button. */
function Arrow({ direction, onClick }: { direction: 'prev' | 'next'; onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={direction === 'prev' ? 'Témoignage précédent' : 'Témoignage suivant'}
			data-cursor={direction === 'prev' ? 'Précédent' : 'Suivant'}
			className="grid h-10 w-10 cursor-pointer place-items-center border border-line font-pixel text-xl leading-none transition-colors duration-150 [transition-timing-function:steps(2)] hover:border-paper hover:bg-paper hover:text-ink"
		>
			{direction === 'prev' ? '←' : '→'}
		</button>
	);
}

/** Client quotes, one at a time: text only, in a compact frame. */
export default function TestimonialsSection() {
	const total = TESTIMONIALS.length;
	const [ref, inView] = useInView<HTMLDivElement>(0.3);
	const [shown, setShown] = useState(0);
	const [paused, setPaused] = useState(false);

	// Autoplay
	useEffect(() => {
		if (paused || !inView) return;
		const id = window.setTimeout(() => setShown((s) => (s + 1) % total), INTERVAL);
		return () => window.clearTimeout(id);
	}, [shown, paused, inView, total]);

	const go = (step: number) => setShown((s) => (s + step + total) % total);
	const item = TESTIMONIALS[shown];

	return (
		<section
			aria-roledescription="carrousel"
			aria-label="Témoignages clients"
			className="relative z-10 border-t border-line bg-stage"
		>
			<div className="mx-auto max-w-[1400px] px-5 py-20 md:px-10 md:py-28">
				<div className="mb-8 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-stone">
					<DecodeText as="p" text={COPY.testimonials.label} className="text-label" />
					<p><span className="text-accent">★★★★★</span> {COPY.testimonials.rating}</p>
				</div>

				<div
					ref={ref}
					onMouseEnter={() => setPaused(true)}
					onMouseLeave={() => setPaused(false)}
					onFocus={() => setPaused(true)}
					onBlur={() => setPaused(false)}
					className="grid gap-8 border-t border-line pt-8 md:grid-cols-12 md:gap-10 md:pt-10"
				>
					<blockquote
						className="text-lg font-light leading-snug md:col-span-8 md:text-2xl"
						aria-live="polite"
					>
						<span aria-hidden="true" className="mr-1 font-pixel text-accent">“</span>
						<DecodeText key={shown} text={item.quote} play={inView} duration={1200} />
					</blockquote>

					<div className="flex flex-col justify-between gap-6 md:col-span-4 md:items-end md:text-right">
						<p className="text-[11px] uppercase leading-relaxed tracking-[0.15em]">
							<DecodeText key={`a-${shown}`} text={item.author} play={inView} delay={300} duration={600} />
							{'role' in item && item.role && (
								<>
									<br />
									<span className="text-stone">{item.role}</span>
								</>
							)}
						</p>
						<div className="flex items-center gap-4">
							<div className="flex gap-1" aria-hidden="true">
								{TESTIMONIALS.map((t, i) => (
									<span key={t.author} className={cn('h-1.5 w-1.5', i === shown ? 'bg-accent' : 'border border-paper/40')} />
								))}
							</div>
							<span className="text-[11px] tabular-nums tracking-[0.15em] text-stone">
								{pad(shown + 1)} / {pad(total)}
							</span>
							<div className="flex gap-2">
								<Arrow direction="prev" onClick={() => go(-1)} />
								<Arrow direction="next" onClick={() => go(1)} />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
