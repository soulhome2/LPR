#!/usr/bin/env python3
"""Самопроверка прототипа в headless-браузере: открывает prototypes/index.html?selftest и печатает отчёт.

Запуск из корня репозитория: python tools/run_selftest.py [путь к index.html]
Нужен Playwright для Python (pip install playwright; python -m playwright install chromium).
Без Playwright — то же руками: google-chrome (msedge на Windows) --headless=new --disable-gpu --no-first-run
  --user-data-dir=<временная папка> --virtual-time-budget=60000 --dump-dom "file:///…/prototypes/index.html?selftest"
итог — атрибут data-selftest="pass|fail" у <html>, отчёт — <pre id="selftest-log">.
Или открыть index.html?selftest в браузере: отчёт появится в правом нижнем углу.
Код выхода 1, если шаг упал или на странице была ошибка JS.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def main():
    page_path = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "prototypes" / "index.html"
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Нет Playwright для Python — запустите вручную, см. описание в начале скрипта")
        return 2
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(page_path.as_uri() + "?selftest")
        page.wait_for_selector("html[data-selftest]", timeout=120000)
        result = page.get_attribute("html", "data-selftest")
        print(page.text_content("#selftest-log"))
        browser.close()
    for e in errors:
        print("Ошибка JS:", e)
    return 0 if result == "pass" and not errors else 1


if __name__ == "__main__":
    sys.exit(main())
