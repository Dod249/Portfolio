#!/usr/bin/env node
/**
 * Turns the photos dropped in images/ into the site's media.
 *
 *   images/Hero/          12 photos — the 3D gallery of the hero (10 minimum)
 *   (images/ sits in the project root, or next to it when the code is in site/)
 *   images/A-propos/      1 portrait — the "À propos" section
 *   images/Avis-clients/  1 photo per testimonial, in order (01, 02, 03…)
 *
 *   node scripts/prepare-images.mjs           build public/media + src/data/media.json
 *   node scripts/prepare-images.mjs --check   only report how many photos are missing
 *
 * Files are taken in alphabetical order (name them 01-…, 02-… to choose the order),
 * resized to 2000 px max with macOS `sips` when available, and saved as JPEG.
 * Exit codes: 0 ok · 2 photos missing (nothing written).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const outDir = path.join(root, 'public/media');
const outFile = path.join(root, 'src/data/media.json');
// Photos live in images/ next to the code, or one level up when the code sits in site/
const imagesRoot = fs.existsSync(path.join(root, 'images')) ? path.join(root, 'images') : path.join(root, '..', 'images');
const IMAGE = /\.(jpe?g|png|webp|heic|tiff?)$/i;

// How many testimonials the site has (one photo each)
const siteTs = fs.readFileSync(path.join(root, 'src/data/site.ts'), 'utf8');
const testimonialsBlock = siteTs.slice(siteTs.indexOf('export const TESTIMONIALS'));
const testimonialCount = (testimonialsBlock.slice(0, testimonialsBlock.indexOf('];')).match(/quote:/g) || []).length || 3;

const SLOTS = [
	{ folder: 'Hero', key: 'hero', need: 30, min: 10 },
	{ folder: 'A-propos', key: 'about', need: 1, min: 1 },
	{ folder: 'Avis-clients', key: 'testimonials', need: testimonialCount, min: testimonialCount },
];

const list = (folder) => {
	const dir = path.join(imagesRoot, folder);
	fs.mkdirSync(dir, { recursive: true });
	return fs
		.readdirSync(dir)
		.filter((f) => IMAGE.test(f) && !f.startsWith('.'))
		.sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }))
		.map((f) => path.join(dir, f));
};

const altFrom = (file) =>
	path
		.basename(file, path.extname(file))
		.replace(/^\d+[-_ ]*/, '')
		.replace(/[-_]+/g, ' ')
		.replace(/\b(unsplash|img|dsc|dscf)\b.*$/i, '')
		.trim();

const missing = {};
for (const slot of SLOTS) {
	const have = list(slot.folder).length;
	if (have < slot.min) missing[slot.folder] = slot.need - have;
}

if (process.argv.includes('--check')) {
	console.log(JSON.stringify({ missing, counts: Object.fromEntries(SLOTS.map((s) => [s.folder, list(s.folder).length])) }));
	process.exit(0);
}
if (Object.keys(missing).length) {
	console.error(`Photos manquantes : ${JSON.stringify(missing)}`);
	process.exit(2);
}

let sips = true;
try {
	execFileSync('sips', ['--help'], { stdio: 'ignore' });
} catch {
	sips = false;
}

fs.rmSync(outDir, { recursive: true, force: true });
const media = {};
for (const slot of SLOTS) {
	const dir = path.join(outDir, slot.key);
	fs.mkdirSync(dir, { recursive: true });
	const files = list(slot.folder).slice(0, slot.need);
	media[slot.key] = files.map((file, i) => {
		const name = `${String(i + 1).padStart(2, '0')}.jpg`;
		const dest = path.join(dir, name);
		if (sips) {
			execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '-Z', '2000', file, '--out', dest], { stdio: 'ignore' });
		} else {
			fs.copyFileSync(file, dest);
		}
		return { src: `/media/${slot.key}/${name}`, alt: altFrom(file) };
	});
}
media.about = media.about[0];

fs.writeFileSync(outFile, JSON.stringify(media, null, '\t') + '\n');
console.log(JSON.stringify({ hero: media.hero.length, about: 1, testimonials: media.testimonials.length, resized: sips }));
