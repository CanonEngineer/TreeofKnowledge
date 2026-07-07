#!/usr/bin/env python3
"""Gera js/data/projects.js com árvores expandidas."""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "js", "data", "projects.js")
DATA = os.path.join(ROOT, "scripts", "projects-data.json")
CPE_FILE = os.path.join(ROOT, "scripts", "cpe-project.json")
VEYON_FILE = os.path.join(ROOT, "scripts", "veyon-project.json")
DROPBOX_FILE = os.path.join(ROOT, "scripts", "dropbox-project.json")
RESTAURANT_FILE = os.path.join(ROOT, "scripts", "restaurant-project.json")
FILL_SCRIPT = os.path.join(ROOT, "scripts", "fill-full-code.py")


def main():
  if "--no-fill" not in sys.argv:
    subprocess.run([sys.executable, FILL_SCRIPT], check=True)

  with open(CPE_FILE, encoding="utf-8") as f:
    cpe = json.load(f)
  with open(DATA, encoding="utf-8") as f:
    others = [p for p in json.load(f) if p.get("slug") not in ("customize-veyon", "javascript-dropbox")]
  with open(VEYON_FILE, encoding="utf-8") as f:
    veyon = json.load(f)
  with open(DROPBOX_FILE, encoding="utf-8") as f:
    dropbox = json.load(f)
  with open(RESTAURANT_FILE, encoding="utf-8") as f:
    restaurant = json.load(f)
  projects = [cpe] + others[:1] + [dropbox, restaurant] + others[1:] + [veyon]
  js = "/* Árvore do Conhecimento — " + str(sum(len(p["nodes"]) for p in projects)) + " nós */\nconst PROJECTS = "
  js += json.dumps(projects, ensure_ascii=False, indent=2) + ";\n"
  with open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
  for p in projects:
    print(f"  {p['name']}: {len(p['nodes'])} nós")
  print(f"Total: {sum(len(p['nodes']) for p in projects)} nós -> {OUT}")


if __name__ == "__main__":
  main()
