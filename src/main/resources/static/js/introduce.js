(function () {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof bodymovin === 'undefined') return;

    const el = document.getElementById('lottie-ship');
    if (!el) return;

    // 컨텍스트 경로 반영된 실제 경로 사용
    const jsonPath = el.getAttribute('data-path') || '/json/shipping.json';

    fetch(jsonPath, { cache: 'no-store' })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            const anim = bodymovin.loadAnimation({
                container: el,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: data
            });

            anim.addEventListener('DOMLoaded', () => {
                const fallback = el.parentElement?.querySelector('.earth_svg.fallback');
                if (fallback) fallback.style.display = 'none';
            });

            if ('IntersectionObserver' in window) {
                const io = new IntersectionObserver(entries => {
                    entries.forEach(e => e.isIntersecting ? anim.play() : anim.pause());
                }, { threshold: 0.1 });
                io.observe(el);
            }
        })
        .catch(err => console.error('[Lottie] load failed:', err));
})();


(function loadSvgAndAnimate() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const host = document.getElementById('map-group');
    if (!host) return;

    const src = host.getAttribute('data-src') || '/images/introduceImages/map_total_group.svg';

    fetch(src, { cache: 'no-store' })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
        .then(svgText => {
            host.innerHTML = svgText;
            const svg = host.querySelector('svg');
            if (!svg) throw new Error('SVG root not found');

            (() => {
                // 1) viewBox 얻기 (fallback 포함)
                let vb = svg.viewBox && svg.viewBox.baseVal;
                if (!vb || !vb.width || !vb.height) {
                    const w = parseFloat(svg.getAttribute('width')) || 461;
                    const h = parseFloat(svg.getAttribute('height')) || 445;
                    vb = { x: 0, y: 0, width: w, height: h };
                }

                // 2) SVG 안에 이미 있는 외곽 프레임(rect) 중 viewBox와 같은 크기면 숨기기
                const TOL = 1; // 허용 오차(px)
                Array.from(svg.querySelectorAll('rect[stroke]')).forEach(r => {
                    const fill = (r.getAttribute('fill') || '').toLowerCase();
                    if (fill && fill !== 'none') return;
                    const x = parseFloat(r.getAttribute('x')) || 0;
                    const y = parseFloat(r.getAttribute('y')) || 0;
                    const w = parseFloat(r.getAttribute('width'));
                    const h = parseFloat(r.getAttribute('height'));
                    if (
                        Number.isFinite(w) && Number.isFinite(h) &&
                        Math.abs(x - vb.x) <= TOL && Math.abs(y - vb.y) <= TOL &&
                        Math.abs(w - vb.width) <= TOL && Math.abs(h - vb.height) <= TOL
                    ) {
                        r.style.display = 'none';
                    }
                });

                // 3) 새 프레임 추가 (비율 스케일링에도 두께가 유지되도록)
                const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                frame.setAttribute('x', vb.x + 1);                   // 2px stroke가 픽셀 중앙에 오게 1px inset
                frame.setAttribute('y', vb.y + 1);
                frame.setAttribute('width', vb.width - 2);
                frame.setAttribute('height', vb.height - 2);
                frame.setAttribute('fill', 'none');
                frame.setAttribute('stroke', '#333');
                frame.setAttribute('stroke-width', '2');
                frame.setAttribute('vector-effect', 'non-scaling-stroke'); // 스케일 돼도 2px 유지
                frame.setAttribute('data-frame', '1');
                frame.style.shapeRendering = 'crispEdges';
                frame.style.pointerEvents = 'none';
                svg.appendChild(frame);
            })();

            // 애니메이션 스타일
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = `
        .marker { opacity: 0; transform-origin: center; transform-box: fill-box; }
        .marker.reveal { animation: pop .45s cubic-bezier(.2,.8,.2,1) forwards; }
        @keyframes pop {
          0% { opacity: 0; transform: scale(.55); }
          70%{ opacity: 1; transform: scale(1.12); }
          100%{ opacity:1; transform: scale(1); }
        }
      `;
            svg.appendChild(style);

            // 순서
            const ORDER = ['blue', 'purple', 'green-dark', 'green-light', 'orange', 'brown', 'red-darkbrown', 'red'];

            // 모두 '소문자' hex로 넣어야 매칭됨
            const COLOR_MAP = {
                blue: new Set(['#013895']),
                purple: new Set(['#6009a2', '#8a3ffc']),
                'green-dark': new Set(['#0b481f']),
                'green-light': new Set(['#0dc93f']),
                orange: new Set(['#e9ac29']),
                brown: new Set(['#64504c']),
                'red-darkbrown': new Set(['#811d0b']),
                red: new Set(['#e70c0f'])
            };

            // 유틸
            const toHex = (c) => {
                if (!c) return '';
                c = c.trim().toLowerCase();
                const m = c.match(/^rgba?\(([^)]+)\)/);
                if (m) {
                    const [r, g, b] = m[1].split(',').map(v => Math.round(parseFloat(v)));
                    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                }
                const s = c.match(/^#([0-9a-f]{3})$/i);
                if (s) { const h = s[1]; return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
                return c;
            };
            const getColor = (el) => {
                let c = el.getAttribute('fill') || el.getAttribute('stroke') || '';
                if (!c || c === 'none') {
                    const cs = window.getComputedStyle(el);
                    c = (cs.fill && cs.fill !== 'none') ? cs.fill : cs.stroke;
                }
                return toHex(c || '');
            };

            // 후보 도형 수집(마커들)
            const shapes = Array.from(svg.querySelectorAll('circle, path, rect, polygon, polyline, ellipse'))
                .filter(el => !el.hasAttribute('data-frame'));

            // 그룹핑
            const groups = new Map(ORDER.map(h => [h, []]));
            const unmapped = new Set();
            shapes.forEach(el => {
                const hex = getColor(el);
                if (!hex || hex === 'none' || hex.startsWith('url(')) return;
                let matched = null;
                for (const key of ORDER) {
                    if (COLOR_MAP[key] && COLOR_MAP[key].has(hex)) { matched = key; break; }
                }
                if (matched) {
                    el.classList.add('marker');
                    groups.get(matched).push(el);
                } else {
                    unmapped.add(hex); // 필요 시 콘솔 확인 후 COLOR_MAP에 추가
                }
            });

            // 시작
            let timers = [];
            const clearTimers = () => { timers.forEach(id => clearTimeout(id)); timers = []; };

            const resetMarkers = () => {
                clearTimers();
                ORDER.forEach(h => {
                    (groups.get(h) || []).forEach(el => {
                        el.classList.remove('reveal');   // 초기 상태로
                        // SVG 강제 리플로우(다음 재생 때 확실히 적용되게)
                        void el.getBoundingClientRect();
                    });
                });
            };

            const playSequence = () => {
                const perDelay = 90;   // 같은 색 내부 간 간격(ms)
                const between = 200;  // 색 그룹 사이 간격(ms)
                let base = 0;
                ORDER.forEach(h => {
                    const arr = groups.get(h) || [];
                    arr.forEach((el, i) => {
                        timers.push(setTimeout(() => el.classList.add('reveal'), base + i * perDelay));
                    });
                    base += arr.length * perDelay + between;
                });
            };

            // === 뷰포트 입·퇴장에 따라 재생/리셋 ===
            if ('IntersectionObserver' in window) {
                let inView = false;
                const io = new IntersectionObserver(entries => {
                    entries.forEach(e => {
                        if (e.isIntersecting && !inView) {
                            inView = true;
                            resetMarkers();                 // 항상 0상태에서 시작
                            requestAnimationFrame(playSequence);
                        } else if (!e.isIntersecting && inView) {
                            inView = false;
                            resetMarkers();                 // 화면에서 나가면 정지+초기화
                        }
                    });
                }, { threshold: 0.25 });
                io.observe(host);                     // 더 이상 disconnect() 하지 않음
            } else {
                playSequence();                       // 폴백: 1회 재생
            }

            if (unmapped.size) console.log('[SVG] 매핑되지 않은 색:', Array.from(unmapped));
        })
        .catch(err => console.error('[SVG] load failed:', err));
})();


