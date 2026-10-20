#!/usr/bin/env node
/**
 * Turns the projects stored in the projects artifact into the site's data
 * file. Every file operation of the publish procedure goes through here, so
 * an unattended run only needs permission for this one script.
 *
 *   node scripts/apply-projects.mjs prepare            clear .publish/db and back up projects.json
 *   node scripts/apply-projects.mjs import <file> <id> copy a downloaded image into public/projects/assets
 *   node scripts/apply-projects.mjs restore            put the backed-up projects.json back
 *   node scripts/apply-projects.mjs pack               zip dist/ into .publish/site.zip
 *   node scripts/apply-projects.mjs status             HTTP status of the local dev site
 *   node scripts/apply-projects.mjs now                current time (ISO) — use it for every timestamp
 *   node scripts/apply-projects.mjs <dir>              write src/data/projects.json
 *   node scripts/apply-projects.mjs <dir> --missing    only list the image ids not downloaded yet
 *   node scripts/apply-projects.mjs <dir> --prune      also delete images no project uses any more
 *
 * <dir> holds one JSON file per project document, as saved by
 * `ArtifactData list` with `out_dir` (either the raw document body or
 * `{ id, data, ... }`). The extra info fields come from <dir>/../site/config.json
 * (`{ fields: [{ key, label }] }`). Images live in public/projects/assets/<asset id>.<ext>.
 *
 * Exit codes: 0 ok · 1 bad input · 2 some images still need downloading.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const assetsDir = path.join(root, 'public/projects/assets');
const outFile = path.join(root, 'src/data/projects.json');

const publishDir = path.join(root, '.publish');
const backupFile = path.join(publishDir, 'projects.backup.json');
const [arg, ...flags] = process.argv.slice(2);
// Paths are relative to the project root, whatever folder the command runs from
const dir = arg && !['prepare', 'restore', 'import', 'pack', 'now', 'status', 'build', 'set-domain', 'sizes'].includes(arg) ? path.resolve(root, arg) : arg;

// ---------- Image size (read from the file header, no dependency) ----------
function imageSize(file) {
	try {
		const b = fs.readFileSync(file);
		// PNG
		if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
		// GIF
		if (b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
		// WebP
		if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
			const chunk = b.toString('ascii', 12, 16);
			if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
			if (chunk === 'VP8L') {
				const bits = b.readUInt32LE(21);
				return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
			}
			if (chunk === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
		}
		// JPEG: walk the markers up to the frame header
		if (b[0] === 0xff && b[1] === 0xd8) {
			let i = 2;
			while (i < b.length) {
				if (b[i] !== 0xff) return null;
				const marker = b[i + 1];
				const len = b.readUInt16BE(i + 2);
				if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
					let width = b.readUInt16BE(i + 7), height = b.readUInt16BE(i + 5);
					// EXIF orientation 5-8 = rotated a quarter turn
					const exif = b.indexOf('Exif');
					if (exif > 0 && exif < i) {
						const t = exif + 6, le = b.toString('ascii', t, t + 2) === 'II';
						const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
						const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
						const ifd = t + u32(t + 4);
						for (let k = 0; k < u16(ifd); k++) {
							const e = ifd + 2 + k * 12;
							if (u16(e) === 0x0112 && u16(e + 8) >= 5) [width, height] = [height, width];
						}
					}
					return { width, height };
				}
				i += 2 + len;
			}
		}
	} catch {
		/* unreadable: no size */
	}
	return null;
}

