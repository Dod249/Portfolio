import mediaData from './media.json';

/**
 * Photos of the hero, the "À propos" portrait and the testimonials.
 * Generated from the images/ folders by scripts/prepare-images.mjs —
 * drop new photos in images/ and run that script instead of editing media.json.
 */
export interface MediaImage {
	src: string;
	alt: string;
}

export const media = mediaData as {
	hero: MediaImage[];
	about: MediaImage;
	testimonials: MediaImage[];
};
