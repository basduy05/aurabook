"use client";

import { useEffect, useRef } from "react";

interface Point3D {
	x: number;
	y: number;
	z: number;
}

interface InkSparkle extends Point3D {
	vx: number;
	vy: number;
	vz: number;
	size: number;
	alpha: number;
	pulseSpeed: number;
	color: string;
}

export function CommunityLoggedOutHero3D() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		let animationFrameId: number;
		let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
		let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

		const handleResize = () => {
			if (!canvas || !canvas.parentElement) return;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			width = canvas.parentElement.clientWidth;
			height = canvas.parentElement.clientHeight;
			canvas.width = width * dpr;
			canvas.height = height * dpr;
			ctx.scale(dpr, dpr);
		};

		handleResize();
		window.addEventListener("resize", handleResize);

		// Dynamic Scroll Progress Tracking
		let targetScrollProgress = 0;
		let scrollProgress = 0;

		const handleScroll = () => {
			const scrollY = window.scrollY;
			// Calculate smooth normalized progress between 0 and 1
			targetScrollProgress = Math.min(Math.max(scrollY / 600, 0), 1);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();

		// Interactive Mouse Tilt
		let targetRotationX = 0.35;
		let targetRotationY = -0.25;
		let rotationX = 0.35;
		let rotationY = -0.25;

		const handleMouseMove = (e: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width - 0.5;
			const y = (e.clientY - rect.top) / rect.height - 0.5;
			targetRotationY = -0.25 + x * 0.9;
			targetRotationX = 0.35 + y * 0.6;
		};

		const handleMouseLeave = () => {
			targetRotationX = 0.35;
			targetRotationY = -0.25;
		};

		canvas.addEventListener("mousemove", handleMouseMove);
		canvas.addEventListener("mouseleave", handleMouseLeave);

		// Floating Ink Sparkles & Golden Knowledge Dust
		const sparkles: InkSparkle[] = [];
		const sparkleColors = [
			"rgba(20, 20, 25, 0.45)",
			"rgba(180, 130, 40, 0.55)",
			"rgba(100, 100, 110, 0.4)",
			"rgba(212, 175, 55, 0.6)",
		];

		for (let i = 0; i < 55; i++) {
			sparkles.push({
				x: (Math.random() - 0.5) * 550,
				y: (Math.random() - 0.5) * 350 - 30,
				z: (Math.random() - 0.5) * 500,
				vx: (Math.random() - 0.5) * 0.4,
				vy: -Math.random() * 0.4 - 0.1, // gently floating upwards like inspiration
				vz: (Math.random() - 0.5) * 0.4,
				size: Math.random() * 2.2 + 0.8,
				alpha: Math.random() * 0.6 + 0.25,
				pulseSpeed: Math.random() * 0.03 + 0.015,
				color: sparkleColors[i % sparkleColors.length],
			});
		}

		// 3D Perspective Projection Function
		const project = (p: Point3D): { x: number; y: number; scale: number; zDepth: number } => {
			// Yaw (rotation Y)
			const cosY = Math.cos(rotationY);
			const sinY = Math.sin(rotationY);
			const x1 = p.x * cosY + p.z * sinY;
			const z1 = -p.x * sinY + p.z * cosY;

			// Pitch (rotation X)
			const cosX = Math.cos(rotationX);
			const sinX = Math.sin(rotationX);
			const y2 = p.y * cosX - z1 * sinX;
			const z2 = p.y * sinX + z1 * cosX;

			const fov = 460;
			const distance = 480;
			const scale = fov / (distance + z2);

			return {
				x: width / 2 + x1 * scale,
				y: height / 2 + 15 + y2 * scale,
				scale,
				zDepth: z2,
			};
		};

		const bookWidth = 135;
		const bookHeight = 180;
		let tick = 0;

		const render = () => {
			tick += 0.016;

			// Smooth damping for rotations & scroll
			rotationX += (targetRotationX - rotationX) * 0.07;
			rotationY += (targetRotationY - rotationY) * 0.07;
			scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

			ctx.clearRect(0, 0, width, height);

			// Soft subtle luxury paper radial background aura
			const bgGradient = ctx.createRadialGradient(
				width / 2,
				height / 2,
				20,
				width / 2,
				height / 2,
				Math.max(width, height) / 1.7,
			);
			bgGradient.addColorStop(0, "rgba(245, 243, 238, 0.95)");
			bgGradient.addColorStop(0.5, "rgba(250, 249, 246, 0.6)");
			bgGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, width, height);

			// Subtle 3D floor shadow underneath the book
			const shadowY = bookHeight / 2 + 25;
			const shadowScaleX = 170 + Math.sin(tick) * 4;
			const shadowScaleY = 55;
			const pShadowCenter = project({ x: 0, y: shadowY, z: 0 });

			ctx.save();
			ctx.beginPath();
			ctx.ellipse(
				pShadowCenter.x,
				pShadowCenter.y,
				shadowScaleX * pShadowCenter.scale,
				shadowScaleY * pShadowCenter.scale,
				0,
				0,
				Math.PI * 2,
			);
			ctx.fillStyle = "rgba(0, 0, 0, 0.06)";
			ctx.filter = "blur(12px)";
			ctx.fill();
			ctx.restore();

			// Hovering motion for the book
			const floatY = Math.sin(tick * 1.8) * 6 - scrollProgress * 15;

			// Spine Coordinates
			const spineTopLeft: Point3D = { x: -6, y: -bookHeight / 2 + floatY, z: 0 };
			const spineTopRight: Point3D = { x: 6, y: -bookHeight / 2 + floatY, z: 0 };
			const spineBottomLeft: Point3D = { x: -6, y: bookHeight / 2 + floatY, z: 0 };
			const spineBottomRight: Point3D = { x: 6, y: bookHeight / 2 + floatY, z: 0 };

			// Back/Left Cover (Charcoal Black Leather)
			const leftAngle = Math.PI * 0.16;
			const leftCoverTop: Point3D = {
				x: -6 - Math.cos(leftAngle) * (bookWidth + 5),
				y: -bookHeight / 2 + floatY,
				z: Math.sin(leftAngle) * (bookWidth + 5),
			};
			const leftCoverBottom: Point3D = {
				x: -6 - Math.cos(leftAngle) * (bookWidth + 5),
				y: bookHeight / 2 + floatY,
				z: Math.sin(leftAngle) * (bookWidth + 5),
			};

			// Front/Right Cover (Charcoal Black Leather)
			const rightAngle = Math.PI * 0.16;
			const rightCoverTop: Point3D = {
				x: 6 + Math.cos(rightAngle) * (bookWidth + 5),
				y: -bookHeight / 2 + floatY,
				z: Math.sin(rightAngle) * (bookWidth + 5),
			};
			const rightCoverBottom: Point3D = {
				x: 6 + Math.cos(rightAngle) * (bookWidth + 5),
				y: bookHeight / 2 + floatY,
				z: Math.sin(rightAngle) * (bookWidth + 5),
			};

			const pSpineTL = project(spineTopLeft);
			const pSpineTR = project(spineTopRight);
			const pSpineBL = project(spineBottomLeft);
			const pSpineBR = project(spineBottomRight);

			const pLeftCoverT = project(leftCoverTop);
			const pLeftCoverB = project(leftCoverBottom);
			const pRightCoverT = project(rightCoverTop);
			const pRightCoverB = project(rightCoverBottom);

			// 1. Draw Leather Hardcover Left
			ctx.beginPath();
			ctx.moveTo(pSpineTL.x, pSpineTL.y);
			ctx.lineTo(pLeftCoverT.x, pLeftCoverT.y);
			ctx.lineTo(pLeftCoverB.x, pLeftCoverB.y);
			ctx.lineTo(pSpineBL.x, pSpineBL.y);
			ctx.closePath();
			ctx.fillStyle = "#161618";
			ctx.fill();
			ctx.lineWidth = 1.5;
			ctx.strokeStyle = "#2d2d30";
			ctx.stroke();

			// 2. Draw Leather Hardcover Right
			ctx.beginPath();
			ctx.moveTo(pSpineTR.x, pSpineTR.y);
			ctx.lineTo(pRightCoverT.x, pRightCoverT.y);
			ctx.lineTo(pRightCoverB.x, pRightCoverB.y);
			ctx.lineTo(pSpineBR.x, pSpineBR.y);
			ctx.closePath();
			ctx.fillStyle = "#1e1e22";
			ctx.fill();
			ctx.strokeStyle = "#323236";
			ctx.stroke();

			// 3. Draw Gold Leaf Edge Trim on Spine
			ctx.beginPath();
			ctx.moveTo(pSpineTL.x, pSpineTL.y);
			ctx.lineTo(pSpineTR.x, pSpineTR.y);
			ctx.lineTo(pSpineBR.x, pSpineBR.y);
			ctx.lineTo(pSpineBL.x, pSpineBL.y);
			ctx.closePath();
			ctx.fillStyle = "#b8903c";
			ctx.fill();

			// 4. Draw Multiple Stacked Pages (Left Block)
			const leftPageCount = 4;
			for (let pIdx = 0; pIdx < leftPageCount; pIdx++) {
				const offset = (pIdx / leftPageCount) * 6;
				const angle = leftAngle - offset * 0.01;
				const pT = project({
					x: -4 - Math.cos(angle) * (bookWidth - 2),
					y: -bookHeight / 2 + floatY + offset * 0.5,
					z: Math.sin(angle) * (bookWidth - 2),
				});
				const pB = project({
					x: -4 - Math.cos(angle) * (bookWidth - 2),
					y: bookHeight / 2 + floatY - offset * 0.5,
					z: Math.sin(angle) * (bookWidth - 2),
				});

				ctx.beginPath();
				ctx.moveTo(pSpineTL.x, pSpineTL.y);
				ctx.lineTo(pT.x, pT.y);
				ctx.lineTo(pB.x, pB.y);
				ctx.lineTo(pSpineBL.x, pSpineBL.y);
				ctx.closePath();
				ctx.fillStyle = pIdx === leftPageCount - 1 ? "#faf7ee" : "#ede8dc";
				ctx.fill();
				ctx.lineWidth = 0.8;
				ctx.strokeStyle = "#d6cfbe";
				ctx.stroke();

				// Add delicate text lines on the top left page
				if (pIdx === leftPageCount - 1) {
					for (let line = 1; line <= 8; line++) {
						const t = line / 10;
						const start = {
							x: pSpineTL.x + (pSpineBL.x - pSpineTL.x) * t + 8,
							y: pSpineTL.y + (pSpineBL.y - pSpineTL.y) * t,
						};
						const end = {
							x: pT.x + (pB.x - pT.x) * t - 14,
							y: pT.y + (pB.y - pT.y) * t,
						};
						ctx.beginPath();
						ctx.moveTo(start.x, start.y);
						ctx.lineTo(end.x, end.y);
						ctx.lineWidth = 1;
						ctx.strokeStyle = line === 1 ? "rgba(180, 130, 40, 0.7)" : "rgba(30, 30, 35, 0.22)";
						ctx.stroke();
					}
				}
			}

			// 5. Draw Multiple Stacked Pages (Right Block)
			const rightPageCount = 4;
			for (let pIdx = 0; pIdx < rightPageCount; pIdx++) {
				const offset = (pIdx / rightPageCount) * 6;
				const angle = rightAngle - offset * 0.01;
				const pT = project({
					x: 4 + Math.cos(angle) * (bookWidth - 2),
					y: -bookHeight / 2 + floatY + offset * 0.5,
					z: Math.sin(angle) * (bookWidth - 2),
				});
				const pB = project({
					x: 4 + Math.cos(angle) * (bookWidth - 2),
					y: bookHeight / 2 + floatY - offset * 0.5,
					z: Math.sin(angle) * (bookWidth - 2),
				});

				ctx.beginPath();
				ctx.moveTo(pSpineTR.x, pSpineTR.y);
				ctx.lineTo(pT.x, pT.y);
				ctx.lineTo(pB.x, pB.y);
				ctx.lineTo(pSpineBR.x, pSpineBR.y);
				ctx.closePath();
				ctx.fillStyle = pIdx === rightPageCount - 1 ? "#fffef9" : "#f1ede3";
				ctx.fill();
				ctx.lineWidth = 0.8;
				ctx.strokeStyle = "#ded8c9";
				ctx.stroke();

				// Add delicate text lines on the top right page
				if (pIdx === rightPageCount - 1) {
					for (let line = 1; line <= 8; line++) {
						const t = line / 10;
						const start = {
							x: pSpineTR.x + (pSpineBR.x - pSpineTR.x) * t - 8,
							y: pSpineTR.y + (pSpineBR.y - pSpineTR.y) * t,
						};
						const end = {
							x: pT.x + (pB.x - pT.x) * t + 14,
							y: pT.y + (pB.y - pT.y) * t,
						};
						ctx.beginPath();
						ctx.moveTo(start.x, start.y);
						ctx.lineTo(end.x, end.y);
						ctx.lineWidth = 1;
						ctx.strokeStyle = line === 1 ? "rgba(180, 130, 40, 0.7)" : "rgba(30, 30, 35, 0.22)";
						ctx.stroke();
					}
				}
			}

			// 6. Dynamic Turning Page Driven by Scroll Position! (The Living Flip)
			// Scroll progress [0..1] maps to flip angle from right (+angle) across arch to left (-angle)
			const flipAngle = Math.PI * (0.16 - scrollProgress * 1.32);
			const curlHeight = Math.sin(scrollProgress * Math.PI) * 28; // arching upward while turning

			const pTurningT = project({
				x: Math.cos(flipAngle) * (bookWidth - 4),
				y: -bookHeight / 2 + floatY - curlHeight,
				z: Math.sin(flipAngle) * (bookWidth - 4),
			});
			const pTurningB = project({
				x: Math.cos(flipAngle) * (bookWidth - 4),
				y: bookHeight / 2 + floatY - curlHeight * 0.7,
				z: Math.sin(flipAngle) * (bookWidth - 4),
			});

			ctx.beginPath();
			ctx.moveTo(pSpineTR.x, pSpineTR.y);
			ctx.quadraticCurveTo(
				(pSpineTR.x + pTurningT.x) / 2,
				(pSpineTR.y + pTurningT.y) / 2 - curlHeight * 0.8,
				pTurningT.x,
				pTurningT.y,
			);
			ctx.lineTo(pTurningB.x, pTurningB.y);
			ctx.quadraticCurveTo(
				(pSpineBR.x + pTurningB.x) / 2,
				(pSpineBR.y + pTurningB.y) / 2 - curlHeight * 0.5,
				pSpineBR.x,
				pSpineBR.y,
			);
			ctx.closePath();

			// Luminous parchment color for turning page
			const pageGradient = ctx.createLinearGradient(
				pSpineTR.x,
				pSpineTR.y,
				pTurningT.x,
				pTurningT.y,
			);
			pageGradient.addColorStop(0, "#f2ede1");
			pageGradient.addColorStop(0.5, "#fbf8ef");
			pageGradient.addColorStop(1, "#f3eedf");
			ctx.fillStyle = pageGradient;
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = "rgba(180, 150, 100, 0.4)";
			ctx.stroke();

			// 7. Gold Satin Bookmark Ribbon
			const ribbonProgress = Math.sin(tick * 1.2) * 8;
			const pRibbonTop = project({ x: 0, y: -bookHeight / 2 + floatY, z: -2 });
			const pRibbonMid = project({
				x: Math.sin(tick) * 12,
				y: 20 + floatY,
				z: 25,
			});
			const pRibbonBottom = project({
				x: 8 + ribbonProgress,
				y: bookHeight / 2 + 35 + floatY,
				z: 40,
			});

			ctx.beginPath();
			ctx.moveTo(pRibbonTop.x, pRibbonTop.y);
			ctx.quadraticCurveTo(pRibbonMid.x, pRibbonMid.y, pRibbonBottom.x, pRibbonBottom.y);
			ctx.lineWidth = 3.5;
			ctx.strokeStyle = "#c89b3c";
			ctx.lineCap = "round";
			ctx.stroke();

			// 8. Floating Knowledge Sparkles & Constellation Lines
			for (let i = 0; i < sparkles.length; i++) {
				const s = sparkles[i];
				s.x += s.vx;
				s.y += s.vy;
				s.z += s.vz;

				// Loop particles upward
				if (s.y < -220) s.y = 180;
				if (Math.abs(s.x) > 280) s.vx *= -1;
				if (Math.abs(s.z) > 250) s.vz *= -1;

				const proj = project(s);
				if (proj.scale > 0) {
					const pulse = Math.sin(tick * 3 + i) * 0.25 + 0.75;
					ctx.beginPath();
					ctx.arc(proj.x, proj.y, s.size * proj.scale * pulse, 0, Math.PI * 2);
					ctx.fillStyle = s.color;
					ctx.fill();
				}
			}

			animationFrameId = requestAnimationFrame(render);
		};

		render();

		return () => {
			cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", handleResize);
			window.removeEventListener("scroll", handleScroll);
			canvas.removeEventListener("mousemove", handleMouseMove);
			canvas.removeEventListener("mouseleave", handleMouseLeave);
		};
	}, []);

	return (
		<div className="relative w-full h-[360px] sm:h-[440px] lg:h-[490px] overflow-hidden rounded-3xl border border-neutral-200/90 bg-linear-to-b from-[#fbfbfa] via-[#f7f6f2] to-[#f4f2ec] shadow-xl select-none">
			<canvas
				ref={canvasRef}
				className="w-full h-full block cursor-grab active:cursor-grabbing"
			/>
			{/* Living Scroll & Motion Tag */}
			<div className="absolute bottom-4 right-4 pointer-events-none rounded-full border border-neutral-300/80 bg-white/90 px-3 py-1.5 text-[11px] font-mono text-neutral-600 backdrop-blur-md flex items-center gap-2 shadow-sm">
				<span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-ping" />
				<span>Trang sách 3D sống động • Cuộn chuột để lật mở</span>
			</div>
		</div>
	);
}
