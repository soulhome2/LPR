#!/usr/bin/env python3
"""Трассировка ФТ → ТЗ → прототип.

Запуск из корня репозитория: python tools/check_trace.py
Проверяет:
  1. каждый пункт ФТ (N.M из .docx) упомянут в ТЗ — в колонке «ФТ» таблиц требований или в Приложении А;
  2. идентификаторы требований ТЗ (LPR-*, NFR-*, SEC-*, UI-*) определены один раз;
  3. каждый идентификатор, на который ссылаются ТЗ, README, ревью, скилы и самопроверка прототипа, определён в ТЗ
     (диапазоны «LPR-SRC-08…13» разворачиваются);
  4. колонка «ФТ» у требования ссылается на существующий пункт ФТ;
  5. Приложение А согласовано с таблицами: пара «ФТ x.y → требование» есть в колонке «ФТ» этого требования.
Код выхода 1, если есть расхождения.
"""
import glob
import os
import re
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPEC = os.path.join(ROOT, "Specification")
FT = glob.glob(os.path.join(SPEC, "ФТ_*.docx"))
TZ = glob.glob(os.path.join(SPEC, "ТЗ_*.md"))
ID = r"(?:LPR-[A-Z]{2,4}-\d{2}|NFR-[A-Z]-\d{2}|SEC-\d{2}|UI-\d{2})"
FT_NUM = r"\d{1,2}\.\d{1,2}"


def ft_items(path):
    xml = zipfile.ZipFile(path).read("word/document.xml").decode("utf-8")
    paras = [re.sub(r"<[^>]+>", "", p) for p in re.findall(r"<w:p[ >].*?</w:p>", xml, re.S)]
    return [m.group(1) for m in (re.match(rf"^\s*({FT_NUM})\b", p) for p in paras) if m]


def expand(text):
    """«LPR-SRC-08…13» и «LPR-ALR-04, 05» → полный список идентификаторов."""
    out = []
    for m in re.finditer(rf"({ID})((?:\s*(?:…|\.\.\.|–|-)\s*\d{{2}}|,\s*\d{{2}}\b)*)", text):
        base = m.group(1)
        out.append(base)
        prefix, num = base.rsplit("-", 1)
        for kind, n in re.findall(r"(…|\.\.\.|–|-|,)\s*(\d{2})", m.group(2)):
            if kind == ",":
                out.append(f"{prefix}-{n}")
            else:
                out += [f"{prefix}-{i:02d}" for i in range(int(num) + 1, int(n) + 1)]
            num = n
    return out


def expand_ft(text):
    """«4.1–4.3», «8.4–8.9», «1.8» → список пунктов ФТ."""
    out = []
    for a, b in re.findall(rf"({FT_NUM})(?:\s*[–-]\s*({FT_NUM}))?", text):
        if b:
            s, x = a.split(".")
            _, y = b.split(".")
            out += [f"{s}.{i}" for i in range(int(x), int(y) + 1)]
        else:
            out.append(a)
    return out


def main():
    problems = []
    if len(FT) != 1 or len(TZ) != 1:
        print(f"Ожидается один ФТ_*.docx и один ТЗ_*.md в Specification/: ФТ {len(FT)}, ТЗ {len(TZ)}")
        return 1
    items = ft_items(FT[0])
    with open(TZ[0], encoding="utf-8") as f:
        tz = f.read()
    tz_rel = os.path.relpath(TZ[0], ROOT)
    line = lambda pos: tz.count("\n", 0, pos) + 1

    # 2. Определения: первая колонка строки таблицы или «- **ID.**» в списке
    defined, ft_of = {}, {}
    for m in re.finditer(rf"^\| ({ID}) \|(.*)$", tz, re.M):
        cells = [c.strip() for c in m.group(2).split("|")]
        if m.group(1) in defined:
            problems.append(f"{tz_rel}:{line(m.start())}: {m.group(1)} определён повторно (первый раз — строка {defined[m.group(1)]})")
        defined[m.group(1)] = line(m.start())
        ft_cell = cells[-2] if len(cells) >= 2 else ""
        ft_of[m.group(1)] = set(expand_ft(ft_cell)) if re.search(FT_NUM, ft_cell) else set()
        # 4. колонка ФТ — существующий пункт
        for x in ft_of[m.group(1)]:
            if x not in items:
                problems.append(f"{tz_rel}:{line(m.start())}: {m.group(1)} ссылается на ФТ {x} — такого пункта нет")
    for m in re.finditer(rf"^- \*\*({ID})\.?\*\*", tz, re.M):
        if m.group(1) in defined:
            problems.append(f"{tz_rel}:{line(m.start())}: {m.group(1)} определён повторно")
        defined[m.group(1)] = line(m.start())
        ft_of.setdefault(m.group(1), set())

    # 5 и 1. Приложение А
    appendix = tz[tz.find("## Приложение А"):]
    covered = set()
    for row in re.findall(r"^\|(.+)\|$", appendix, re.M):
        cells = [c.strip() for c in row.split("|")]
        for ft_cell, req_cell in zip(cells[0::2], cells[1::2]):
            if not re.match(FT_NUM, ft_cell):
                continue
            fts, reqs = expand_ft(ft_cell), expand(req_cell)
            covered.update(fts)
            for r in reqs:
                if r in ft_of and ft_of[r] and not (ft_of[r] & set(fts)):
                    problems.append(f"{tz_rel}: Приложение А: ФТ {ft_cell} → {r}, а в таблице у {r} колонка «ФТ» — {', '.join(sorted(ft_of[r]))}")
    for x in ft_of.values():
        covered |= x
    covered |= set(re.findall(rf"← ФТ ({FT_NUM})", tz))
    for x in items:
        if x not in covered:
            problems.append(f"{tz_rel}: пункт ФТ {x} не упомянут в ТЗ — ни в таблицах требований, ни в Приложении А")

    # 3. Ссылки на идентификаторы
    sources = [TZ[0], os.path.join(ROOT, "README.md"), os.path.join(ROOT, "CLAUDE.md"),
               os.path.join(ROOT, "prototypes", "src", "selftest.js"), os.path.join(ROOT, "prototypes", "src", "app.js")]
    sources += glob.glob(os.path.join(ROOT, "reviews", "*", "*.md"))
    sources += glob.glob(os.path.join(ROOT, ".claude", "skills", "*", "*.md"))
    for path in sources:
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            text = f.read()
        for ref in set(expand(text)):
            if ref not in defined and not re.match(r"(LPR|NFR|SEC|UI)-(XXX|NN|\w)-?NN", ref):
                pos = text.find(ref) if ref in text else text.find(ref.rsplit("-", 1)[0])
                problems.append(f"{os.path.relpath(path, ROOT)}:{text.count(chr(10), 0, max(pos, 0)) + 1}: {ref} — нет в ТЗ")

    for p in problems:
        print(p)
    print(f"Пунктов ФТ: {len(items)}, требований ТЗ: {len(defined)}. Расхождений: {len(problems)}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
