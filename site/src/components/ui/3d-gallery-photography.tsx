import type React from 'react';
import {
	Component,
	Suspense,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

type ImageItem = string | { src: string; alt?: string };

interface FadeSettings {
	fadeIn: {
		start: number;
		end: number;
	};
	fadeOut: {
		start: number;
		end: number;
	};
}

interface BlurSettings {
	blurIn: {
		start: number;
		end: number;
	};
	blurOut: {
		start: number;
		end: number;
	};
	maxBlur: number;
}

interface PixelSettings {
	/** Normalized depth where the image is at its blockiest. */
	start: number;
	/** Normalized depth where the image becomes fully sharp. */
	end: number;
	/** Horizontal cell counts, from blockiest to finest. */
	steps: number[];
}

interface ColorReveal {
	/** Normalized depth where the image starts gaining colour. */
	start: number;
	/** Normalized depth where the image is in full colour. */
	end: number;
}

interface InfiniteGalleryProps {
	images: ImageItem[];
	/** Multiplier applied to wheel / touch / keyboard input. */
	speed?: number;
	/** Kept for API compatibility with the original component (unused). */
	zSpacing?: number;
	visibleCount?: number;
	/** Kept for API compatibility with the original component (unused). */
	falloff?: { near: number; far: number };
	fadeSettings?: FadeSettings;
	blurSettings?: BlurSettings;
	/** Images arrive as pixel blocks and resolve as they get closer. */
	pixelSettings?: PixelSettings | null;
	/**
	 * Black & white rendering with film grain and scanlines. Pass a depth range
	 * instead of `true` to have images turn from B&W to colour as they approach.
	 */
	monochrome?: boolean | ColorReveal;
	className?: string;
	style?: React.CSSProperties;
	/** Cruise speed in world units per second when nobody interacts. */
	autoPlaySpeed?: number;
	/**
	 * When > 0, the gallery counts the images that fly past the camera and
	 * calls `onComplete` once this many have been shown.
	 */
	introLength?: number;
	/**
	 * Listen to wheel / touch / keyboard on the whole window (and prevent the
	 * page from scrolling). Turn it off once the intro is over.
	 */
	captureInput?: boolean;
	/**
	 * Without hijacking the page, let its scroll drive the gallery: scrolling
	 * down moves forward, scrolling up (even at the very top) rewinds.
	 */
	scrollLinked?: boolean;
	/** Stops rendering entirely (e.g. when the gallery is off-screen). */
	paused?: boolean;
	onReady?: () => void;
	onProgress?: (shown: number) => void;
	onComplete?: () => void;
}

interface PlaneData {
	index: number;
	z: number;
	imageIndex: number;
	x: number;
	y: number;
}

const DEFAULT_DEPTH_RANGE = 50;
const MAX_HORIZONTAL_OFFSET = 8;
const MAX_VERTICAL_OFFSET = 8;
const MAX_VELOCITY = 40;

const DEFAULT_FADE: FadeSettings = {
	fadeIn: { start: 0.05, end: 0.25 },
	fadeOut: { start: 0.4, end: 0.43 },
};

const DEFAULT_BLUR: BlurSettings = {
	blurIn: { start: 0.0, end: 0.1 },
	blurOut: { start: 0.4, end: 0.43 },
	maxBlur: 8.0,
};

const createClothMaterial = () => {
	return new THREE.ShaderMaterial({
		transparent: true,
		uniforms: {
			map: { value: null },
			opacity: { value: 1.0 },
			blurAmount: { value: 0.0 },
			scrollForce: { value: 0.0 },
			time: { value: 0.0 },
			isHovered: { value: 0.0 },
			pixelCells: { value: 0.0 },
			monochrome: { value: 0.0 },
			grayscale: { value: 0.0 },
		},
		vertexShader: `
      uniform float scrollForce;
      uniform float time;
      uniform float isHovered;
      varying vec2 vUv;
      varying vec3 vNormal;

      void main() {
        vUv = uv;
        vNormal = normal;

        vec3 pos = position;

        // Create smooth curving based on scroll force
        float curveIntensity = scrollForce * 0.3;

        // Base curve across the plane based on distance from center
        float distanceFromCenter = length(pos.xy);
        float curve = distanceFromCenter * distanceFromCenter * curveIntensity;

        // Add gentle cloth-like ripples
        float ripple1 = sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02;
        float ripple2 = sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015;
        float clothEffect = (ripple1 + ripple2) * abs(curveIntensity) * 2.0;

        // Flag waving effect when hovered
        float flagWave = 0.0;
        if (isHovered > 0.5) {
          // Create flag-like wave from left to right
          float wavePhase = pos.x * 3.0 + time * 8.0;
          float waveAmplitude = sin(wavePhase) * 0.1;
          // Damping effect - stronger wave on the right side (free edge)
          float dampening = smoothstep(-0.5, 0.5, pos.x);
          flagWave = waveAmplitude * dampening;

          // Add secondary smaller waves for more realistic flag motion
          float secondaryWave = sin(pos.x * 5.0 + time * 12.0) * 0.03 * dampening;
          flagWave += secondaryWave;
        }

        // Apply Z displacement for curving effect (inverted) with cloth ripples and flag wave
        pos.z -= (curve + clothEffect + flagWave);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
		fragmentShader: `
      uniform sampler2D map;
      uniform float opacity;
      uniform float blurAmount;
      uniform float scrollForce;
      uniform float time;
      uniform float pixelCells;
      uniform float monochrome;
      uniform float grayscale;
      varying vec2 vUv;
      varying vec3 vNormal;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        vec2 uv = vUv;
        vec2 texSize = vec2(textureSize(map, 0));

        // Digital glitch: random rows slip sideways when scrolling fast
        float force = abs(scrollForce);
        if (monochrome > 0.5 && force > 0.35) {
          float band = floor(uv.y * 28.0);
          float n = hash(vec2(band, floor(time * 18.0)));
          if (n > 0.9) {
            uv.x += (hash(vec2(band, time)) - 0.5) * 0.08 * min(force, 2.0);
          }
        }

        // Pixelation: snap the UVs to a grid of square cells
        if (pixelCells > 0.0) {
          vec2 cells = vec2(pixelCells, pixelCells * texSize.y / texSize.x);
          uv = (floor(uv * cells) + 0.5) / cells;
        }

        vec4 color = texture2D(map, uv);

        // Simple blur approximation
        if (blurAmount > 0.0) {
          vec2 texelSize = 1.0 / texSize;
          vec4 blurred = vec4(0.0);
          float total = 0.0;

          for (float x = -2.0; x <= 2.0; x += 1.0) {
            for (float y = -2.0; y <= 2.0; y += 1.0) {
              vec2 offset = vec2(x, y) * texelSize * blurAmount;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              blurred += texture2D(map, uv + offset) * weight;
              total += weight;
            }
          }
          color = blurred / total;
        }

        // Add subtle lighting effect based on curving
        float curveHighlight = abs(scrollForce) * 0.05;
        color.rgb += vec3(curveHighlight * 0.1);

        if (monochrome > 0.5) {
          // High-contrast black & white, blended back to colour as it approaches
          float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
          luma = clamp((luma - 0.5) * 1.15 + 0.5, 0.0, 1.0);
          color.rgb = mix(color.rgb, vec3(luma), grayscale);

          // Scanlines and animated grain
          if (mod(floor(gl_FragCoord.y), 3.0) < 1.0) color.rgb *= 0.9;
          color.rgb += (hash(gl_FragCoord.xy + fract(time) * 97.0) - 0.5) * 0.07;
        }

        gl_FragColor = vec4(color.rgb, color.a * opacity);
        #include <colorspace_fragment>
      }
    `,
	});
};

/** Maps a normalized depth position to an opacity using the fade settings. */
function getOpacity(p: number, fade: FadeSettings) {
	let opacity = 1;
	if (p < fade.fadeIn.start) opacity = 0;
	else if (p <= fade.fadeIn.end)
		opacity = (p - fade.fadeIn.start) / (fade.fadeIn.end - fade.fadeIn.start);
	else if (p > fade.fadeOut.end) opacity = 0;
	else if (p >= fade.fadeOut.start)
		opacity =
			1 - (p - fade.fadeOut.start) / (fade.fadeOut.end - fade.fadeOut.start);
	return Math.max(0, Math.min(1, opacity));
}

/** Maps a normalized depth position to a blur amount using the blur settings. */
function getBlur(p: number, blur: BlurSettings) {
	let amount = 0;
	if (p < blur.blurIn.start) amount = blur.maxBlur;
	else if (p <= blur.blurIn.end)
		amount =
			blur.maxBlur *
			(1 - (p - blur.blurIn.start) / (blur.blurIn.end - blur.blurIn.start));
	else if (p > blur.blurOut.end) amount = blur.maxBlur;
	else if (p >= blur.blurOut.start)
		amount =
			blur.maxBlur *
			((p - blur.blurOut.start) / (blur.blurOut.end - blur.blurOut.start));
	return Math.max(0, Math.min(blur.maxBlur, amount));
}

/** Number of pixel cells across the image at a given depth (0 = sharp). */
function getPixelCells(p: number, pixel: PixelSettings | null) {
	if (!pixel || pixel.steps.length === 0 || p >= pixel.end) return 0;
	const t = Math.max(0, (p - pixel.start) / (pixel.end - pixel.start));
	const step = Math.min(pixel.steps.length - 1, Math.floor(t * pixel.steps.length));
	return pixel.steps[step];
}

/** 1 = fully black & white, 0 = full colour. */
function getGrayscale(p: number, monochrome: boolean | ColorReveal) {
	if (monochrome === false) return 0;
	if (monochrome === true) return 1;
	const t = (p - monochrome.start) / (monochrome.end - monochrome.start);
	const eased = Math.max(0, Math.min(1, t));
	return 1 - eased * eased * (3 - 2 * eased);
}

function getPlaneScale(texture: THREE.Texture): [number, number, number] {
	const image = texture.image as { width: number; height: number } | undefined;
	const aspect = image ? image.width / image.height : 1;
	return aspect > 1 ? [2 * aspect, 2, 1] : [2, 2 / aspect, 1];
}

function ImagePlane({
	meshRef,
	material,
}: {
	meshRef: (mesh: THREE.Mesh | null) => void;
	material: THREE.ShaderMaterial;
}) {
	const [isHovered, setIsHovered] = useState(false);

	useEffect(() => {
		material.uniforms.isHovered.value = isHovered ? 1.0 : 0.0;
	}, [material, isHovered]);

	return (
		<mesh
			ref={meshRef}
			material={material}
			onPointerEnter={() => setIsHovered(true)}
			onPointerLeave={() => setIsHovered(false)}
		>
			<planeGeometry args={[1, 1, 32, 32]} />
		</mesh>
	);
}

type GallerySceneProps = Required<
	Pick<
		InfiniteGalleryProps,
		| 'speed'
		| 'visibleCount'
		| 'fadeSettings'
		| 'blurSettings'
		| 'pixelSettings'
		| 'monochrome'
		| 'autoPlaySpeed'
		| 'introLength'
		| 'captureInput'
		| 'scrollLinked'
	>
> &
	Pick<InfiniteGalleryProps, 'onReady' | 'onProgress' | 'onComplete'> & {
		images: { src: string; alt: string }[];
	};

function GalleryScene({
	images,
	speed,
	visibleCount,
	fadeSettings,
	blurSettings,
	pixelSettings,
	monochrome,
	autoPlaySpeed,
	introLength,
	captureInput,
	scrollLinked,
	onReady,
	onProgress,
	onComplete,
}: GallerySceneProps) {
	// Velocity lives in a ref: updating React state every frame would
	// re-render the whole scene 60 times per second.
	const velocity = useRef(0);
	const shown = useRef(0);
	const reported = useRef(0);
	const completed = useRef(false);
	const meshes = useRef<(THREE.Mesh | null)[]>([]);
	const appliedImage = useRef<number[]>([]);

	// Keep the latest callbacks without re-subscribing anything.
	const callbacks = useRef({ onReady, onProgress, onComplete });
	callbacks.current = { onReady, onProgress, onComplete };

	const textures = useTexture(images.map((img) => img.src));

	useEffect(() => {
		textures.forEach((texture) => {
			texture.colorSpace = THREE.SRGBColorSpace;
			texture.anisotropy = 4;
			texture.needsUpdate = true;
		});
	}, [textures]);

	const materials = useMemo(
		() => Array.from({ length: visibleCount }, () => createClothMaterial()),
		[visibleCount]
	);

	useEffect(
		() => () => materials.forEach((material) => material.dispose()),
		[materials]
	);

	const spatialPositions = useMemo(() => {
		const positions: { x: number; y: number }[] = [];

		for (let i = 0; i < visibleCount; i++) {
			// Golden-angle style distribution so the planes never line up
			const horizontalAngle = (i * 2.618) % (Math.PI * 2);
			const verticalAngle = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);

			const horizontalRadius = (i % 3) * 1.2;
			const verticalRadius = ((i + 1) % 4) * 0.8;

			const x =
				(Math.sin(horizontalAngle) * horizontalRadius * MAX_HORIZONTAL_OFFSET) /
				3;
			const y =
				(Math.cos(verticalAngle) * verticalRadius * MAX_VERTICAL_OFFSET) / 4;

			positions.push({ x, y });
		}

		return positions;
	}, [visibleCount]);

	const totalImages = images.length;
	const depthRange = DEFAULT_DEPTH_RANGE;

	const planesData = useMemo<PlaneData[]>(
		() =>
			Array.from({ length: visibleCount }, (_, i) => ({
				index: i,
				z: ((depthRange / Math.max(visibleCount, 1)) * i) % depthRange,
				imageIndex: totalImages > 0 ? i % totalImages : 0,
				x: spatialPositions[i]?.x ?? 0,
				y: spatialPositions[i]?.y ?? 0,
			})),
		[depthRange, spatialPositions, totalImages, visibleCount]
	);

	useEffect(() => {
		appliedImage.current = [];
		shown.current = 0;
		reported.current = 0;
		completed.current = false;
	}, [planesData]);

	useEffect(() => {
		callbacks.current.onReady?.();
	}, []);

	// Input: only hijack wheel / touch / keys while the intro is running.
	useEffect(() => {
		if (!captureInput) return;

		const push = (amount: number) => {
			velocity.current = THREE.MathUtils.clamp(
				velocity.current + amount * speed,
				-MAX_VELOCITY,
				MAX_VELOCITY
			);
		};

		const handleWheel = (event: WheelEvent) => {
			event.preventDefault();
			push(event.deltaY * 0.05);
		};

		let lastTouchY = 0;
		const handleTouchStart = (event: TouchEvent) => {
			lastTouchY = event.touches[0]?.clientY ?? 0;
		};
		const handleTouchMove = (event: TouchEvent) => {
			event.preventDefault();
			const y = event.touches[0]?.clientY ?? lastTouchY;
			push((lastTouchY - y) * 0.12);
			lastTouchY = y;
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key)) {
				event.preventDefault();
				push(-6);
			} else if (
				['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(event.key)
			) {
				event.preventDefault();
				push(6);
			}
		};

		window.addEventListener('wheel', handleWheel, { passive: false });
		window.addEventListener('touchstart', handleTouchStart, { passive: true });
		window.addEventListener('touchmove', handleTouchMove, { passive: false });
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('wheel', handleWheel);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', handleTouchMove);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [captureInput, speed]);

	// Page scroll drives the gallery once the intro is over
	useEffect(() => {
		if (!scrollLinked || captureInput) return;

		const push = (amount: number) => {
			velocity.current = THREE.MathUtils.clamp(
				velocity.current + amount * speed,
				-MAX_VELOCITY,
				MAX_VELOCITY
			);
		};

		let lastScrollY = window.scrollY;
		const handleScroll = () => {
			const y = window.scrollY;
			// Only while the gallery is still on screen
			if (y < window.innerHeight) push((y - lastScrollY) * 0.03);
			lastScrollY = y;
		};

		// At the top the page cannot scroll up, so read the intent directly
		const handleWheel = (event: WheelEvent) => {
			if (window.scrollY <= 0 && event.deltaY < 0) push(event.deltaY * 0.05);
		};

		let lastTouchY = 0;
		const handleTouchStart = (event: TouchEvent) => {
			lastTouchY = event.touches[0]?.clientY ?? 0;
		};
		const handleTouchMove = (event: TouchEvent) => {
			const y = event.touches[0]?.clientY ?? lastTouchY;
			if (window.scrollY <= 0 && y > lastTouchY) push((lastTouchY - y) * 0.12);
			lastTouchY = y;
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('wheel', handleWheel, { passive: true });
		window.addEventListener('touchstart', handleTouchStart, { passive: true });
		window.addEventListener('touchmove', handleTouchMove, { passive: true });

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('wheel', handleWheel);
			window.removeEventListener('touchstart', handleTouchStart);
			window.removeEventListener('touchmove', handleTouchMove);
		};
	}, [scrollLinked, captureInput, speed]);

	useFrame((state, rawDelta) => {
		// Avoid a huge jump after the tab was in the background
		const delta = Math.min(rawDelta, 0.1);

		// Ease the velocity back towards the cruise speed
		velocity.current +=
			(autoPlaySpeed - velocity.current) * (1 - Math.exp(-delta * 1.6));

		const scrollForce = THREE.MathUtils.clamp(velocity.current / 12, -2.5, 2.5);
		const time = state.clock.getElapsedTime();

		const imageAdvance =
			totalImages > 0 ? visibleCount % totalImages || totalImages : 0;
		const halfRange = depthRange / 2;
		// A plane counts as "shown" once it has fully faded out past the camera
		const passThreshold = fadeSettings.fadeOut.end * depthRange;
		const travel = velocity.current * delta;

		planesData.forEach((plane, i) => {
			const previousZ = plane.z;
			let newZ = previousZ + travel;

			if (previousZ < passThreshold && newZ >= passThreshold) shown.current++;
			else if (previousZ >= passThreshold && newZ < passThreshold)
				shown.current = Math.max(0, shown.current - 1);

			if (newZ >= depthRange) {
				const wraps = Math.floor(newZ / depthRange);
				newZ -= depthRange * wraps;
				if (imageAdvance > 0 && totalImages > 0)
					plane.imageIndex =
						(plane.imageIndex + wraps * imageAdvance) % totalImages;
			} else if (newZ < 0) {
				const wraps = Math.ceil(-newZ / depthRange);
				newZ += depthRange * wraps;
				if (imageAdvance > 0 && totalImages > 0) {
					const step = plane.imageIndex - wraps * imageAdvance;
					plane.imageIndex = ((step % totalImages) + totalImages) % totalImages;
				}
			}

			plane.z = newZ;

			const mesh = meshes.current[i];
			const material = materials[i];
			const texture = textures[plane.imageIndex];
			if (!mesh || !material || !texture) return;

			// Swap the texture only when this plane shows a new image
			if (appliedImage.current[i] !== plane.imageIndex) {
				appliedImage.current[i] = plane.imageIndex;
				material.uniforms.map.value = texture;
				mesh.scale.set(...getPlaneScale(texture));
			}

			const normalizedPosition = plane.z / depthRange;
			const opacity = getOpacity(normalizedPosition, fadeSettings);

			mesh.position.set(plane.x, plane.y, plane.z - halfRange);
			mesh.visible = opacity > 0.001;

			material.uniforms.time.value = time;
			material.uniforms.scrollForce.value = scrollForce;
			material.uniforms.opacity.value = opacity;
			material.uniforms.blurAmount.value = getBlur(
				normalizedPosition,
				blurSettings
			);
			material.uniforms.pixelCells.value = getPixelCells(
				normalizedPosition,
				pixelSettings
			);
			material.uniforms.monochrome.value = monochrome ? 1 : 0;
			material.uniforms.grayscale.value = getGrayscale(
				normalizedPosition,
				monochrome
			);
		});

		if (introLength > 0 && !completed.current) {
			const progress = Math.min(shown.current, introLength);
			if (progress !== reported.current) {
				reported.current = progress;
				callbacks.current.onProgress?.(progress);
			}

			if (progress >= introLength) {
				completed.current = true;
				// A last burst of speed to "warp" into the next section
				velocity.current = MAX_VELOCITY * 0.6;
				callbacks.current.onComplete?.();
			}
		}
	});

	if (images.length === 0) return null;

	return (
		<>
			{planesData.map((plane, i) => (
				<ImagePlane
					key={plane.index}
					material={materials[i]}
					meshRef={(mesh) => {
						meshes.current[i] = mesh;
					}}
				/>
			))}
		</>
	);
}

/** Keeps a texture loading error from taking the whole page down. */
class SceneErrorBoundary extends Component<
	{ children: ReactNode; onError: () => void },
	{ failed: boolean }
> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch() {
		this.props.onError();
	}

	render() {
		return this.state.failed ? null : this.props.children;
	}
}

// Fallback component for when WebGL is not available
function FallbackGallery({
	images,
	monochrome,
}: {
	images: { src: string; alt: string }[];
	monochrome: boolean | ColorReveal;
}) {
	return (
		<div className="flex h-full flex-col items-center justify-center p-4">
			<div className="grid max-h-full grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
				{images.map((img, i) => (
					<img
						key={i}
						src={img.src}
						alt={img.alt}
						className={`h-40 w-full rounded object-cover ${monochrome ? 'grayscale' : ''}`}
					/>
				))}
			</div>
		</div>
	);
}

export default function InfiniteGallery({
	images,
	speed = 1,
	visibleCount = 8,
	className = 'h-96 w-full',
	style,
	fadeSettings = DEFAULT_FADE,
	blurSettings = DEFAULT_BLUR,
	pixelSettings = null,
	monochrome = false,
	autoPlaySpeed = 1,
	introLength = 0,
	captureInput = false,
	scrollLinked = false,
	paused = false,
	onReady,
	onProgress,
	onComplete,
}: InfiniteGalleryProps) {
	const [webglSupported, setWebglSupported] = useState(true);

	const normalizedImages = useMemo(
		() =>
			images.map((img) =>
				typeof img === 'string' ? { src: img, alt: '' } : { alt: '', ...img }
			),
		[images]
	);

	useEffect(() => {
		try {
			const canvas = document.createElement('canvas');
			const gl =
				canvas.getContext('webgl2') ||
				canvas.getContext('webgl') ||
				canvas.getContext('experimental-webgl');
			if (!gl) setWebglSupported(false);
		} catch {
			setWebglSupported(false);
		}
	}, []);

	// Without WebGL there is no intro to wait for
	useEffect(() => {
		if (webglSupported) return;
		onReady?.();
		onComplete?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [webglSupported]);

	if (!webglSupported) {
		return (
			<div className={className} style={style}>
				<FallbackGallery images={normalizedImages} monochrome={monochrome} />
			</div>
		);
	}

	return (
		<div className={className} style={style} aria-hidden="true">
			<Canvas
				camera={{ position: [0, 0, 0], fov: 55 }}
				dpr={[1, 2]}
				frameloop={paused ? 'never' : 'always'}
				gl={{ antialias: true, alpha: true }}
			>
				<SceneErrorBoundary
					onError={() => {
						onReady?.();
						onComplete?.();
					}}
				>
					<Suspense fallback={null}>
						<GalleryScene
							images={normalizedImages}
							speed={speed}
							visibleCount={visibleCount}
							fadeSettings={fadeSettings}
							blurSettings={blurSettings}
							pixelSettings={pixelSettings}
							monochrome={monochrome}
							autoPlaySpeed={autoPlaySpeed}
							introLength={introLength}
							captureInput={captureInput}
							scrollLinked={scrollLinked}
							onReady={onReady}
							onProgress={onProgress}
							onComplete={onComplete}
						/>
					</Suspense>
				</SceneErrorBoundary>
			</Canvas>
		</div>
	);
}
