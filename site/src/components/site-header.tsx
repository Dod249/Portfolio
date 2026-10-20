import { useEffect, useState, type MouseEvent } from 'react';
import DecodeText from '@/components/ui/decode-text';
import PixelCurtain from '@/components/ui/pixel-curtain';
import { COPY, NAV, SITE } from '@/data/site';
import { scrollToSection } from '@/lib/scroll';
import { cn } from '@/lib/utils';

/** The section currently under the upper third of the viewport. */
function useActiveSection() {
	const [active, setActive] = useState<string | null>(null);
	useEffect(() => {
		let frame = 0;
		const update = () => {
			frame = 0;
			const line = window.innerHeight * 0.35;
			let current: string | null = null;
			for (const { id } of NAV) {
				const el = document.getElementById(id);
				if (el && el.getBoundingClientRect().top <= line) current = id;
			}
			// The last section is short: count it once the bottom is reached
			if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = 'contact';
			setActive(current);
		};
		const onScroll = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(frame);
		};
	}, []);
	return active;
}

export default function SiteHeader() {
	const active = useActiveSection();
	const [menuOpen, setMenuOpen] = useState(false);

	const goTo = (id: string) => (event: MouseEvent) => {
		event.preventDefault();
		setMenuOpen(false);
		scrollToSection(id);
	};

	useEffect(() => {
		if (!menuOpen) return;
		const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
		document.documentElement.classList.add('overflow-hidden');
		window.addEventListener('keydown', onKey);
		return () => {
			document.documentElement.classList.remove('overflow-hidden');
			window.removeEventListener('keydown', onKey);
		};
	}, [menuOpen]);

	return (
		<>
			<header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink/70 backdrop-blur-md">
				<div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-5 md:h-20 md:px-10">
					<a
						href="#top"
						onClick={goTo('top')}
						className="flex min-w-0 items-center gap-2 whitespace-nowrap sm:gap-2.5 font-pixel text-[13px] uppercase tracking-[0.08em] min-[380px]:text-sm min-[380px]:tracking-[0.12em] sm:text-base sm:tracking-[0.18em] md:text-lg"
					>
						<span className="min-w-0 truncate">
							<DecodeText text={SITE.name} duration={900} />
						</span>
					</a>

					<nav aria-label="Navigation principale" className="hidden xl:block">
						<ul className="flex items-center gap-9 text-[11px] uppercase tracking-[0.18em]">
							{NAV.map((item, i) => (
								<li key={item.id}>
									<a
										href={`#${item.id}`}
										onClick={goTo(item.id)}
										aria-current={active === item.id ? 'location' : undefined}
										className={cn(
											'relative whitespace-nowrap py-2 transition-colors hover:text-paper',
											active === item.id
												? 'text-paper after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-accent'
												: 'text-stone'
										)}
									>
										<DecodeText text={item.label} delay={150 + i * 90} duration={700} />
									</a>
								</li>
							))}
						</ul>
					</nav>

					<div className="flex shrink-0 items-center gap-2">
						<a
							href="#contact"
							onClick={goTo('contact')}
							className="flex items-center gap-3 whitespace-nowrap h-[38px] bg-paper px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] min-[380px]:px-3 min-[380px]:tracking-[0.16em] text-ink sm:px-4 sm:tracking-[0.2em] transition-colors hover:bg-paper/85 md:h-auto md:px-6 md:py-3 md:text-[11px]"
						>
							<span className="sm:hidden">{COPY.header.ctaShort}</span>
							<span className="hidden sm:inline">{COPY.header.cta}</span>
							<span aria-hidden="true" className="hidden sm:inline">↗</span>
						</a>
						<button
							type="button"
							onClick={() => setMenuOpen((o) => !o)}
							aria-expanded={menuOpen}
							aria-controls="mobile-menu"
							aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
							className="grid h-[38px] w-[38px] shrink-0 cursor-pointer place-items-center border border-line xl:hidden"
						>
							<span aria-hidden="true" className="flex w-4 flex-col gap-[4px]">
								<span className={cn('h-[2px] bg-paper transition-transform', menuOpen && 'translate-y-[6px] rotate-45')} />
								<span className={cn('h-[2px] bg-paper', menuOpen && 'opacity-0')} />
								<span className={cn('h-[2px] bg-paper transition-transform', menuOpen && '-translate-y-[6px] -rotate-45')} />
							</span>
						</button>
					</div>
				</div>
			</header>

			{/* Mobile menu */}
			<div
				id="mobile-menu"
				className={cn('fixed inset-0 z-40 xl:hidden', menuOpen ? 'pointer-events-auto' : 'pointer-events-none')}
				aria-hidden={!menuOpen}
			>
				<PixelCurtain covered={menuOpen} cols={8} rows={14} duration={320} cellClassName="bg-ink" />
				<nav
					aria-label="Navigation mobile"
					className={cn(
						'relative flex h-full flex-col justify-between px-5 pb-10 pt-28 transition-opacity duration-200',
						menuOpen ? 'opacity-100 delay-200' : 'opacity-0'
					)}
				>
					<ul className="space-y-1">
						{NAV.map((item, i) => (
							<li key={item.id}>
								<a
									href={`#${item.id}`}
									onClick={goTo(item.id)}
									tabIndex={menuOpen ? 0 : -1}
									className="flex items-baseline gap-4 border-b border-line py-4 font-pixel text-4xl uppercase"
								>
									<span className="font-mono text-[11px] text-stone">{String(i + 1).padStart(2, '0')}</span>
									{menuOpen ? <DecodeText text={item.label} play delay={200 + i * 70} duration={600} /> : item.label}
								</a>
							</li>
						))}
					</ul>
					<div className="text-[11px] uppercase tracking-[0.2em] text-stone">
						<p>{SITE.email}</p>
						{SITE.phone && <p className="mt-1">{SITE.phone}</p>}
					</div>
				</nav>
			</div>
		</>
	);
}
