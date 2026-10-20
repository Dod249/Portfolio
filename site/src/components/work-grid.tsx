import { useEffect, useState } from 'react';
import DecodeText from '@/components/ui/decode-text';
import PixelImage from '@/components/ui/pixel-image';
import Reveal from '@/components/ui/reveal';
import { imageUrl, type Project } from '@/data/projects';
import { cn } from '@/lib/utils';

// Masonry: every photo keeps its own proportions (only extreme panoramas or
// very tall shots are trimmed a little), spread so the columns end level.
/** Cards shown at first, then added per « Voir plus ». */
export const FIRST_PAGE = 9;
export const PAGE = 6;

const MIN_RATIO = 4 / 3; // tallest allowed: vertical shots are cropped to 4:3 so columns end level
const MAX_RATIO = 1.8; // widest allowed
const ratioOf = (p: Project) => {
	const { width, height } = p.cover;
	const r = width && height ? width / height : 4 / 5;
	return Math.min(MAX_RATIO, Math.max(MIN_RATIO, r));
};
// Card height in column widths: the image plus the caption under it
const heightOf = (p: Project) => 1 / ratioOf(p) + 0.4;

/**
 * Spread the cards over the columns so the grid ends level. Cards are placed
 * page by page (9, then 6 per "Voir plus"), so earlier cards never move: within
 * a page, each column gets the same number of cards, the tallest go to the
 * shortest columns, then pairs are swapped while it evens the columns out.
 * In each column, cards keep the artifact's order.
 */
function balance<T extends { project: Project; index: number }>(items: T[], columns: number): T[][] {
	const cols: T[][] = Array.from({ length: columns }, () => []);
	const heights: number[] = new Array(columns).fill(0);
	const pages: T[][] = [];
	for (let start = 0; start < items.length; ) {
		const size = pages.length ? PAGE : FIRST_PAGE;
		pages.push(items.slice(start, start + size));
		start += size;
	}

	for (const page of pages) {
		const cap = Math.ceil(page.length / columns);
		const groups: T[][] = Array.from({ length: columns }, () => []);
		const h = [...heights];
		for (const item of [...page].sort((a, b) => heightOf(b.project) - heightOf(a.project))) {
			const c = h.map((_, i) => i).filter((i) => groups[i].length < cap).sort((a, b) => h[a] - h[b])[0];
			groups[c].push(item);
			h[c] += heightOf(item.project);
		}
		// Swap cards between two columns while the gap between tallest and shortest shrinks
		const spread = () => Math.max(...h) - Math.min(...h);
		for (let improved = true, guard = 0; improved && guard < 50; guard++) {
			improved = false;
			for (let a = 0; a < columns; a++)
				for (let b = a + 1; b < columns; b++)
					for (let i = 0; i < groups[a].length; i++)
						for (let j = 0; j < groups[b].length; j++) {
							const d = heightOf(groups[a][i].project) - heightOf(groups[b][j].project);
							const before = spread();
							h[a] -= d;
							h[b] += d;
							if (spread() < before - 1e-6) {
								[groups[a][i], groups[b][j]] = [groups[b][j], groups[a][i]];
								improved = true;
							} else {
								h[a] += d;
								h[b] -= d;
							}
						}
		}
		groups.forEach((g, c) => {
			cols[c].push(...g.sort((x, y) => x.index - y.index));
			heights[c] = h[c];
		});
	}
	return cols;
}

function useColumns() {
	const count = () => (window.matchMedia('(min-width: 1024px)').matches ? 3 : window.matchMedia('(min-width: 640px)').matches ? 2 : 1);
	const [columns, setColumns] = useState(count);
	useEffect(() => {
		const update = () => setColumns(count());
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return columns;
}

function ProjectCard({
	project,
	index,
	onOpen,
}: {
	project: Project;
	index: number;
	onOpen: () => void;
}) {
	const [hover, setHover] = useState(0);

	return (
		<Reveal className="mb-12 md:mb-16" delay={(index % 3) * 80}>
			<button
				type="button"
				onClick={onOpen}
				onMouseEnter={() => setHover((h) => h + 1)}
				onFocus={() => setHover((h) => h + 1)}
				data-cursor="Ouvrir"
				aria-label={`Ouvrir le projet ${project.title}`}
				className="group block w-full cursor-pointer text-left outline-none"
			>
				<div className="relative overflow-hidden rounded-lg border border-line border-t-[3px] border-t-accent bg-[#1d1d23] p-1.5">
					<PixelImage
						src={imageUrl(project.cover.src, 1200)}
						alt={project.cover.alt}
						className="w-full rounded-lg grayscale transition-[filter] duration-700 group-hover:grayscale-0 group-focus-visible:grayscale-0"
						style={{ aspectRatio: ratioOf(project) }}
						imgClassName="transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]"
					/>

					{/* HUD over the image */}
					<div className="pointer-events-none absolute inset-0 p-3 text-[10px] uppercase tracking-[0.2em] md:p-4">
						<span className="absolute right-3 top-3 bg-accent px-1.5 py-1 text-accent-ink opacity-0 transition-opacity duration-200 [transition-timing-function:steps(3)] group-hover:opacity-100 group-focus-visible:opacity-100 md:right-4 md:top-4">
							Voir ↗
						</span>
						{['left-2 top-2 border-l border-t', 'right-2 top-2 border-r border-t', 'bottom-2 left-2 border-b border-l', 'bottom-2 right-2 border-b border-r'].map((pos) => (
							<span
								key={pos}
								className={cn(
									'absolute h-4 w-4 border-accent opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-visible:opacity-100',
									pos
								)}
							/>
						))}
					</div>
				</div>

				<div className="mt-4 flex items-start justify-between gap-4 border-t border-line pt-4">
					<div>
						<DecodeText
							as="h3"
							text={project.title}
							replay={hover}
							duration={1500}
							className="block font-pixel text-2xl uppercase leading-none md:text-3xl"
						/>
						<p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-stone">
							{project.category}
						</p>
					</div>
					{project.year && (
						<span className="flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-stone">
							<span className="h-1.5 w-1.5 border border-paper/70 transition-colors group-hover:border-accent group-hover:bg-accent" />
							{project.year}
						</span>
					)}
				</div>
			</button>
		</Reveal>
	);
}

/** Masonry gallery of project cards. `index` is the project's position in the full list. */
export default function WorkGrid({
	items,
	onOpen,
}: {
	items: { project: Project; index: number }[];
	onOpen: (index: number) => void;
}) {
	const columns = useColumns();
	return (
		<div className="flex items-start gap-5">
			{balance(items, columns).map((column, c) => (
				<div key={c} className="min-w-0 flex-1">
					{column.map(({ project, index }) => (
						<ProjectCard key={project.slug} project={project} index={index} onOpen={() => onOpen(index)} />
					))}
				</div>
			))}
		</div>
	);
}
