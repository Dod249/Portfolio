import Marquee from '@/components/ui/marquee';
import { COPY, SERVICES } from '@/data/site';

/** Services scrolling by, right after the intro. */
export default function Ticker() {
	return (
		<section aria-label={COPY.services.label} className="relative z-10 flex items-stretch border-y border-line bg-ink">
			<p className="hidden shrink-0 items-center border-r border-line px-6 text-[10px] uppercase leading-relaxed tracking-[0.25em] text-stone md:flex md:px-10">
				<span className="max-w-[9rem]">{COPY.services.label}</span>
			</p>
			<Marquee speed={32} className="min-w-0 flex-1 py-5 md:py-6">
				{SERVICES.map((service) => (
					<span
						key={service}
						className="flex items-center gap-6 pr-6 font-pixel text-2xl uppercase md:gap-10 md:pr-10 md:text-4xl"
					>
						{service}
						<span aria-hidden="true" className="h-2 w-2 bg-accent md:h-2.5 md:w-2.5" />
					</span>
				))}
			</Marquee>
		</section>
	);
}