(function loadWrap2SvgAndAnimate() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const host = document.getElementById('map-wrap2');
    if (!host) return;

    const src = host.getAttribute('data-src') || '/images/introduceImages/map_total_wrap2.svg';

    // FOUC 방지
    const prevOpacity = host.style.opacity;
    host.style.opacity = '0';

    fetch(src, { cache: 'no-store' })
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
        .then(svgText => {
            host.innerHTML = svgText;
            const svg = host.querySelector('svg');
            if (!svg) throw new Error('SVG root not found');

            // 비율 반영
            let vb = svg.viewBox && svg.viewBox.baseVal;
            if (vb && vb.width && vb.height) host.style.aspectRatio = `${vb.width} / ${vb.height}`;

            // 테두리 프레임 정리/추가
            (() => {
                let box = vb;
                if (!box || !box.width || !box.height) {
                    const w = parseFloat(svg.getAttribute('width')) || 460;
                    const h = parseFloat(svg.getAttribute('height')) || 486.59;
                    box = { x: 0, y: 0, width: w, height: h };
                }
                const TOL = 1;
                Array.from(svg.querySelectorAll('rect[stroke]')).forEach(r => {
                    const fill = (r.getAttribute('fill') || '').toLowerCase();
                    if (fill && fill !== 'none') return;
                    const x = parseFloat(r.getAttribute('x')) || 0;
                    const y = parseFloat(r.getAttribute('y')) || 0;
                    const w = parseFloat(r.getAttribute('width'));
                    const h = parseFloat(r.getAttribute('height'));
                    if (Number.isFinite(w) && Number.isFinite(h) &&
                        Math.abs(x - box.x) <= TOL && Math.abs(y - box.y) <= TOL &&
                        Math.abs(w - box.width) <= TOL && Math.abs(h - box.height) <= TOL) {
                        r.style.display = 'none';
                    }
                });
                const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                frame.setAttribute('x', box.x + 1);
                frame.setAttribute('y', box.y + 1);
                frame.setAttribute('width', box.width - 2);
                frame.setAttribute('height', box.height - 2);
                frame.setAttribute('fill', 'none');
                frame.setAttribute('stroke', '#333');
                frame.setAttribute('stroke-width', '2');
                frame.setAttribute('vector-effect', 'non-scaling-stroke');
                frame.setAttribute('data-frame', '1');
                frame.style.shapeRendering = 'crispEdges';
                frame.style.pointerEvents = 'none';
                svg.appendChild(frame);
            })();

            // 스타일
            const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            style.textContent = `
        .hidden0{opacity:0}
        .reveal{animation:fadePop .45s cubic-bezier(.2,.8,.2,1) forwards;will-change:transform,opacity}
        @keyframes fadePop{0%{opacity:0;transform:scale(.85)}70%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
        .emph{animation:emphIn .5s cubic-bezier(.2,.8,.2,1) forwards;will-change:transform,opacity}
        @keyframes emphIn{0%{opacity:0;transform:scale(1.25)}100%{opacity:1;transform:scale(1)}}
        .draw{animation:strokeDraw var(--draw-dur,1.5s) ease-out forwards}
        .draw-r{animation:strokeDrawRev var(--draw-dur,1.5s) ease-out forwards}
        @keyframes strokeDraw{to{stroke-dashoffset:0}}
        @keyframes strokeDrawRev{to{stroke-dashoffset:var(--len)}}
      `;
            svg.appendChild(style);

            // 색 매핑(소문자 hex 기준)
            const COLORS = {
                black: new Set(['#000000', '#111111', '#222222', 'black']),
                red: new Set(['#e70c0f', '#da1e28', '#ff3b30', '#f00e0e']),
                blueArrow: new Set(['#0f62fe', '#013895', '#0072c3']),
                cyanArrow: new Set(['#38bdf8', '#00bcd4', '#00aaff', '#7fc7d9']),
                green: new Set(['#24a148', '#0dc93f', '#42be65', '#305f3d']),
                purple: new Set(['#6009a2', '#8a3ffc', '#6f42c1', '#670b85'])
            };

            // 색 유틸
            const toHex = (c) => {
                if (!c) return '';
                c = c.trim().toLowerCase();
                const m = c.match(/^rgba?\(([^)]+)\)/);
                if (m) {
                    const [r, g, b] = m[1].split(',').map(v => Math.round(parseFloat(v)));
                    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                }
                const s = c.match(/^#([0-9a-f]{3})$/i);
                if (s) { const h = s[1]; return '#' + h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
                return c;
            };
            const getColor = (el) => {
                let c = el.getAttribute('fill') || el.getAttribute('stroke') || '';
                if (!c || c === 'none') {
                    const cs = window.getComputedStyle(el);
                    c = (cs.fill && cs.fill !== 'none') ? cs.fill : cs.stroke;
                }
                return toHex(c || '');
            };

            // 마커 판별(작은 도형만): 원 r<=6, 사각 12x12 이하, 그 외 bbox area<=400 && fill 존재
            const isSmallMarker = (el) => {
                const tag = el.tagName.toLowerCase();
                const fill = (el.getAttribute('fill') || '').toLowerCase();
                const hasFill = fill && fill !== 'none';
                try {
                    const b = el.getBBox();
                    const area = b.width * b.height;
                    if (tag === 'circle') {
                        const r = parseFloat(el.getAttribute('r') || '0');
                        return r > 0 && r <= 6 && hasFill;
                    }
                    if (tag === 'rect') {
                        const w = parseFloat(el.getAttribute('width') || '0');
                        const h = parseFloat(el.getAttribute('height') || '0');
                        return (w <= 12 && h <= 12 && w * h > 0 && hasFill);
                    }
                    // path/polygon/ellipse 등
                    return area > 0 && area <= 400 && hasFill;
                } catch { return false; }
            };

            // 요소 수집(프레임/그라디언트 제외)
            const all = Array.from(svg.querySelectorAll('path, circle, rect, polygon, polyline, ellipse, line'))
                .filter(el => !el.hasAttribute('data-frame') && !String(getColor(el)).startsWith('url('));

            // 텍스트는 맨 끝에만
            const textNodes = Array.from(svg.querySelectorAll('text'));
            textNodes.forEach(t => t.classList.add('hidden0'));

            // 그룹 컨테이너
            const grp = { black: [], red: [], green: [], purple: [] };
            const arrow = { bluePaths: [], cyanPaths: [], blueDecor: [], cyanDecor: [] }; // Decor: 화살촉/비-경로 장식
            const unknown = new Set();

            // 분류
            all.forEach(el => {
                const hex = getColor(el);
                let key = null;
                for (const k of Object.keys(COLORS)) if (COLORS[k].has(hex)) { key = k; break; }
                if (!key) { unknown.add(hex); return; }

                const tag = el.tagName.toLowerCase();
                const isPathLike = /^(path|polyline|line)$/.test(tag);

                if (key === 'blueArrow' || key === 'cyanArrow') {
                    if (isPathLike) {
                        (key === 'blueArrow' ? arrow.bluePaths : arrow.cyanPaths).push(el);
                    } else {
                        // 화살표 장식(머리모양 등)은 처음엔 숨겼다가 라인 그린 뒤 보이게
                        el.classList.add('hidden0');
                        (key === 'blueArrow' ? arrow.blueDecor : arrow.cyanDecor).push(el);
                    }
                } else {
                    // 마커 그룹은 "작은 도형"만
                    if (isSmallMarker(el)) grp[key].push(el);
                }
            });
            if (unknown.size) console.log('[wrap2] unmapped colors:', Array.from(unknown));

            // 퍼센트 텍스트
            const allTextish = Array.from(svg.querySelectorAll('text, tspan'));
            const findText = (needle) =>
                allTextish.find(n => (n.textContent || '').replace(/\s+/g, '').includes(needle.replace(/\s+/g, '')));
            const closestText = (n) => (n && n.closest && n.closest('text')) || n;
            const t62 = closestText(findText('62.40%'));
            const t1008 = closestText(findText('10.08%'));
            const t008 = closestText(findText('0.08%'));

            // 화살표 그리기 준비(꼬리→머리). marker-end는 애니 끝나고 복원
            const prepDraw = (paths, durSec = 1.5) => {
                paths.forEach(p => {
                    try {
                        const len = (typeof p.getTotalLength === 'function') ? p.getTotalLength() : 0;
                        if (len > 0) {
                            p.style.strokeDasharray = `${len}`;
                            p.style.strokeDashoffset = `${len}`;
                            p.style.setProperty('--draw-dur', `${durSec}s`);
                            p.style.setProperty('--len', `${len}`);
                            p.style.vectorEffect = 'non-scaling-stroke';
                            p.style.strokeLinecap = 'round';
                            // 화살촉 임시 비활성(있다면)
                            const me = p.getAttribute('marker-end');
                            const ms = p.getAttribute('marker-start');
                            if (me) { p.dataset.markerEnd = me; p.removeAttribute('marker-end'); }
                            if (ms) { p.dataset.markerStart = ms; p.removeAttribute('marker-start'); }

                            // 역정의 경로 지원
                            if (p.hasAttribute('data-reverse') || p.classList.contains('reverse')) {
                                p.style.strokeDashoffset = '0';
                                p.setAttribute('data-anim-reverse', '1');
                            }

                            // 애니 끝나면 화살촉 복원 + 장식 노출
                            const restore = (e) => {
                                if (e.animationName !== 'strokeDraw' && e.animationName !== 'strokeDrawRev') return;
                                if (p.dataset.markerEnd) p.setAttribute('marker-end', p.dataset.markerEnd);
                                if (p.dataset.markerStart) p.setAttribute('marker-start', p.dataset.markerStart);
                                p.removeEventListener('animationend', restore);
                            };
                            p.addEventListener('animationend', restore);
                        }
                    } catch { }
                });
            };
            const resetDraw = (paths) => {
                paths.forEach(p => {
                    p.classList.remove('draw', 'draw-r');
                    p.style.strokeDasharray = '';
                    p.style.strokeDashoffset = '';
                    p.style.removeProperty('--draw-dur');
                    p.style.removeProperty('--len');
                    // 화살촉 복구 원복
                    if (p.dataset.markerEnd) { p.setAttribute('marker-end', p.dataset.markerEnd); delete p.dataset.markerEnd; }
                    if (p.dataset.markerStart) { p.setAttribute('marker-start', p.dataset.markerStart); delete p.dataset.markerStart; }
                });
            };
            prepDraw(arrow.bluePaths, 1.5);
            prepDraw(arrow.cyanPaths, 1.2);

            // 초록/보라 ‘주르륵’
            const staggerReveal = (els, perDelay = 90) => {
                els.forEach((el, i) => {
                    el.classList.add('hidden0');
                    setTimeout(() => { el.classList.remove('hidden0'); el.classList.add('reveal'); }, i * perDelay);
                });
                return els.length * perDelay;
            };

            // 타이밍
            const D = { reveal: 500, gapSmall: 200, gapMed: 300, drawBlue: 1500, drawCyan: 1200 };

            // 반복 상태
            let timers = [];
            const clearTimers = () => { timers.forEach(id => clearTimeout(id)); timers = []; };

            const hideArr = (arr) => arr.forEach(el => { el.classList.add('hidden0'); el.classList.remove('reveal', 'emph'); });

            const resetAll = () => {
                clearTimers();
                hideArr(grp.black); hideArr(grp.red); hideArr(grp.green); hideArr(grp.purple);
                hideArr(arrow.blueDecor); hideArr(arrow.cyanDecor); // 화살표 장식도 처음엔 숨김
                textNodes.forEach(t => { t.classList.add('hidden0'); t.classList.remove('reveal', 'emph'); });
                resetDraw(arrow.bluePaths); resetDraw(arrow.cyanPaths);
                prepDraw(arrow.bluePaths, 1.5); prepDraw(arrow.cyanPaths, 1.2);
            };

            const play = () => {
                let t = 0;

                // 1) 검정 마커
                timers.push(setTimeout(() => grp.black.forEach(el => { el.classList.remove('hidden0'); el.classList.add('reveal'); }), t));
                t += D.reveal + D.gapSmall;

                // 2) 빨강 마커
                timers.push(setTimeout(() => grp.red.forEach(el => { el.classList.remove('hidden0'); el.classList.add('reveal'); }), t));
                t += D.reveal + D.gapMed;

                // 3) 파란 화살표(라인) 그리기 → 끝나면 장식 보이기
                timers.push(setTimeout(() => {
                    arrow.bluePaths.forEach(p => p.classList.add(p.hasAttribute('data-anim-reverse') ? 'draw-r' : 'draw'));
                    // 라인 드로우 끝나고 장식 노출
                    setTimeout(() => arrow.blueDecor.forEach(d => { d.classList.remove('hidden0'); d.classList.add('reveal'); }),
                        D.drawBlue);
                }, t));
                t += D.drawBlue + D.gapSmall;

                // 4) 하늘 화살표(라인) → 장식
                timers.push(setTimeout(() => {
                    arrow.cyanPaths.forEach(p => p.classList.add(p.hasAttribute('data-anim-reverse') ? 'draw-r' : 'draw'));
                    setTimeout(() => arrow.cyanDecor.forEach(d => { d.classList.remove('hidden0'); d.classList.add('reveal'); }),
                        D.drawCyan);
                }, t));
                t += D.drawCyan + D.gapMed;

                // 5) 초록 마커 ‘주르륵’
                t += staggerReveal(grp.green, 90) + D.gapSmall;

                // 6) 보라 마커 ‘주르륵’
                t += staggerReveal(grp.purple, 90) + D.gapMed;

                // 7) 텍스트: 62.40% → 10.08% & 0.08%
                if (t62) timers.push(setTimeout(() => { t62.classList.remove('hidden0'); t62.classList.add('emph'); }, t));
                t += 500;
                timers.push(setTimeout(() => {
                    if (t1008) { t1008.classList.remove('hidden0'); t1008.classList.add('reveal'); }
                    if (t008) { t008.classList.remove('hidden0'); t008.classList.add('reveal'); }
                }, t));

                // 준비 끝
                host.style.opacity = prevOpacity || '';
            };

            // 스크롤 재진입 반복
            if ('IntersectionObserver' in window) {
                let inView = false;
                const io = new IntersectionObserver(entries => {
                    entries.forEach(e => {
                        if (e.isIntersecting && !inView) {
                            inView = true; resetAll(); requestAnimationFrame(play);
                        } else if (!e.isIntersecting && inView) {
                            inView = false; resetAll(); host.style.opacity = prevOpacity || '0';
                        }
                    });
                }, { threshold: 0.25 });
                io.observe(host);
            } else {
                resetAll(); play();
            }
        })
        .catch(err => {
            console.error('[wrap2] load failed:', err);
            host.style.opacity = prevOpacity || '';
        });
})();