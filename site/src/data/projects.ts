import projectsData from './projects.json';

export interface ProjectImage {
	/** Site path (/projects/assets/…) or full URL. */
	src: string;
	alt: string;
	/** Gallery only: a photo (default), an uploaded video, or a YouTube / Vimeo player URL */
	type?: 'image' | 'video' | 'embed';
	/** Pixel size of the file (cover only), so the grid keeps its proportions. */
	width?: number;
	height?: number;
}

export interface Project {
	slug: string;
	title: string;
	category: string;
	/** Optional — shown only when filled in. */
	year: number | null;
	/** Extra info (Lieu, Client…) — only the ones filled in, in the configured order. */
	details: { label: string; value: string }[];
	summary: string;
	description: string[];
	cover: ProjectImage;
	gallery: ProjectImage[];
}

/**
 * The projects are edited in the "Projets Atelier Lumen" artifact and
 * written to projects.json by scripts/apply-projects.mjs — don't edit the
 * JSON by hand, publish from the artifact instead.
 */
export const projects = projectsData as Project[];

/** Unsplash images accept a width; local files are served as they are. */
export const imageUrl = (src: string, width = 1400) =>
	src.includes('images.unsplash.com') ? src.replace(/([?&])w=\d+/, `$1w=${width}`) : src;

