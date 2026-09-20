window.__ModuleLoader__.load({
	id: "dsh-caonima",
	factory: function (require) {
		"use strict";
		var module = { exports: {} };
		var exports = module.exports;

		//#region constants
		var PKG = "dsh-caonima";
		var ROOT_ID = "dsh-caonima-root";
		var GROUND = 8;            // px gap from viewport bottom
		var PET_W = 106;           // rendered pet width (px)
		var PET_H = 120;           // rendered pet height (px)
		var SPEED_WORK = 60;       // px/s while the agent runs
		var SPEED_IDLE = 20;       // px/s on a lazy stroll
		var NAP_AFTER_MS = 50000;  // idle this long → 打盹
		var CARRY_GRAVITY = 1500;  // px/s² for the drop-bounce after a drag

		/** 草泥马的嘴硬语录（被戳时随机一句）。 */
		var POKE_LINES = [
			"泥好呀~ 咴儿咴儿!",
			"别戳啦,在搬砖呢!",
			"看我干嘛,代码又不是我写的 (doge)",
			"再戳我就吐草了喔!",
			"今天也是努力种树的一天~",
			"M~ 摸摸头就好",
			"本泥马,在线冲浪",
			"信不信我原地劈个叉?"
		];

		/** 工具名前缀 → 气泡图标。 */
		var TOOL_ICONS = [
			["bash", "🖥️"], ["pwsh", "🖥️"], ["terminal", "🖥️"], ["read", "📖"], ["write", "✍️"],
			["edit", "✏️"], ["str", "✏️"], ["grep", "🔍"], ["glob", "🗂️"], ["ls", "🗂️"],
			["web_search", "🌐"], ["web_fetch", "🔗"], ["subagent", "🐣"], ["send_message", "📨"],
			["workflow", "🌊"], ["skill", "🎯"], ["todo", "📝"], ["goal", "🎯"], ["present", "🎁"],
			["job", "⏳"], ["plan", "🗺️"], ["ask", "🙋"], ["code", "🧮"], ["fs", "📁"], ["tool", "🔧"]
		];

		function toolIcon(name) {
			var lower = String(name || "").toLowerCase();
			for (var i = 0; i < TOOL_ICONS.length; i++) {
				if (lower.indexOf(TOOL_ICONS[i][0]) === 0) return TOOL_ICONS[i][1];
			}
			return "🔧";
		}

		function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
		function rand(min, max) { return min + Math.random() * (max - min); }
		function clamp(v, min, max) { return v < min ? min : v > max ? max : v; }
		//#endregion

		//#region svg
		var CREAM = "#fbf2e1";
		var DARK = "#55402f";
		var SHADE = "#e8d7b9";
		var HOOF = "#6b5545";
		var INK = "#3a2c22";

		/** 蓬松轮廓双描边法: 先画大一圈的深色底,再画原尺寸亮色,叠出干净的云朵剪影。 */
		function fluff(circles) {
			var s = "";
			for (var i = 0; i < circles.length; i++) {
				var c = circles[i];
				s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + (c[2] + 2.4) + '" fill="' + DARK + '"/>';
			}
			for (var j = 0; j < circles.length; j++) {
				var d = circles[j];
				s += '<circle cx="' + d[0] + '" cy="' + d[1] + '" r="' + d[2] + '" fill="' + (d[3] || CREAM) + '"/>';
			}
			return s;
		}

		var BODY = [[30, 90, 13], [26, 100, 10], [36, 83, 11], [40, 96, 12], [50, 84, 13], [60, 86, 13], [52, 96, 12], [64, 95, 11], [74, 88, 11], [77, 96, 10], [44, 74, 8], [55, 71, 9], [66, 73, 8]];
		var TAIL = [[17, 86, 7], [13, 80, 5.5]];
		var NECK = [[80, 74, 8], [83, 64, 7.5], [86, 54, 7], [89, 45, 7]];
		var CHEEKS = [[90, 39, 6], [104, 39, 6]];
		var AFRO = [[90, 18, 7], [98, 13.5, 7.5], [106, 19, 6.5], [85, 24, 5.5], [98, 7.5, 5]];

		function leg(cls, x) {
			return '<g transform="translate(' + x + ',100)"><g class="dsh-leg ' + cls + '">' +
				'<rect x="-3.4" y="-6" width="6.8" height="45" rx="3.4" fill="' + (cls.indexOf("f") === 0 ? SHADE : CREAM) + '" stroke="' + DARK + '" stroke-width="1.6"/>' +
				'<ellipse cx="0" cy="40" rx="4.2" ry="3" fill="' + HOOF + '"/></g></g>';
		}

		function ear(cls, tx, ty, rot) {
			return '<g transform="translate(' + tx + "," + ty + ") rotate(" + rot + ')">' +
				'<g class="dsh-ear ' + cls + '">' +
				'<path d="M0,0 C-4.5,-12 2.5,-15 3.5,-3 Z" fill="' + CREAM + '" stroke="' + DARK + '" stroke-width="1.6" stroke-linejoin="round"/>' +
				'<path d="M-0.8,-2.5 C-2.6,-9 1.2,-10.6 1.8,-4 Z" fill="#dfa394"/></g></g>';
		}

		function svgMarkup() {
			return '<svg class="dsh-svg" width="' + PET_W + '" height="' + PET_H + '" viewBox="0 0 132 150" aria-hidden="true">' +
				'<ellipse class="dsh-shadow" cx="58" cy="146" rx="32" ry="5" fill="rgba(80,55,25,.16)"/>' +
				leg("fb", 44) + leg("ff", 84) +
				'<g class="dsh-root">' +
				fluff(TAIL) +
				'<g class="dsh-body">' + fluff(BODY) + "</g>" +
				leg("nb", 36) + leg("nf", 74) +
				'<g class="dsh-head">' +
				fluff(NECK) +
				'<ellipse cx="97" cy="33" rx="11.5" ry="10" fill="' + CREAM + '" stroke="' + DARK + '" stroke-width="1.8"/>' +
				fluff(CHEEKS) + fluff(AFRO) +
				ear("ear-l", 88.5, 15, -16) + ear("ear-r", 104, 12.5, 15) +
				'<ellipse cx="98.5" cy="38.5" rx="5.6" ry="4.2" fill="#fffaf0"/>' +
				'<g class="dsh-eyes">' +
				'<g class="dsh-eyes-open">' +
				'<circle cx="93.6" cy="31.5" r="2.9" fill="' + INK + '"/><circle cx="102.8" cy="31.5" r="2.9" fill="' + INK + '"/>' +
				'<circle cx="92.7" cy="30.5" r="0.95" fill="#fff"/><circle cx="101.9" cy="30.5" r="0.95" fill="#fff"/>' +
				'<path d="M90.2,28.2 q3.4,-1.6 6.6,-0.2 M99.6,28 q3.4,-1.4 6.4,0.4" stroke="' + INK + '" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
				'<rect class="dsh-blink" x="89.8" y="28" width="16.8" height="8.6" rx="2" fill="' + CREAM + '" transform="scale(1,0.001)"/>' +
				'</g>' +
				'<path class="dsh-eyes-closed" d="M90.8,32.5 q2.8,2.6 5.6,0 M100,32.5 q2.8,2.6 5.6,0" stroke="' + INK + '" stroke-width="1.7" fill="none" stroke-linecap="round"/>' +
				"</g>" +
				'<circle cx="96.6" cy="36.6" r="0.85" fill="' + HOOF + '"/><circle cx="100.6" cy="36.6" r="0.85" fill="' + HOOF + '"/>' +
				'<path d="M95,40.4 q1.8,1.8 3.6,0 q1.8,1.8 3.6,0" stroke="' + INK + '" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
				'<ellipse cx="89" cy="37.5" rx="2.4" ry="1.5" fill="#f0a0a0" opacity=".55"/><ellipse cx="107.5" cy="37.5" rx="2.2" ry="1.4" fill="#f0a0a0" opacity=".55"/>' +
				'<g transform="translate(102,41)"><g class="dsh-grass"><path d="M0,0 C7,-1 12,-5 16.5,-12 C11.5,-6 6,-2 0,1.4 Z" fill="#6db33f"/>' +
				'<path d="M0,0.6 C8,2.4 14,1 19,-2 C13.5,4.2 6,3 0,2.2 Z" fill="#579430"/></g></g>' +
				"</g></g></svg>";
		}
		//#endregion

		//#region css
		var CSS = [
			"#" + ROOT_ID + "{position:fixed;inset:0;pointer-events:none;z-index:2147483000;font-family:ui-rounded,system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;}",
			"#" + ROOT_ID + " .dsh-pet{position:absolute;bottom:" + GROUND + "px;left:0;width:" + PET_W + "px;height:" + PET_H + "px;pointer-events:auto;cursor:grab;user-select:none;-webkit-user-select:none;will-change:transform;touch-action:none;}",
			"#" + ROOT_ID + " .dsh-pet:active{cursor:grabbing;}",
			"#" + ROOT_ID + " .dsh-svg{display:block;overflow:visible;}",
			"#" + ROOT_ID + " .dsh-flip{width:100%;height:100%;transform-origin:50% 50%;}",
			"#" + ROOT_ID + " .dsh-bubble{position:absolute;left:52px;bottom:" + (PET_H - 8) + "px;max-width:224px;background:#fffdf6;color:#4a3a2a;border:1.6px solid " + DARK + ";border-radius:12px;padding:4px 10px;font-size:12.5px;line-height:1.35;box-shadow:0 2px 10px rgba(60,40,20,.18);opacity:0;transform:scale(.5);transform-origin:0% 100%;transition:opacity .18s,transform .18s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;}",
			"#" + ROOT_ID + " .dsh-bubble.dsh-show{opacity:1;transform:scale(1);}",
			"#" + ROOT_ID + " .dsh-bubble.dsh-urgent{border-color:#d97706;color:#92400e;background:#fff7e6;animation:dsh-pulse .7s ease-in-out infinite;}",
			"#" + ROOT_ID + " .dsh-bubble:after{content:'';position:absolute;left:14px;bottom:-7px;width:10px;height:10px;background:inherit;border-right:1.6px solid " + DARK + ";border-bottom:1.6px solid " + DARK + ";transform:rotate(45deg);border-radius:0 0 3px 0;}",
			"#" + ROOT_ID + " .dsh-zzz{position:absolute;left:88px;bottom:112px;display:none;color:#8a7358;font-weight:700;font-size:13px;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=nap] .dsh-zzz{display:block;}",
			"#" + ROOT_ID + " .dsh-zzz i{position:absolute;font-style:normal;animation:dsh-zzz 2.6s ease-in-out infinite;opacity:0;}",
			"#" + ROOT_ID + " .dsh-zzz i:nth-child(2){animation-delay:.85s;font-size:11px;left:6px;}",
			"#" + ROOT_ID + " .dsh-zzz i:nth-child(3){animation-delay:1.7s;font-size:9px;left:12px;}",
			"#" + ROOT_ID + " .dsh-heart{position:absolute;bottom:96px;font-size:14px;animation:dsh-heart 1.1s ease-out forwards;pointer-events:none;}",
			"#" + ROOT_ID + " .dsh-leg{transform-box:fill-box;transform-origin:50% 13%;}",
			"#" + ROOT_ID + " .dsh-root,#" + ROOT_ID + " .dsh-body,#" + ROOT_ID + " .dsh-head{transform-box:view-box;}",
			"#" + ROOT_ID + " .dsh-root{transform-origin:66px 146px;}",
			"#" + ROOT_ID + " .dsh-body{transform-origin:52px 104px;}",
			"#" + ROOT_ID + " .dsh-head{transform-origin:80px 74px;}",
			"#" + ROOT_ID + " .dsh-grass{transform-box:fill-box;transform-origin:0% 55%;animation:dsh-sway 1.3s ease-in-out infinite alternate;}",
			"#" + ROOT_ID + " .dsh-ear-l,#" + ROOT_ID + " .dsh-ear-r{transform-box:fill-box;transform-origin:50% 95%;}",
			"#" + ROOT_ID + " .dsh-blink{transform-box:view-box;transform-origin:98px 26px;transform:scaleY(0);animation:dsh-blink 5.4s ease-in-out infinite;}",
			"/* walk */",
			"@" + "keyframes dsh-step{from{transform:rotate(17deg)}to{transform:rotate(-17deg)}}",
			"@" + "keyframes dsh-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.2px)}}",
			"#" + ROOT_ID + " .dsh-pet[data-walk='1'] .dsh-leg{animation:dsh-step .34s ease-in-out infinite alternate;}",
			"#" + ROOT_ID + " .dsh-pet[data-walk='1'] .dsh-leg.nf,#" + ROOT_ID + " .dsh-pet[data-walk='1'] .dsh-leg.fb{animation-delay:-.17s;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle][data-walk='1'] .dsh-leg{animation-duration:.6s;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle][data-walk='1'] .dsh-leg.nf,#" + ROOT_ID + " .dsh-pet[data-state=idle][data-walk='1'] .dsh-leg.fb{animation-delay:-.3s;}",
			"#" + ROOT_ID + " .dsh-pet[data-walk='1'] .dsh-body{animation:dsh-bob .34s ease-in-out infinite;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle][data-walk='1'] .dsh-body{animation-duration:.6s;}",
			"/* idle breathing + ear twitch */",
			"@" + "keyframes dsh-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.022)}}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle][data-walk='0'] .dsh-body,#" + ROOT_ID + " .dsh-pet[data-state=nap] .dsh-body{animation:dsh-breathe 3.4s ease-in-out infinite;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=nap] .dsh-body{animation-duration:4.6s;}",
			"@" + "keyframes dsh-twitch{0%,6%,12%,100%{transform:rotate(0)}8%{transform:rotate(-13deg)}10%{transform:rotate(4deg)}}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle] .dsh-ear-l{animation:dsh-twitch 7s ease-in-out infinite;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=idle] .dsh-ear-r{animation:dsh-twitch 9.5s ease-in-out 1.4s infinite;}",
			"/* nap: 闭眼 */",
			"#" + ROOT_ID + " .dsh-eyes-closed{display:none;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=nap] .dsh-eyes-closed{display:block;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=nap] .dsh-eyes-open{display:none;}",
			"/* celebrate / alert hop */",
			"@" + "keyframes dsh-hop{0%,100%{transform:translateY(0) scale(1,1)}14%{transform:translateY(2px) scale(1.07,.9)}46%{transform:translateY(-30px) scale(.94,1.06)}72%{transform:translateY(0) scale(1.05,.94)}}",
			"#" + ROOT_ID + " .dsh-pet[data-state=celebrate] .dsh-root{animation:dsh-hop .62s ease-in-out 3;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=alert] .dsh-root{animation:dsh-hop .55s ease-in-out infinite;}",
			"@" + "keyframes dsh-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}",
			"/* poke shake + hearts */",
			"@" + "keyframes dsh-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}45%{transform:rotate(6deg)}70%{transform:rotate(-4deg)}}",
			"#" + ROOT_ID + " .dsh-pet.dsh-poked .dsh-root{animation:dsh-shake .5s ease;}",
			"@" + "keyframes dsh-heart{0%{transform:translateY(0) scale(.5);opacity:0}15%{opacity:1}100%{transform:translateY(-46px) translateX(var(--dx,0)) scale(1.15);opacity:0}}",
			"/* munch (吃草点头) */",
			"@" + "keyframes dsh-munch{0%,100%{transform:rotate(0) translateY(0)}50%{transform:rotate(11deg) translateY(6px)}}",
			"#" + ROOT_ID + " .dsh-pet.dsh-munching .dsh-head{animation:dsh-munch .55s ease-in-out 4;}",
			"/* carried (被拎起来:四肢下垂 + 摇摆) */",
			"@" + "keyframes dsh-swing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}",
			"#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-root{animation:dsh-swing 1s ease-in-out infinite;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-leg{animation:none;}",
			"#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-leg.nb,#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-leg.fb{transform:rotate(-9deg);}",
			"#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-leg.nf,#" + ROOT_ID + " .dsh-pet[data-state=carried] .dsh-leg.ff{transform:rotate(9deg);}",
			"@" + "keyframes dsh-zzz{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-26px);opacity:0}}",
			"@" + "keyframes dsh-sway{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}",
			"@" + "keyframes dsh-blink{0%,1.4%{transform:scaleY(0)}2.4%,3.4%{transform:scaleY(1)}4.8%,100%{transform:scaleY(0)}}",
			"@" + "media (prefers-reduced-motion: reduce){#" + ROOT_ID + " *{animation-duration:2s!important;animation-iteration-count:1!important;}}"
		].join("\n");
		//#endregion

		//#region mount
		/**
		 * 构建并运行桌宠。返回 dispose。
		 * @param {any} ctx - browser root context (services: sessions).
		 * @returns {() => void} 卸载函数。
		 */
		function mount(ctx) {
			if (document.body) return mountNow(ctx);
			var mounted = null;
			var rafId = 0;
			var retry = function () {
				if (mounted || disposed) return;
				if (document.body) { mounted = mountNow(ctx); return; }
				rafId = requestAnimationFrame(retry);
			};
			var disposed = false;
			rafId = requestAnimationFrame(retry);
			return function () { disposed = true; cancelAnimationFrame(rafId); if (mounted) mounted(); };
		}

		function mountNow(ctx) {
			var stale = document.getElementById(ROOT_ID);
			if (stale) stale.remove();
			var style = document.createElement("style");
			style.setAttribute("data-plugin", PKG);
			style.textContent = CSS;
			document.head.appendChild(style);

			var root = document.createElement("div");
			root.id = ROOT_ID;
			root.innerHTML =
				'<div class="dsh-pet" data-state="idle" data-walk="0">' +
				'<div class="dsh-bubble"><span class="dsh-bubble-text"></span></div>' +
				'<div class="dsh-flip">' + svgMarkup() + "</div>" +
				'<div class="dsh-zzz"><i>z</i><i>z</i><i>z</i></div>' +
				"</div>";
			document.body.appendChild(root);
			var pet = root.querySelector(".dsh-pet");
			var bubble = root.querySelector(".dsh-bubble");
			var bubbleText = root.querySelector(".dsh-bubble-text");
			var flip = root.querySelector(".dsh-flip");

			/* ── 仿真状态 ── */
			var sim = {
				x: clamp(window.innerWidth - PET_W - 40, 0, window.innerWidth - PET_W), y: 0, vy: 0,
				dir: -1, targetX: null, pauseUntil: 0,
				running: false, alerting: false, celebrateUntil: 0,
				lastActivity: Date.now(), state: "idle", airborne: false, carried: false
			};
			var disposed = false;
			var bubbleTimer = 0;

			function say(text, ms, urgent) {
				bubbleText.textContent = text;
				bubble.classList.toggle("dsh-urgent", !!urgent);
				bubble.classList.add("dsh-show");
				clearTimeout(bubbleTimer);
				bubbleTimer = setTimeout(function () { bubble.classList.remove("dsh-show"); }, ms || 2400);
			}
			function hideBubble() { bubble.classList.remove("dsh-show"); }

			function effectiveState() {
				var now = Date.now();
				if (sim.carried) return "carried";
				if (sim.alerting) return "alert";
				if (now < sim.celebrateUntil) return "celebrate";
				if (sim.running) return "work";
				if (now - sim.lastActivity > NAP_AFTER_MS) return "nap";
				return "idle";
			}
			function applyState() {
				var next = effectiveState();
				if (next !== sim.state) {
					sim.state = next;
					pet.dataset.state = next;
					if (next !== "nap" && next !== "carried") { /* 醒了就别再冒 z */ }
				}
				var walking = (next === "work" || next === "idle") && sim.targetX !== null && !sim.airborne;
				var w = walking ? "1" : "0";
				if (pet.dataset.walk !== w) pet.dataset.walk = w;
				flip.style.transform = "scaleX(" + (sim.dir >= 0 ? 1 : -1) + ")";
			}

			/* ── 走动决策与物理 (requestAnimationFrame) ── */
			var prevTs = 0;
			function tick(ts) {
				if (disposed) return;
				var dt = prevTs ? clamp((ts - prevTs) / 1000, 0, 0.05) : 0;
				prevTs = ts;
				var now = Date.now();
				applyState();

				if (sim.airborne) {
					sim.y += sim.vy * dt;
					sim.vy -= CARRY_GRAVITY * dt;
					if (sim.y <= 0) {
						sim.y = 0;
						if (sim.vy < -60) { sim.vy = -sim.vy * 0.34; } else { sim.vy = 0; sim.airborne = false; }
					}
				}

				if (!sim.carried && !sim.alerting && now >= sim.celebrateUntil && (sim.state === "work" || sim.state === "idle")) {
					var vw = Math.max(240, window.innerWidth);
					var max = vw - PET_W - 6;
					if (sim.targetX === null) {
						if (now >= sim.pauseUntil) {
							if (Math.random() < (sim.state === "work" ? 0.78 : 0.45)) {
								sim.targetX = clamp(rand(10, max), 10, max);
							} else {
								sim.pauseUntil = now + rand(sim.state === "work" ? 500 : 1600, sim.state === "work" ? 1800 : 4200);
								if (sim.state === "work" && Math.random() < 0.3) munch();
							}
						}
					} else {
						var speed = (sim.state === "work" ? SPEED_WORK : SPEED_IDLE) * (dt || 0.016);
						var delta = sim.targetX - sim.x;
						if (Math.abs(delta) <= speed) {
							sim.x = sim.targetX; sim.targetX = null; sim.pauseUntil = now + rand(400, 1200);
						} else {
							sim.dir = delta > 0 ? 1 : -1;
							sim.x += (delta > 0 ? speed : -speed);
						}
					}
					sim.x = clamp(sim.x, 4, max);
				}

				pet.style.transform = "translateX(" + sim.x.toFixed(1) + "px)";
				pet.style.bottom = (GROUND + sim.y).toFixed(1) + "px";
				requestAnimationFrame(tick);
			}
			requestAnimationFrame(tick);

			var munchTimer = 0;
			function munch() {
				pet.classList.remove("dsh-munching");
				void pet.offsetWidth;
				pet.classList.add("dsh-munching");
				clearTimeout(munchTimer);
				munchTimer = setTimeout(function () { pet.classList.remove("dsh-munching"); }, 2300);
				say("🌿 咔嚓咔嚓…", 1800);
			}
			function celebrate(text) {
				sim.celebrateUntil = Date.now() + 1900;
				sim.targetX = null;
				say(text, 2200);
			}

			/* ── 拖拽 / 戳一戳 ── */
			var drag = null;
			pet.addEventListener("pointerdown", function (ev) {
				sim.lastActivity = Date.now();
				pet.setPointerCapture(ev.pointerId);
				drag = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, gx: sim.x, gy: sim.y, moved: 0, t0: Date.now(), lastY: ev.clientY, vy: 0 };
			});
			pet.addEventListener("pointermove", function (ev) {
				if (!drag || ev.pointerId !== drag.id) return;
				var dx = ev.clientX - drag.x0;
				var dy = drag.y0 - ev.clientY;
				drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
				if (drag.moved > 6) {
					sim.carried = true;
					sim.airborne = false;
					sim.vy = 0;
					sim.x = clamp(drag.gx + dx, 4, Math.max(10, window.innerWidth - PET_W - 6));
					sim.y = Math.max(0, drag.gy + dy);
					drag.vy = (drag.lastY - ev.clientY) * 14;
					drag.lastY = ev.clientY;
				}
			});
			var release = function (ev) {
				if (!drag || ev.pointerId !== drag.id) return;
				var wasCarried = sim.carried;
				var quick = Date.now() - drag.t0 < 350 && drag.moved <= 6;
				if (wasCarried) {
					sim.carried = false;
					if (sim.y > 2) { sim.airborne = true; sim.vy = clamp(drag.vy, 20, 900); say("💨 啊!", 900); }
					else { sim.y = 0; }
				}
				if (quick) poke();
				drag = null;
				sim.lastActivity = Date.now();
			};
			pet.addEventListener("pointerup", release);
			pet.addEventListener("pointercancel", release);

			function poke() {
				pet.classList.remove("dsh-poked");
				void pet.offsetWidth;
				pet.classList.add("dsh-poked");
				setTimeout(function () { pet.classList.remove("dsh-poked"); }, 600);
				for (var i = 0; i < 3; i++) {
					var heart = document.createElement("span");
					heart.className = "dsh-heart";
					heart.textContent = pick(["💗", "🌟", "🌿", "💛"]);
					heart.style.left = rand(30, 70) + "px";
					heart.style.setProperty("--dx", rand(-14, 22) + "px");
					heart.style.animationDelay = (i * 0.09) + "s";
					heart.addEventListener("animationend", function () { this.remove(); });
					pet.appendChild(heart);
				}
				if (sim.state === "nap") { say("😳 被发现了…", 1600); }
				else if (sim.running) { say("搬砖中,勿投喂~", 1600); }
				else { say(pick(POKE_LINES), 2200); }
			}

			var onResize = function () { sim.x = clamp(sim.x, 4, Math.max(4, window.innerWidth - PET_W - 6)); };
			window.addEventListener("resize", onResize);

			/* ── 会话状态接线 ── */
			var boundId = null;
			var offSnap = null;
			var offEv = null;
			var eventSourceKnown = false;
			var lastSeenSeq = 0;

			function react(ev) {
				if (!ev || typeof ev.type !== "string") return;
				var data = ev.data || {};
				switch (ev.type) {
					case "user/message":
						sim.lastActivity = Date.now();
						if (!sim.running) say("📥 收到!出发~", 1500);
						break;
					case "tool/call":
						if (sim.running && !sim.alerting) say(toolIcon(data.name) + " " + (data.name || "tool") + "…", 2600);
						break;
					case "turn/end": {
						sim.alerting = false;
						var kind = data.reason && data.reason.kind;
						if (kind === "completed" || kind === void 0) celebrate("🎉 搞定啦~ 咴儿咴儿!");
						else if (kind === "error") celebrate("😵 翻车了…去看看日志");
						else celebrate("⏹ 这回合结束啦");
						break;
					}
					case "approval/asked":
						sim.alerting = true;
						sim.lastActivity = Date.now();
						say("⚠️ 需要批准: " + (data.toolName || "操作"), 4000, true);
						break;
					case "approval/decided":
						sim.alerting = false;
						say("✔ 收到批准,继续冲!", 1600);
						break;
					default:
						break;
				}
			}

			function scanWindow(win, initial) {
				var entries = win && win.entries;
				if (!entries) return;
				var maxSeq = lastSeenSeq;
				var fresh = [];
				for (var i = 0; i < entries.length; i++) {
					var e = entries[i];
					if (!e || e.type !== "event") continue;
					var ev = e.event;
					var seq = typeof ev.seq === "number" ? ev.seq : 0;
					if (seq > maxSeq) maxSeq = seq;
					if (seq > lastSeenSeq) fresh.push(ev);
				}
				if (initial || (win.change && win.change.kind === "replace")) {
					lastSeenSeq = maxSeq; /* 初载/重连:快进,不对历史事件做反应 */
					return;
				}
				lastSeenSeq = maxSeq;
				fresh.sort(function (a, b) { return (a.seq || 0) - (b.seq || 0); });
				for (var k = 0; k < fresh.length; k++) react(fresh[k]);
			}

			function unbind() {
				if (offSnap) { offSnap(); offSnap = null; }
				if (offEv) { offEv(); offEv = null; }
				boundId = null;
				eventSourceKnown = false;
			}

			function bind(id) {
				unbind();
				var binding = ctx.sessions.binding(id);
				if (!binding || !binding.session) return; /* 绑定尚未建立,下次列表通知再试 */
				boundId = id;
				lastSeenSeq = 0;
				offSnap = binding.session.subscribe(function () {
					var s = binding.session.getSnapshot();
					if (!s) return;
					var was = sim.running;
					sim.running = !!s.running;
					if (sim.running) {
						sim.lastActivity = Date.now();
						if (!was) say("🚀 开跑!", 1500);
					} else if (was) {
						sim.lastActivity = Date.now();
					}
				});
				if (binding.eventSource) {
					offEv = binding.eventSource.subscribe(function () {
						var w = binding.eventSource.getSnapshot();
						scanWindow(w, !eventSourceKnown);
						eventSourceKnown = true;
					});
				}
			}

			function pull() {
				var st = ctx.sessions.list.getSnapshot();
				var id = st && st.current;
				if (!id) { if (boundId) unbind(); sim.running = false; return; }
				if (id !== boundId) bind(id);
				else if (!ctx.sessions.binding(id)) bind(id);
			}

			var offList = ctx.sessions.list.subscribe(pull);
			pull();

			/* ── dispose ── */
			return function dispose() {
				disposed = true;
				clearTimeout(bubbleTimer);
				clearTimeout(munchTimer);
				try { offSnap && offSnap(); } catch (e) { /* noop */ }
				try { offEv && offEv(); } catch (e) { /* noop */ }
				try { offList && offList(); } catch (e) { /* noop */ }
				window.removeEventListener("resize", onResize);
				style.remove();
				root.remove();
			};
		}
		//#endregion

		//#region plugin
		/** Required services: the browser sessions store (current session + snapshots + event window). */
		var inject = ["sessions"];
		/**
		 * Client plugin body: mount the alpaca desktop pet.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
			ctx.effect(function () {
				return mount(ctx);
			}, PKG + ": pet");
		}
		//#endregion

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
