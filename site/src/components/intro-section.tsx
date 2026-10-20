import DecodeText from '@/components/ui/decode-text';
import PixelButton from '@/components/ui/pixel-button';
import Reveal from '@/components/ui/reveal';
import { COPY, STATS } from '@/data/site';
import { scrollToSection } from '@/lib/scroll';

/** First section after the hero: positioning, the two main actions, key numbers. */
export default function IntroSection({ id }: { id: string }) {
	return (
		<section
			id={id}
			tabIndex={-1}
			className="relative z-10 border-t border-line bg-stage pb-20 text-paper outline-none md:pb-28"
		>
			<div className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-40">
				<div className="flex flex-col items-center text-center">
					<DecodeText as="p" text={COPY.intro.label} className="mb-8 text-[11px] uppercase tracking-[0.25em] text-label" />
					<h2 className="font-pixel text-[clamp(2rem,6vw,5.2rem)] uppercase leading-[0.9] tracking-tight">
						{COPY.intro.title.map((line, i) => (
							<DecodeText key={line} text={line} className="block" delay={i * 200} duration={1200 + i * 100} />
						))}
					</h2>
					<DecodeText
						as="p"
						text={COPY.intro.text}
						delay={400}
						duration={1600}
						className="mt-8 block max-w-xl text-[13px] leading-relaxed text-paper/70 md:text-sm"
					/>

					<Reveal delay={200} className="mt-10 flex flex-col gap-3 sm:flex-row">
						<PixelButton onClick={() => scrollToSection('contact')} className="bg-paper text-ink" cursor="Réserver">
							{COPY.intro.primaryCta} <span aria-hidden="true">↗</span>
						</PixelButton>
						<PixelButton onClick={() => scrollToSection('travaux')} cursor="Voir">
							{COPY.intro.secondaryCta} <span aria-hidden="true">↓</span>
						</PixelButton>
					</Reveal>
				</div>

				<dl className="mt-20 grid grid-cols-1 border-l border-t border-line sm:grid-cols-3 md:mt-28">
					{STATS.map((stat, i) => (
						<div key={stat.label} className="flex flex-col gap-6 border-b border-r border-line p-6 md:p-8">
							<dt className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.25em] text-paper/70">
								<DecodeText text={stat.label} delay={i * 120} />
								<span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
							</dt>
							<dd className="font-pixel text-5xl leading-none md:text-7xl">
								<DecodeText text={stat.value} delay={150 + i * 120} />
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}
