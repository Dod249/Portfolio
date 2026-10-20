// All the site copy in one place — placeholder content to replace with the
// photographer's real details.

/**
 * Colour theme. `accent: null` = pure black & white. Otherwise the accent
 * colour only touches small details (cursors, squares, progress, active menu).
 * Presets: blue '#2E68FF' (ink '#FFFFFF') · yellow '#FFD60A' (ink '#0E0E0E').
 */
export const THEME: { accent: string | null; accentInk: string } = {
	accent: '#7B61FF',
	accentInk: '#FFFFFF',
};

export const ACCENT_PRESETS = {
	blue: { accent: '#2E68FF', accentInk: '#FFFFFF' },
	yellow: { accent: '#FFD60A', accentInk: '#0E0E0E' },
	none: { accent: null, accentInk: '#0E0E0E' },
} as const;

export const SITE = {
	name: 'Hugo Dodeur',
	city: '',
	email: 'hdodeur@gmail.com',
	/** Optional — leave empty ('') to hide the phone everywhere */
	phone: '',
	socials: [
		{ label: 'YouTube', href: 'https://www.youtube.com/@cin%C3%A9_dod' },
		{ label: 'Instagram', href: 'https://www.instagram.com/cinema_dod/' },
		{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/hugo-dodeur/' },
	],
};

/**
 * Every visible sentence of the site, section by section. Titles are arrays:
 * one entry per line of the big pixel title (keep each line short).
 */
export type ExtraField =
	| { label: string; kind: 'date' }
	| { label: string; kind: 'select'; options: string[] }
	| { label: string; kind: 'text'; placeholder: string };

export const COPY = {
	hero: {
		label: '',
		tagline: 'Podcasts, interviews, motion design. Huit images pour entrer dans la salle de montage.',
	},
	intro: {
		label: '01 — Studio',
		title: ['Monteur vidéo', '& motion design.'],
		text: 'Podcasts vidéo, interviews et films corporate. Un montage rythmé, des habillages animés sur mesure, des vidéos prêtes à publier.',
		primaryCta: 'Démarrer un projet',
		secondaryCta: 'Voir les projets',
	},
	services: { label: 'Services' },
	work: {
		label: '02 — Travaux',
		title: ['Projets', 'récents.'],
		text: 'Podcasts, films d’entreprise, motion design et fiction. Cliquez sur un projet pour découvrir les images.',
	},
	process: {
		label: '03 — Processus',
		title: ['Du brief', 'à la diffusion.'],
	},
	about: {
		label: '04 — À propos',
		title: ['Le rythme', "d'abord."],
		text: "Je suis Hugo Dodeur, monteur vidéo et motion designer. J'ai monté plus d'une centaine de vidéos (podcasts, interviews, tutoriels face caméra) et je donne à chaque marque un rythme et un habillage qui lui ressemblent.",
		cta: 'Travaillons ensemble',
		/** Area of the portrait kept free of pixels (the face), in 0–1 coordinates */
		face: { x0: 0.34, y0: 0.12, x1: 0.7, y1: 0.58 },
	},
	testimonials: {
		label: '05 — Ils en parlent',
		rating: '5/5 · clients accompagnés',
	},
	faq: {
		label: '06 — FAQ',
		title: ['Questions', 'fréquentes.'],
		aside: 'Une autre question ?',
		asideLink: 'Écrivez-moi',
		asideEnd: ', je réponds sous 24 h.',
	},
	contact: {
		label: '07 — Contact',
		title: ['Parlons', 'vidéo.'],
		text: 'Racontez-moi votre projet : je vous réponds sous 24 h avec une proposition et un devis.',
		typeLabel: 'Type de projet',
		sessionTypes: ['Podcast vidéo', 'Film corporate / interview', 'Motion design', 'Formats réseaux sociaux', 'Autre'],
		// 4th field of the form, next to the type: pick what this trade needs to quote.
		// kind 'date' (photographer: date of the shoot), 'select' (budget, deadline…)
		// or 'text' (free answer, with a placeholder)
		extraField: {
			label: 'Échéance',
			kind: 'select',
			options: ['Dès que possible', 'Sous 1 mois', 'Sous 3 mois', 'Pas de date'],
		} as ExtraField,
		messageLabel: 'Votre projet',
		messagePlaceholder: 'Format, durée, nombre d’épisodes, rushs déjà tournés… quelques mots suffisent.',
		responseTime: 'Réponse sous 24 h',
		mailSubject: 'Demande de devis',
	},
	footer: {
		description: 'Monteur vidéo et motion designer : podcasts, interviews et films corporate. Projets partout en France, à distance.',
	},
	header: { cta: 'Démarrer un projet', ctaShort: 'Contact' },
};

export const NAV = [
	{ label: 'Travaux', id: 'travaux' },
	{ label: 'Processus', id: 'processus' },
	{ label: 'À propos', id: 'apropos' },
	{ label: 'Contact', id: 'contact' },
];

export const STATS = [
	{ value: '100+', label: 'Vidéos montées' },
	{ value: '7', label: 'Années d’expérience' },
	{ value: '5/5', label: 'Note moyenne clients' },
];

/** Services scrolling in the band under the intro (short, one or two words each) */
export const SERVICES = [
	'Montage vidéo',
	'Podcast vidéo',
	'Interviews',
	'Films corporate',
	'Motion design',
	'Formats verticaux',
	'Sous-titrage',
	'Étalonnage',
];

export const PROCESS = [
	{
		title: 'Brief',
		text: 'Un appel de 20 minutes pour comprendre votre message, votre audience, vos formats et vos délais.',
		duration: 'J-15',
		icon: 'chat',
	},
	{
		title: 'Préparation',
		text: 'Devis clair, dérushage, structure du montage et charte d’habillage validée ensemble.',
		duration: 'J-10',
		icon: 'pen',
	},
	{
		title: 'Montage',
		text: 'Montage, motion design, sous-titres et étalonnage : une première version livrée rapidement, puis affinée avec vous jusqu’aux exports finaux.',
		duration: 'J-3',
		icon: 'film',
	},
] as const;

export const TESTIMONIALS = [
	{
		quote:
			'Pour notre petite startup, Hugo a créé les animations en motion design de notre site internet. Elles donnent vie à la page et rendent notre offre bien plus claire pour nos visiteurs.',
		author: 'Tom Lemelle',
	},
	{
		quote:
			'Hugo a réalisé nos podcasts et leur intro animée, puis il a tourné et monté notre événement en une semaine seulement. Réactif, rigoureux et toujours dans les temps.',
		author: 'Ourama',
	},
];

export const FAQ = [
	{
		q: 'Quels sont vos délais de montage ?',
		a: 'Une première version sous 72 h pour un épisode de podcast ou une interview, une à deux semaines pour un film corporate avec motion design.',
	},
	{
		q: 'Comment vous envoyer mes rushs ?',
		a: 'Par SwissTransfer : c’est simple, sécurisé et gratuit jusqu’à 50 Go. Pour les très gros volumes, un disque dur envoyé par la poste fonctionne aussi.',
	},
	{
		q: 'Combien de retours sont inclus ?',
		a: 'Deux allers-retours sont inclus dans chaque devis. Les modifications supplémentaires sont chiffrées à l’avance.',
	},
	{
		q: 'Livrez-vous des formats pour les réseaux sociaux ?',
		a: 'Oui : extraits verticaux 9:16, carrés et sous-titrés pour Instagram, TikTok et LinkedIn, en plus du format YouTube.',
	},
];
