#!/usr/bin/env python3
"""Сборка прототипа: prototypes/src + prototypes/vendor → prototypes/index.html (один самодостаточный файл).

Запуск из корня репозитория:
  python tools/build_prototype.py          собрать
  python tools/build_prototype.py --check  проверить, что index.html собран из текущих исходников (код выхода 1 — нет)

prototypes/index.html — сгенерированный файл, руками не править: правка идёт в prototypes/src/.
Состав: токены ONE PSIM (vendor/one-psim/tokens.json → переменные --one-*, светлая и тёмная тема), шрифт Inter (base64),
слой компонентов кита bundle.css и его рантайм bundle.js, стили src/app.css, разметка src/body.html,
иконки Octicons (только используемые, из vendor/octicons/octicons-16.json), src/app.js и src/selftest.js.
Иконка в коде — ic('имя') в app.js или {{ic:имя}} в body.html; имя — из octicons-16.json без суффикса -16.
"""
import base64
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, "prototypes")
SRC, VENDOR, OUT = os.path.join(P, "src"), os.path.join(P, "vendor"), os.path.join(P, "index.html")


def read(*parts, mode="r"):
    with open(os.path.join(*parts), mode, **({} if "b" in mode else {"encoding": "utf-8"})) as f:
        return f.read()


def tokens_css():
    tok = json.loads(read(VENDOR, "one-psim", "tokens.json"))
    light, dark = [], []
    for t in tok["color"]["tokens"]:
        v = t["value"]
        if isinstance(v, dict):
            light.append(f"--{t['name']}:{v['light']}")
            dark.append(f"--{t['name']}:{v['dark']}")
        else:
            light.append(f"--{t['name']}:{v}")
    light += [f"--{t['name']}:{t['value']}" for t in tok["radius"]["tokens"]]
    for t in tok["shadow"]["tokens"]:
        light.append(f"--{t['name']}:{t['value']['light']}")
        dark.append(f"--{t['name']}:{t['value']['dark']}")
    light.append('--one-font-ui:Inter,Roboto,"Segoe UI",sans-serif')
    light.append('--one-font-mono:"Roboto Mono",Consolas,"DejaVu Sans Mono",monospace')
    font = base64.b64encode(read(VENDOR, "one-psim", "InterVariable.woff2", mode="rb")).decode()
    return (f"@font-face{{font-family:Inter;src:url(data:font/woff2;base64,{font}) format('woff2');"
            f"font-weight:100 900;font-style:normal;font-display:swap}}\n"
            f":root{{{';'.join(light)};color-scheme:light}}\n:root[data-theme=dark]{{{';'.join(dark)};color-scheme:dark}}\n")


def build():
    app_js, body, selftest = read(SRC, "app.js"), read(SRC, "body.html"), read(SRC, "selftest.js")
    catalog = json.loads(read(VENDOR, "octicons", "octicons-16.json"))
    names = set(re.findall(r"ic\('([a-z0-9-]+)'", app_js)) | set(re.findall(r"\{\{ic:([a-z0-9-]+)\}\}", body))
    missing = sorted(n for n in names if n not in catalog)
    if missing:
        sys.exit(f"Нет иконок в vendor/octicons/octicons-16.json: {', '.join(missing)}")
    icons = {n: catalog[n] for n in sorted(names)}
    body = re.sub(r"\{\{ic:([a-z0-9-]+)\}\}",
                  lambda m: f'<svg class="ic ic-18" viewBox="0 0 16 16" aria-hidden="true">{icons[m.group(1)]}</svg>', body)
    return f'''<!doctype html>
<html lang="ru" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LPR · прототип интерфейса — Интеллект X</title>
<!-- Сгенерировано tools/build_prototype.py из prototypes/src и prototypes/vendor — руками не править.
     Прототип по ТЗ «LicensePlateRecognition для ПК Интеллект X». Стиль — ONE PSIM Prototype Kit, иконки — Octicons (MIT).
     Самопроверка: index.html?selftest -->
<style>{tokens_css()}</style>
<style>{read(VENDOR, "one-psim", "bundle.css")}</style>
<style>{read(SRC, "app.css")}</style>
</head>
<body>
{body}
<script>{read(VENDOR, "one-psim", "bundle.js")}</script>
<script>const ICONS={json.dumps(icons, ensure_ascii=False)};</script>
<script>{app_js}</script>
<script>{selftest}</script>
</body>
</html>
'''


def main():
    html = build()
    if "--check" in sys.argv:
        current = read(OUT) if os.path.exists(OUT) else ""
        if current != html:
            print("prototypes/index.html не совпадает с исходниками: python tools/build_prototype.py")
            return 1
        print("prototypes/index.html собран из текущих исходников")
        return 0
    with open(OUT, "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    print(f"prototypes/index.html — {len(html.encode()) // 1024} КБ")
    return 0


if __name__ == "__main__":
    sys.exit(main())
