import { useEffect, useState } from 'react';
import { COPY, NAV, SITE } from '@/data/site';
import { scrollToSection } from '@/lib/scroll';

function ParisClock() {
	const [now, setNow] = useState(() => new Date());
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);
	return (
		<span className="tabular-nums">
			{new Intl.DateTimeFormat('fr-FR', {
				timeZone: 'Europe/Paris',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
			}).format(now)}
		</span>
	);
}

export default function SiteFooter() {
	return (
		<footer className="relative z-10 border-t border-line bg-stage">
			<div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-10 px-5 py-16 text-[11px] uppercase tracking-[0.2em] md:grid-cols-4 md:px-10">
				<div className="col-span-2 md:col-span-1">
					<p className="font-pixel text-xl tracking-[0.15em]">
						{SITE.name}
					</p>
					<p className="mt-4 max-w-[16rem] normal-case leading-relaxed tracking-normal text-paper/60">
						{COPY.footer.description}
					</p>
				</div>
				<nav aria-label="Pied de page">
					<p className="text-stone">Navigation</p>
					<ul className="mt-4 space-y-2">
						{NAV.map((item) => (
							<li key={item.id}>
								<button type="button" onClick={() => scrollToSection(item.id)} className="cursor-pointer uppercase hover:opacity-60">
									{item.label}
								</button>
							</li>
						))}
					</ul>
				</nav>
				<div>
					<p className="text-stone">Réseaux</p>
					<ul className="mt-4 space-y-2">
						{SITE.socials.map((social) => (
							<li key={social.label}>
								<a href={social.href} target="_blank" rel="noopener noreferrer" className="hover:opacity-60">
									{social.label} ↗
								</a>
							</li>
						))}
					</ul>
				</div>
				<div>
					<p className="text-stone">Paris</p>
					<p className="mt-4">
						<ParisClock />
					</p>
					<button
						type="button"
						onClick={() => scrollToSection('top')}
						className="mt-6 cursor-pointer uppercase hover:opacity-60"
					>
						Retour en haut ↑
					</button>
				</div>
			</div>

			<div className="mx-auto flex max-w-[1400px] flex-col gap-2 border-t border-line px-5 py-6 text-[10px] uppercase tracking-[0.2em] text-stone sm:flex-row sm:justify-between md:px-10">
				<span>
					© {new Date().getFullYear()} {SITE.name} · <a href="#" className="hover:text-paper">Mentions légales</a>
				</span>
			</div>
		</footer>
	);
}
