const easeInOutQuart = (t: number) =>
	t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;

let current = 0;

/** Eased programmatic scroll (CSS smooth scrolling would fight with it). */
export function animateScrollTo(targetY: number, duration = 1200, onDone?: () => void) {
	cancelAnimationFrame(current);
	const startY = window.scrollY;
	const start = performance.now();

	const step = (now: number) => {
		const t = Math.min(1, (now - start) / duration);
		window.scrollTo(0, startY + (targetY - startY) * easeInOutQuart(t));
		if (t < 1) current = requestAnimationFrame(step);
		else onDone?.();
	};

	current = requestAnimationFrame(step);
}

const HEADER_OFFSET = 80;

/** Scrolls to a section by id (or to the top for `top`). */
export function scrollToSection(id: string) {
	if (id === 'top') return animateScrollTo(0, 1000);
	const el = document.getElementById(id);
	if (!el) return;
	const y = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
	const distance = Math.abs(y - window.scrollY);
	animateScrollTo(y, Math.min(1100, 450 + distance * 0.12));
}