// ---------- Helper commands ----------
if (dir === 'prepare') {
	fs.rmSync(path.join(publishDir, 'db'), { recursive: true, force: true });
	fs.mkdirSync(publishDir, { recursive: true });
	if (fs.existsSync(outFile)) fs.copyFileSync(outFile, backupFile);
	console.log('ready');
	process.exit(0);
}
if (dir === 'restore') {
	if (!fs.existsSync(backupFile)) {
		console.error('No backup to restore');
		process.exit(1);
	}
	fs.copyFileSync(backupFile, outFile);
	console.log('restored');
	process.exit(0);
}
if (dir === 'import') {
	const [file, id] = flags;
	if (!file || !fs.existsSync(file) || !/^[0-9a-f]{32}$/.test(id ?? '')) {
		console.error('Usage: node scripts/apply-projects.mjs import <downloaded-file> <32-char asset id>');
		process.exit(1);
	}
	const ext = (path.extname(file) || '.jpg').toLowerCase();
	if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'].includes(ext)) {
		console.error(`Not an image or a video: ${file}`);
		process.exit(1);
	}
	fs.mkdirSync(assetsDir, { recursive: true });
	fs.copyFileSync(file, path.join(assetsDir, id + ext));
	console.log(`imported ${id}${ext}`);
	process.exit(0);
}
if (dir === 'pack') {
	const { execFileSync } = await import('node:child_process');
	fs.mkdirSync(publishDir, { recursive: true });
	const zip = path.join(publishDir, 'site.zip');
	fs.rmSync(zip, { force: true });
	execFileSync('zip', ['-qr', zip, '.'], { cwd: path.join(root, 'dist') });
	console.log(zip);
	process.exit(0);
}
if (dir === 'now') {
	console.log(new Date().toISOString());
	process.exit(0);
}
if (dir === 'build') {
	// Type-check then build, from the project root (one pre-approved command for scheduled runs)
	const { spawnSync } = await import('node:child_process');
	for (const args of [['tsc', '-b'], ['vite', 'build']]) {
		const r = spawnSync('npx', args, { cwd: root, stdio: 'inherit' });
		if (r.status !== 0) {
			console.error(`build failed: npx ${args.join(' ')}`);
			process.exit(1);
		}
	}
	console.log('build ok');
	process.exit(0);
}
if (dir === 'set-domain') {
	// Save the Hostinger domain found during a publish
	const [domain] = flags;
	if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain ?? '')) {
		console.error('Usage: node scripts/apply-projects.mjs set-domain <domain>');
		process.exit(1);
	}
	const file = path.join(root, 'deploy.config.json');
	const config = JSON.parse(fs.readFileSync(file, 'utf8'));
	config.hostinger = { ...(config.hostinger || {}), domain };
	config.siteUrl = `https://${domain}`;
	fs.writeFileSync(file, JSON.stringify(config, null, '\t') + '\n');
	console.log(`domain ${domain}`);
	process.exit(0);
}
if (dir === 'sizes') {
	// Add the cover sizes to an existing projects.json (the grid keeps each photo's proportions)
	const list = JSON.parse(fs.readFileSync(outFile, 'utf8'));
	for (const p of list) Object.assign(p.cover, imageSize(path.join(root, 'public', p.cover.src)) || {});
	fs.writeFileSync(outFile, JSON.stringify(list, null, '\t') + '\n');
	console.log(`sizes ${list.filter((p) => p.cover.width).length}/${list.length}`);
	process.exit(0);
}
if (dir === 'status') {
	const config = JSON.parse(fs.readFileSync(path.join(root, 'deploy.config.json'), 'utf8'));
	try {
		const res = await fetch(config.localUrl || 'http://localhost:5173', { method: 'HEAD' });
		console.log(res.status);
	} catch {
		console.log('offline');
	}
	process.exit(0);
}

if (!dir || !fs.existsSync(dir)) {
	console.error('Usage: node scripts/apply-projects.mjs <dir-with-project-json> [--missing] [--prune]');
	process.exit(1);
}

// Video page link → { type, src } the site can play, or null when not supported.
// Players: YouTube, Vimeo, Dailymotion, Loom, Streamable, Google Drive.
// A direct link to an .mp4 / .webm file (any host) plays in the site's own <video>.
function videoSource(link) {
	try {
		const u = new URL(String(link).trim());
		if (!/^https?:$/.test(u.protocol)) return null;
		const host = u.hostname.replace(/^www\.|^m\./, '');
		const embed = (src) => ({ type: 'embed', src });
		if (/\.(mp4|webm)$/i.test(u.pathname)) return { type: 'video', src: u.href };
		if (host === 'youtu.be' || host.endsWith('youtube.com')) {
			const id = host === 'youtu.be'
				? u.pathname.slice(1).split('/')[0]
				: u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|embed|live)\/([^/?]+)/)?.[1];
			const list = u.searchParams.get('list');
			// Playlist link without a video: play the whole playlist
			if (!id) return list ? embed(`https://www.youtube-nocookie.com/embed/videoseries?list=${encodeURIComponent(list)}`) : null;
			// Keep the start time of links like …&t=1m30s or …&t=90
			const t = u.searchParams.get('t') || u.searchParams.get('start');
			const m = t?.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/);
			const start = m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0)) : 0;
			return embed(`https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`);
		}
		if (host.endsWith('vimeo.com')) {
			const id = u.pathname.match(/(\d{6,})/)?.[1];
			return id ? embed(`https://player.vimeo.com/video/${id}`) : null;
		}
		if (host.endsWith('dailymotion.com') || host === 'dai.ly') {
			const id = host === 'dai.ly' ? u.pathname.slice(1) : u.pathname.match(/\/video\/([a-z0-9]+)/i)?.[1];
			return id ? embed(`https://www.dailymotion.com/embed/video/${id}`) : null;
		}
		if (host.endsWith('loom.com')) {
			const id = u.pathname.match(/\/(?:share|embed)\/([a-f0-9]+)/i)?.[1];
			return id ? embed(`https://www.loom.com/embed/${id}`) : null;
		}
		if (host.endsWith('streamable.com')) {
			const id = u.pathname.replace(/^\/(?:e\/)?/, '').split('/')[0];
			return id ? embed(`https://streamable.com/e/${id}`) : null;
		}
		if (host === 'drive.google.com') {
			const id = u.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || u.searchParams.get('id');
			return id ? embed(`https://drive.google.com/file/d/${id}/preview`) : null;
		}
	} catch {
		/* not a URL */
	}
	return null;
}

