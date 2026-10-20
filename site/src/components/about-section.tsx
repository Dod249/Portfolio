import DecodeText from '@/components/ui/decode-text';
import PixelButton from '@/components/ui/pixel-button';
import PixelEdgeImage from '@/components/ui/pixel-edge-image';
import Reveal from '@/components/ui/reveal';
import { media } from '@/data/media';
import { COPY } from '@/data/site';
import { scrollToSection } from '@/lib/scroll';

export default function AboutSection() {
	return (
		<section id="apropos" className="relative z-10 scroll-mt-20 border-t border-line bg-stage">
			<div className="mx-auto grid max-w-[1400px] items-center gap-14 px-5 py-24 md:px-10 md:py-36 lg:grid-cols-12 lg:gap-12">
				{/* Portrait melting into the page through black pixels */}
				<div className="lg:col-span-5">
					<PixelEdgeImage
						src={media.about.src}
						alt={media.about.alt || COPY.about.title.join(' ')}
						protect={COPY.about.face}
						fullReveal
						color
						className="aspect-[4/5] w-full rounded-lg"
					/>
				</div>

				<div className="lg:col-span-6 lg:col-start-7">
					<DecodeText as="p" text={COPY.about.label} className="text-[11px] uppercase tracking-[0.25em] text-label" />
					<h2 className="mt-5 font-pixel text-[clamp(2.5rem,8vw,5rem)] uppercase leading-[0.9] tracking-tight lg:text-[clamp(2.5rem,4.8vw,5rem)]">
						{COPY.about.title.map((line, i) => (
							<DecodeText key={line} text={line} className="block" delay={i * 150} duration={1100} />
						))}
					</h2>

					<Reveal>
						<p className="mt-10 max-w-lg text-base leading-relaxed text-paper/80 md:text-lg">
							{COPY.about.text}
						</p>
					</Reveal>

					<Reveal delay={150} className="mt-10">
						<PixelButton onClick={() => scrollToSection('contact')} cursor="Écrire">
							{COPY.about.cta} <span aria-hidden="true">↗</span>
						</PixelButton>
					</Reveal>
				</div>
			</div>
		</section>
	);
}
