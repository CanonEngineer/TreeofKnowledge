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
CANONSYNC_FILE = os.path.join(ROOT, "scripts", "canonsyncengine-project.json")
EXTRA_FILE = os.path.join(ROOT, "scripts", "extra-projects.json")
DANGERZONE_FILE = os.path.join(ROOT, "scripts", "dangerzone-project.json")
SMARTHOME_FILE = os.path.join(ROOT, "scripts", "smarthome-project.json")
SMARTFERRARI_FILE = os.path.join(ROOT, "scripts", "smartferrari-project.json")
SENTINELAI_FILE = os.path.join(ROOT, "scripts", "sentinelai-project.json")
EAGLE_FILE = os.path.join(ROOT, "scripts", "eagle-project.json")
ADMIN_USER_MGMT_FILE = os.path.join(ROOT, "scripts", "adminusermanagement-project.json")
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
  with open(CANONSYNC_FILE, encoding="utf-8") as f:
    canonsync = json.load(f)
  extras = []
  if os.path.isfile(EXTRA_FILE):
    with open(EXTRA_FILE, encoding="utf-8") as f:
      extras = json.load(f)
  dangerzone = []
  if os.path.isfile(DANGERZONE_FILE):
    with open(DANGERZONE_FILE, encoding="utf-8") as f:
      dangerzone = [json.load(f)]
  smarthome = []
  if os.path.isfile(SMARTHOME_FILE):
    with open(SMARTHOME_FILE, encoding="utf-8") as f:
      smarthome = [json.load(f)]
  smartferrari = []
  if os.path.isfile(SMARTFERRARI_FILE):
    with open(SMARTFERRARI_FILE, encoding="utf-8") as f:
      smartferrari = [json.load(f)]
  sentinelai = []
  if os.path.isfile(SENTINELAI_FILE):
    with open(SENTINELAI_FILE, encoding="utf-8") as f:
      sentinelai = [json.load(f)]
  eagle = []
  if os.path.isfile(EAGLE_FILE):
    with open(EAGLE_FILE, encoding="utf-8") as f:
      eagle = [json.load(f)]
  admin_user = []
  if os.path.isfile(ADMIN_USER_MGMT_FILE):
    with open(ADMIN_USER_MGMT_FILE, encoding="utf-8") as f:
      admin_user = [json.load(f)]
  projects = [cpe] + others[:1] + [dropbox, restaurant] + others[1:] + [veyon] + extras + dangerzone + smarthome + smartferrari + [canonsync] + sentinelai + eagle + admin_user
  js = "/* Árvore do Conhecimento — " + str(sum(len(p["nodes"]) for p in projects)) + " nós */\nconst PROJECTS = "
  js += json.dumps(projects, ensure_ascii=False, indent=2) + ";\n"
  with open(OUT, "w", encoding="utf-8") as f:
    f.write(js)
  for p in projects:
    print(f"  {p['name']}: {len(p['nodes'])} nós")
  print(f"Total: {sum(len(p['nodes']) for p in projects)} nós -> {OUT}")


if __name__ == "__main__":
  main()