const slugify = (s) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[’']/g, '-')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'projet';

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// ---------- Read documents ----------
const docs = fs
	.readdirSync(dir)
	.filter((f) => f.endsWith('.json'))
	.map((f) => {
		const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
		const data = raw && typeof raw.data === 'object' && raw.data !== null && 'id' in raw ? raw.data : raw;
		return { id: raw.id ?? path.basename(f, '.json'), data };
	});

// ---------- Extra info fields (Lieu, Client…) ----------
const readJson = (file) => {
	if (!fs.existsSync(file)) return null;
	const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
	return raw && typeof raw.data === 'object' && raw.data !== null && 'id' in raw ? raw.data : raw;
};
const config = readJson(path.join(dir, '..', 'site', 'config.json')) || {};
const fields = (Array.isArray(config.fields) ? config.fields : []).filter((f) => f?.key && str(f.label));

// ---------- Images on disk ----------
fs.mkdirSync(assetsDir, { recursive: true });
const onDisk = new Map(
	fs.readdirSync(assetsDir).map((f) => [path.basename(f, path.extname(f)), f])
);

const referenced = new Set();
for (const { data } of docs) {
	for (const img of [data.cover, ...(Array.isArray(data.gallery) ? data.gallery : [])]) {
		if (img?.asset) referenced.add(img.asset);
	}
}
const missing = [...referenced].filter((id) => !onDisk.has(id));

if (flags.includes('--missing')) {
	console.log(JSON.stringify(missing));
	process.exit(0);
}
if (missing.length) {
	console.error(`Images to download first (${missing.length}): ${missing.join(', ')}`);
	process.exit(2);
}

// ---------- Build the site data ----------
const problems = [];
const used = new Set();
const projects = docs
	.filter(({ data }) => data.visible)
	.sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.id.localeCompare(b.id))
	.map(({ id, data }) => {
		const title = str(data.title);
		const missingFields = [
			!title && 'titre',
			!str(data.category) && 'catégorie',
			!data.cover?.asset && 'image mise en avant',
		].filter(Boolean);
		if (missingFields.length) {
			problems.push(`« ${title || id} » ignoré : ${missingFields.join(', ')} manquant(s)`);
			return null;
		}

		let slug = slugify(title);
		for (let n = 2; used.has(slug); n++) slug = `${slugify(title)}-${n}`;
		used.add(slug);

		const image = (img) => ({ src: `/projects/assets/${onDisk.get(img.asset)}`, alt: str(img.alt) });
		// Gallery items can be photos, uploaded videos or video links
		const media = (item) => {
			if (item?.kind === 'embed') {
				const source = videoSource(item.embed);
				return source ? { ...source, alt: str(item.alt) } : null;
			}
			if (!item?.asset) return null;
			return { ...image(item), type: item.kind === 'video' ? 'video' : 'image' };
		};
		const description = Array.isArray(data.description)
			? data.description.map(str).filter(Boolean)
			: str(data.description).split(/\n\s*\n/).map(str).filter(Boolean);

		return {
			slug,
			title,
			category: str(data.category),
			// Optional: only a real 4-digit year is kept
			year: Number.isInteger(Number(data.year)) && Number(data.year) >= 1900 && Number(data.year) <= 2100 ? Number(data.year) : null,
			// Only the fields filled in for this project, in the configured order
			details: fields
				.map((f) => ({ label: str(f.label), value: str(data.info?.[f.key]) }))
				.filter((d) => d.value),
			summary: str(data.summary),
			description,
			cover: { ...image(data.cover), ...(imageSize(path.join(assetsDir, onDisk.get(data.cover.asset))) || {}) },
			gallery: (Array.isArray(data.gallery) ? data.gallery : []).map(media).filter(Boolean),
		};
	})
	.filter(Boolean);

fs.writeFileSync(outFile, JSON.stringify(projects, null, '\t') + '\n');

let pruned = 0;
if (flags.includes('--prune')) {
	for (const [id, file] of onDisk) {
		if (!referenced.has(id)) {
			fs.rmSync(path.join(assetsDir, file));
			pruned++;
		}
	}
}

console.log(
	JSON.stringify({
		published: projects.length,
		hidden: docs.length - projects.length - problems.length,
		skipped: problems,
		pruned,
		output: path.relative(root, outFile),
	})
);
