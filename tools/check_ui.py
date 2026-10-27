#!/usr/bin/env python3
"""Проверка экрана прототипа: каждый экран × тема (светлая, тёмная) × ширина (1440, 360 px).

Запуск из корня репозитория: python tools/check_ui.py [--shots <папка>]
Нужен Playwright для Python (pip install playwright; python -m playwright install chromium).
Ищет:
  - ошибки JS на странице;
  - горизонтальную прокрутку страницы (что-то вышло за край экрана);
  - кнопки и ссылки без текста и без aria-label;
  - контраст текста ниже 4,5:1 к фону под ним. «ИЗВЕСТНО», не находка — так задано в дизайн-системе ONE PSIM
    (заметки к токенам в prototypes/vendor/one-psim/tokens.json): текст цветом --one-fg-subtle и --one-fg-placeholder,
    белый текст на --one-palette-green, -orange, -amber.
С --shots сохраняет снимки <экран>-<тема>-<ширина>.png — их смотреть глазами: порядок, выравнивание, обрезанный текст
проверка не меряет. Снимки — во временную папку, не в репозиторий.
Код выхода 1, если есть строки FAIL.
"""
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ROUTES = ["kpp", "alerts", "territory", "journal", "inv", "reports", "violations", "lists", "channels"]

PROBE = r"""
() => {
  const out = {overflow: document.documentElement.scrollWidth - innerWidth, empty: [], contrast: []};
  const css = getComputedStyle(document.documentElement);
  const tok = v => css.getPropertyValue(v).trim().toLowerCase();
  const known = ['--one-fg-subtle', '--one-fg-placeholder'].map(tok);
  const paletteBg = ['--one-palette-green', '--one-palette-orange', '--one-palette-amber'].map(tok);
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const hex = c => '#' + c.slice(0, 3).map(x => Math.round(x).toString(16).padStart(2, '0')).join('');
  const lum = c => { const a = c.slice(0, 3).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 });
    return .2126 * a[0] + .7152 * a[1] + .0722 * a[2] };
  const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('[hidden],dialog:not([open]),.sheet:not([data-open])') };
  const name = el => (el.id ? '#' + el.id : '') + '.' + [...el.classList].slice(0, 2).join('.') + ' «' + el.textContent.trim().slice(0, 30) + '»';
  for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
    if (!visible(el)) continue;
    if (!el.textContent.trim() && !el.getAttribute('aria-label') && !el.getAttribute('title')) out.empty.push(name(el));
  }
  const bgOf = el => { for (let e = el; e; e = e.parentElement) { const s = getComputedStyle(e);
      if (s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('url')) return null;
      const c = rgb(s.backgroundColor); if (c.length && (c.length < 4 || c[3] > .5)) return c; }
    return rgb(getComputedStyle(document.body).backgroundColor) };
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg,#selftest-log,.tip') || !visible(el)) continue;
    const own = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!own || el.closest(':disabled,[aria-disabled=true]')) continue;
    const s = getComputedStyle(el); const fg = rgb(s.color), bg = bgOf(el);
    if (!bg || (fg.length > 3 && fg[3] < 1)) continue;
    const r = (Math.max(lum(fg), lum(bg)) + .05) / (Math.min(lum(fg), lum(bg)) + .05);
    const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
    if (r >= (big ? 3 : 4.5)) continue;
    const key = hex(fg) + hex(bg) + el.className;
    if (seen.has(key)) continue; seen.add(key);
    out.contrast.push({el: name(el), ratio: Math.round(r * 100) / 100, fg: hex(fg), bg: hex(bg), known: known.includes(hex(fg)) || (paletteBg.includes(hex(bg)) && hex(fg) === tok('--one-accent-on'))});
  }
  return out;
}
"""


def main():
    shots = None
    if "--shots" in sys.argv:
        shots = pathlib.Path(sys.argv[sys.argv.index("--shots") + 1])
        shots.mkdir(parents=True, exist_ok=True)
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Нет Playwright для Python: pip install playwright; python -m playwright install chromium")
        return 2
    url = (ROOT / "prototypes" / "index.html").as_uri()
    fails = known = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in (1440, 360):
            for theme in ("light", "dark"):
                page = browser.new_page(viewport={"width": width, "height": 900})
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(url)
                page.evaluate("t => { document.documentElement.setAttribute('data-theme', t); document.getElementById('pp-sim').checked = false }", theme)
                for route in ROUTES:
                    page.evaluate("r => location.hash = '#' + r", route)
                    page.wait_for_timeout(150)
                    res = page.evaluate(PROBE)
                    where = f"{route} · {theme} · {width}"
                    if res["overflow"] > 1:
                        fails += 1
                        print(f"FAIL {where}: страница шире экрана на {res['overflow']} px")
                    for e in res["empty"]:
                        fails += 1
                        print(f"FAIL {where}: кнопка без текста и aria-label — {e}")
                    for c in res["contrast"]:
                        tag = "ИЗВЕСТНО" if c["known"] else "FAIL"
                        known += c["known"]
                        fails += not c["known"]
                        print(f"{tag} {where}: контраст {c['ratio']}:1 ({c['fg']} на {c['bg']}) — {c['el']}")
                    if shots:
                        page.screenshot(path=str(shots / f"{route}-{theme}-{width}.png"), full_page=True)
                for e in errors:
                    fails += 1
                    print(f"FAIL {theme} · {width}: ошибка JS — {e}")
                page.close()
        browser.close()
    print(f"Экранов: {len(ROUTES) * 4}. FAIL: {fails}, ИЗВЕСТНО: {known}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
