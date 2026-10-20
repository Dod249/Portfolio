import { useEffect, useRef, useState } from 'react';
import DecodeText from '@/components/ui/decode-text';
import PixelImage from '@/components/ui/pixel-image';
import Reveal from '@/components/ui/reveal';
import { imageUrl, projects, type Project } from '@/data/projects';
import { cn } from '@/lib/utils';

const pad = (n: number) => String(n).padStart(2, '0');

/** Table view of the projects, with a preview image trailing the cursor. */
export default function ProjectList({
	items,
	onOpen,
}: {
	items: { project: Project; index: number }[];
	onOpen: (index: number) => void;
}) {
	const [active, setActive] = useState<number | null>(null);
	const previewRef = useRef<HTMLDivElement>(null);

	// The preview trails the cursor with a little inertia
	useEffect(() => {
		const preview = previewRef.current;
		if (!preview) return;

		let x = window.innerWidth / 2;
		let y = window.innerHeight / 2;
		let tx = x;
		let ty = y;
		let frame = 0;

		const onMove = (event: PointerEvent) => {
			tx = event.clientX;
			ty = event.clientY;
		};
		const tick = () => {
			x += (tx - x) * 0.14;
			y += (ty - y) * 0.14;
			const tilt = Math.max(-8, Math.min(8, (tx - x) * 0.08));
			preview.style.transform = `translate3d(${x + 28}px, ${y - 140}px, 0) rotate(${tilt}deg)`;
			frame = requestAnimationFrame(tick);
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		frame = requestAnimationFrame(tick);
		return () => {
			window.removeEventListener('pointermove', onMove);
			cancelAnimationFrame(frame);
		};
	}, []);

	const current = active !== null ? projects[active] : null;

	return (
		<div>
				{/* Column headers */}
				<div className="hidden grid-cols-[4rem_1fr_12rem_5rem_3rem] gap-4 border-b border-line pb-3 text-[10px] uppercase tracking-[0.25em] text-stone md:grid">
					<span>N°</span>
					<span>Projet</span>
					<span>Catégorie</span>
					<span>Année</span>
					<span />
				</div>

				<ul onMouseLeave={() => setActive(null)}>
					{items.map(({ project, index: i }, row) => (
						<li key={project.slug}>
							<Reveal delay={row * 50}>
								<button
									type="button"
									onClick={() => onOpen(i)}
									onMouseEnter={() => setActive(i)}
									onFocus={() => setActive(i)}
									onBlur={() => setActive(null)}
									data-cursor="Ouvrir"
									className={cn(
										'group grid w-full cursor-pointer grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-line py-5 text-left outline-none transition-colors duration-150 [transition-timing-function:steps(2)] md:grid-cols-[4rem_1fr_12rem_5rem_3rem] md:py-6',
										active === i ? 'bg-paper text-ink' : 'text-paper'
									)}
								>
									<span className={cn('pl-2 text-[11px] tabular-nums tracking-[0.2em]', active === i ? 'text-ink' : 'text-stone')}>
										{pad(i + 1)}
									</span>
									<span className="font-pixel text-2xl uppercase leading-none md:text-4xl">
										<DecodeText text={project.title} replay={active === i ? i + 1 : 0} duration={600} />
									</span>
									<span className="hidden text-[11px] uppercase tracking-[0.2em] md:block">{project.category}</span>
									<span className="hidden text-[11px] tabular-nums tracking-[0.2em] md:block">{project.year ?? ''}</span>
									<span
										aria-hidden="true"
										className={cn(
											'justify-self-end pr-2 font-pixel text-xl transition-transform duration-200',
											active === i && 'translate-x-1 -translate-y-1'
										)}
									>
										↗
									</span>
								</button>
							</Reveal>
						</li>
					))}
				</ul>

			{/* Floating preview that follows the cursor (pointer devices only) */}
			<div
				ref={previewRef}
				aria-hidden="true"
				className={cn(
					'pointer-events-none fixed left-0 top-0 z-40 hidden w-56 transition-opacity duration-200 [@media(hover:hover)]:block lg:w-64',
					current ? 'opacity-100' : 'opacity-0'
				)}
			>
				{current && (
					<div className="border border-paper bg-ink p-1">
						<div className="flex items-center justify-between px-1 pb-1 text-[9px] uppercase tracking-[0.2em]">
							<span>{current.slug}.jpg</span>
							<span>{pad((active ?? 0) + 1)}</span>
						</div>
						<PixelImage
							key={current.slug}
							src={imageUrl(current.cover.src, 600)}
							alt=""
							immediate
							steps={[6, 12, 24, 48]}
							stepDuration={60}
							className="aspect-[4/5] w-full"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
