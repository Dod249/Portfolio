import { useMemo, useState } from 'react';
import ProjectList from '@/components/project-list';
import DecodeText from '@/components/ui/decode-text';
import PixelButton from '@/components/ui/pixel-button';
import WorkGrid, { FIRST_PAGE, PAGE } from '@/components/work-grid';
import { projects } from '@/data/projects';
import { COPY } from '@/data/site';
import { cn } from '@/lib/utils';

const ALL = 'Tous';
// Most used categories first; only the first 4 are shown until the visitor asks for more
const CATEGORY_COUNTS = projects.reduce<Record<string, number>>((acc, p) => {
	acc[p.category] = (acc[p.category] ?? 0) + 1;
	return acc;
}, {});
const CATEGORIES = Object.keys(CATEGORY_COUNTS).sort(
	(a, b) => CATEGORY_COUNTS[b] - CATEGORY_COUNTS[a] || a.localeCompare(b, 'fr')
);

type View = 'grille' | 'liste';

export default function WorkSection({ onOpen }: { onOpen: (index: number) => void }) {
	const [filter, setFilter] = useState(ALL);
	const [view, setView] = useState<View>('liste');
	const [limit, setLimit] = useState(FIRST_PAGE);

	const chooseFilter = (category: string) => {
		setFilter(category);
		setLimit(FIRST_PAGE);
	};

	const items = useMemo(
		() =>
			projects
				.map((project, index) => ({ project, index }))
				.filter(({ project }) => filter === ALL || project.category === filter),
		[filter]
	);
	const visible = items.slice(0, limit);
	const remaining = items.length - visible.length;

	return (
		<section id="travaux" className="relative z-10 scroll-mt-20 bg-stage">
			<div className="mx-auto max-w-[1400px] px-5 pb-8 pt-24 md:px-10 md:pb-12 md:pt-36">
				<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
					<div>
						<DecodeText as="p" text={COPY.work.label} className="text-[11px] uppercase tracking-[0.25em] text-label" />
						<h2 className="mt-5 font-pixel text-[clamp(2.2rem,6.4vw,5.6rem)] uppercase leading-[0.88] tracking-tight">
							{COPY.work.title.map((line, i) => (
								<DecodeText key={line} text={line} className="block" delay={i * 150} duration={1100 + i * 100} />
							))}
						</h2>
					</div>
					<DecodeText
						as="p"
						text={COPY.work.text}
						delay={300}
						className="block max-w-xs text-[13px] leading-relaxed text-paper/70"
					/>
				</div>

				{/* Toolbar: category filters + view switch */}
				<div className="mb-12 mt-12 flex flex-col gap-4 border-y border-line py-4 md:mb-16 md:flex-row md:items-center md:justify-between">
					<div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
						{[ALL, ...CATEGORIES].map((category) => {
							const count = category === ALL ? projects.length : CATEGORY_COUNTS[category];
							const active = filter === category;
							return (
								<button
									key={category}
									type="button"
									aria-pressed={active}
									onClick={() => chooseFilter(category)}
									className={cn(
										'cursor-pointer border px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors duration-150 [transition-timing-function:steps(2)]',
										active ? 'border-accent bg-accent text-accent-ink' : 'border-line text-paper/80 hover:border-paper'
									)}
								>
									{category} <span className={active ? 'opacity-60' : 'text-stone'}>{String(count).padStart(2, '0')}</span>
								</button>
							);
						})}
					</div>

					<div role="group" aria-label="Affichage" className="flex shrink-0 self-start border border-line md:self-auto">
						{(['grille', 'liste'] as View[]).map((option) => (
							<button
								key={option}
								type="button"
								aria-pressed={view === option}
								onClick={() => setView(option)}
								className={cn(
									'flex cursor-pointer items-center gap-2 px-3 py-2 text-[11px] uppercase tracking-[0.15em] transition-colors duration-150 [transition-timing-function:steps(2)]',
									view === option ? 'bg-accent text-accent-ink' : 'text-paper/70 hover:text-paper'
								)}
							>
								<span aria-hidden="true" className="grid grid-cols-2 gap-[2px]">
									{option === 'grille'
										? Array.from({ length: 4 }, (_, i) => <span key={i} className="h-1.5 w-1.5 bg-current" />)
										: Array.from({ length: 3 }, (_, i) => <span key={i} className="col-span-2 h-[2px] w-3.5 bg-current" />)}
								</span>
								{option}
							</button>
						))}
					</div>
				</div>

				{/* Re-mount on change so every card replays its pixel reveal */}
				<div key={`${view}-${filter}`}>
					{view === 'grille' ? (
						<WorkGrid items={visible} onOpen={onOpen} />
					) : (
						<ProjectList items={visible} onOpen={onOpen} />
					)}
				</div>

				{/* 9 projects first, then 6 more per click */}
				{remaining > 0 && (
					<div className="mt-14 flex flex-col items-center gap-4 md:mt-20">
						<p className="text-[11px] uppercase tracking-[0.2em] text-stone tabular-nums">
							{String(visible.length).padStart(2, '0')} / {String(items.length).padStart(2, '0')} projets
						</p>
						<PixelButton onClick={() => setLimit((l) => l + PAGE)} cursor="Voir plus">
							Voir plus de projets <span aria-hidden="true">+{Math.min(PAGE, remaining)}</span>
						</PixelButton>
					</div>
				)}
			</div>
		</section>
	);
}
