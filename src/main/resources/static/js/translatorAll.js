/**
 * translatorAll.js — Chrome Translator API로 페이지 전체 번역
 * - 원문 언어: 한국어(ko)
 * - KOR / ENG / JPN 클릭 시 전체 번역
 * - 제외: data-trans="off"
 * - Chrome 데스크톱에서만 동작. 미지원 시 원문 유지
 */

/* 파일 로드 확인용 */
console.log('[translatorAll] 파일 로드됨');

(() => {
    const STORAGE_KEY = 'site.lang';
    const DEFAULT_LANG = 'ko';
    const LABEL_TO_CODE = { KOR: 'ko', ENG: 'en', JPN: 'ja' };
    const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'alt'];

    const TEXT_ORIG = new WeakMap();
    const ATTR_ORIG = new WeakMap();
    let snapshotted = false;

    const getLang = () => localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
    const setLang = (lang) => localStorage.setItem(STORAGE_KEY, lang);

    /** 번역 제외 조건 */
    function isExcluded(node) {
        if (!node) return true;
        if (node.nodeType === Node.TEXT_NODE) {
            const p = node.parentElement;
            if (!p) return true;
            if (p.closest('[data-trans="off"]')) return true;
            const tag = p.tagName?.toLowerCase();
            if (/^(script|style|noscript|code|pre|textarea|input)$/i.test(tag)) return true;
            if (!node.nodeValue || !node.nodeValue.trim()) return true;
            return false;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node;
            if (el.closest('[data-trans="off"]')) return true;
            if (/^(script|style|noscript)$/i.test(el.tagName)) return true;
            return false;
        }
        return true;
    }

    /** 텍스트 노드 수집 */
    function collectTextNodes(root = document.body) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                return isExcluded(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        const out = [];
        let cur;
        while ((cur = walker.nextNode())) out.push(cur);
        return out;
    }

    /** 번역 대상 속성 수집 */
    function collectAttrTargets(root = document.body) {
        const els = Array.from(root.querySelectorAll('*')).filter(el => !isExcluded(el));
        const targets = [];
        for (const el of els) {
            const map = {};
            for (const k of ATTRS_TO_TRANSLATE) {
                if (el.hasAttribute(k)) {
                    const v = el.getAttribute(k);
                    if (v && v.trim()) map[k] = v;
                }
            }
            if (Object.keys(map).length) targets.push([el, map]);
        }
        return targets;
    }

    /** 원문 저장 */
    function snapshotOnce() {
        if (snapshotted) return;
        snapshotted = true;
        for (const tn of collectTextNodes()) {
            if (!TEXT_ORIG.has(tn)) TEXT_ORIG.set(tn, tn.nodeValue);
        }
        for (const [el, obj] of collectAttrTargets()) {
            if (!ATTR_ORIG.has(el)) ATTR_ORIG.set(el, obj);
        }
    }

    /** 원문 복원 */
    function restoreOriginal() {
        for (const tn of collectTextNodes()) {
            const orig = TEXT_ORIG.get(tn);
            if (orig != null) tn.nodeValue = orig;
        }
        for (const [el] of collectAttrTargets()) {
            const origs = ATTR_ORIG.get(el);
            if (origs) for (const [k, v] of Object.entries(origs)) el.setAttribute(k, v);
        }
        document.documentElement.setAttribute('lang', DEFAULT_LANG);
    }

    /** Translator 인스턴스 */
    async function getTranslator(target) {
        if (!('Translator' in self)) return null;
        try {
            await Translator.availability({ sourceLanguage: DEFAULT_LANG, targetLanguage: target });
            return await Translator.create({
                sourceLanguage: DEFAULT_LANG,
                targetLanguage: target,
            });
        } catch {
            return null;
        }
    }

    /** 전체 번역 */
    async function translateAll(target) {
        console.log('[translatorAll] 번역 요청:', target);
        snapshotOnce();

        if (target === DEFAULT_LANG) {
            restoreOriginal();
            return;
        }

        const translator = await getTranslator(target);
        if (!translator) {
            console.warn('[translatorAll] Translator API 미지원, 원문 유지');
            restoreOriginal();
            return;
        }

        // 텍스트
        const textNodes = collectTextNodes();
        const chunk = 100;
        for (let i = 0; i < textNodes.length; i += chunk) {
            const part = textNodes.slice(i, i + chunk);
            await Promise.all(part.map(async tn => {
                const base = TEXT_ORIG.get(tn) ?? tn.nodeValue ?? '';
                TEXT_ORIG.set(tn, base);
                try { tn.nodeValue = await translator.translate(base); } catch {}
            }));
        }

        // 속성
        for (const [el, obj] of collectAttrTargets()) {
            const origs = ATTR_ORIG.get(el) ?? obj;
            ATTR_ORIG.set(el, origs);
            for (const [k, v] of Object.entries(origs)) {
                try { el.setAttribute(k, await translator.translate(v)); } catch {}
            }
        }

        document.documentElement.setAttribute('lang', target);
    }

    /** 메뉴 클릭 이벤트 위임 및 서브메뉴 토글 기능 추가 */
    function bindHeaderMenu() {
        console.log('[translatorAll] 메뉴 이벤트 바인딩');

        // 서브메뉴를 토글하는 기능 추가
        const langToggle = document.getElementById('langToggle');
        const submenuWrapper = document.getElementById('submenu_lang_wrapper');

        if (langToggle && submenuWrapper) {
            langToggle.addEventListener('click', (e) => {
                // 서브메뉴 내부 클릭 시 이벤트 버블링 방지
                if (submenuWrapper.contains(e.target)) {
                    return;
                }
                e.stopPropagation(); // 이벤트 전파 방지
                submenuWrapper.classList.toggle('active');
            });

            // 문서의 다른 부분을 클릭하면 서브메뉴 닫기
            document.addEventListener('click', (e) => {
                if (!langToggle.contains(e.target)) {
                    submenuWrapper.classList.remove('active');
                }
            });
        }

        // 언어 선택 아이템 클릭 시 번역
        document.addEventListener('click', async (e) => {
            const item = e.target.closest('#submenu_lang .lang_item');
            if (!item) return;

            const label = item.textContent.trim();
            const lang = LABEL_TO_CODE[label] || DEFAULT_LANG;
            console.log('[translatorAll] 클릭됨:', label, '->', lang);

            setLang(lang);
            await translateAll(lang);
            submenuWrapper.classList.remove('active'); // 번역 후 서브메뉴 닫기
        });
    }

    /** DOM 변화 감지 (동적 컨텐츠 번역) */
    function bindObserver() {
        const mo = new MutationObserver(async muts => {
            const lang = getLang();
            if (lang === DEFAULT_LANG) return;
            const translator = await getTranslator(lang);
            if (!translator) return;

            muts.forEach(m => {
                m.addedNodes?.forEach(async node => {
                    if (!(node instanceof Element)) return;
                    for (const tn of collectTextNodes(node)) {
                        const base = tn.nodeValue ?? '';
                        if (!TEXT_ORIG.has(tn)) TEXT_ORIG.set(tn, base);
                        try { tn.nodeValue = await translator.translate(base); } catch {}
                    }
                    for (const [el, obj] of collectAttrTargets(node)) {
                        const origs = ATTR_ORIG.get(el) ?? obj;
                        ATTR_ORIG.set(el, origs);
                        for (const [k, v] of Object.entries(origs)) {
                            try { el.setAttribute(k, await translator.translate(v)); } catch {}
                        }
                    }
                });
            });
        });

        mo.observe(document.body, { childList: true, subtree: true });
    }

    document.addEventListener('DOMContentLoaded', async () => {
        console.log('[translatorAll] 스크립트 로드됨');
        bindHeaderMenu();
        bindObserver();
        await translateAll(getLang());
    });

    // 전역 테스트용
    window.translateAll = translateAll;
})();