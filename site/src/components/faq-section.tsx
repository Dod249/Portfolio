import { useState } from 'react';
import DecodeText from '@/components/ui/decode-text';
import Reveal from '@/components/ui/reveal';
import { COPY, FAQ } from '@/data/site';
import { scrollToSection } from '@/lib/scroll';
import { cn } from '@/lib/utils';

export default function FaqSection() {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<section id="faq" className="relative z-10 scroll-mt-20 border-t border-line bg-stage">
			<div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-24 md:px-10 md:py-36 lg:grid-cols-12">
				<div className="lg:col-span-6">
					<DecodeText as="p" text={COPY.faq.label} className="text-[11px] uppercase tracking-[0.25em] text-label" />
					<h2 className="mt-5 font-pixel text-[clamp(2.5rem,8vw,5rem)] uppercase leading-[0.9] tracking-tight lg:text-[clamp(2.5rem,4.8vw,5rem)]">
						{COPY.faq.title.map((line, i) => (
							<DecodeText key={line} text={line} className="block" delay={i * 150} duration={1100 + i * 100} />
						))}
					</h2>
					<p className="mt-6 max-w-xs text-[13px] leading-relaxed text-paper/70">
						{COPY.faq.aside}{' '}
						<button
							type="button"
							onClick={() => scrollToSection('contact')}
							className="cursor-pointer underline underline-offset-4 hover:text-paper"
						>
							{COPY.faq.asideLink}
						</button>
						{COPY.faq.asideEnd}
					</p>
				</div>

				<ul className="border-t border-line lg:col-span-6">
					{FAQ.map((item, i) => {
						const isOpen = open === i;
						return (
							<li key={item.q} className="border-b border-line">
								<Reveal delay={i * 60}>
									<h3>
										<button
											type="button"
											aria-expanded={isOpen}
											aria-controls={`faq-${i}`}
											onClick={() => setOpen(isOpen ? null : i)}
											className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left"
										>
											<span className="flex items-baseline gap-4">
												<span className="text-[11px] tabular-nums text-stone">{String(i + 1).padStart(2, '0')}</span>
												<span className="text-base md:text-lg">{item.q}</span>
											</span>
											<span
												aria-hidden="true"
												className={cn(
													'relative grid h-7 w-7 shrink-0 place-items-center border transition-colors duration-150 [transition-timing-function:steps(2)]',
													isOpen ? 'border-accent bg-accent text-accent-ink' : 'border-line group-hover:border-paper'
												)}
											>
												<span className="absolute h-px w-3 bg-current" />
												<span className={cn('absolute h-3 w-px bg-current transition-transform duration-200', isOpen && 'scale-y-0')} />
											</span>
										</button>
									</h3>
									<div
										id={`faq-${i}`}
										className={cn(
											'grid transition-[grid-template-rows] duration-300 [transition-timing-function:steps(6)]',
											isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
										)}
									>
										<div className="overflow-hidden">
											<p className="max-w-2xl pb-6 pl-9 text-[13px] leading-relaxed text-paper/70">{item.a}</p>
										</div>
									</div>
								</Reveal>
							</li>
						);
					})}
				</ul>
			</div>
		</section>
	);
}
