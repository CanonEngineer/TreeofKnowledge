#!/usr/bin/env python3
"""Gera scripts/adminusermanagement-project.json a partir do repo AdminUserManagement."""
import json
import os
import re

BAT_ROOT = os.environ.get(
    "ADMIN_USER_MGMT_ROOT",
    os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "..", "bat")),
)
OUT = os.path.join(os.path.dirname(__file__), "adminusermanagement-project.json")
SLUG = "admin-user-management"

FILES = [
    ("SetAdmUser/set_adm_user.bat", "SetAdmUser", "set_adm_user.bat"),
    ("SetAdmUser/Set-AdmUser.ps1", "SetAdmUser", "Set-AdmUser.ps1"),
    ("SetAdmUser/Install-SetAdmUser.ps1", "SetAdmUser", "Install-SetAdmUser.ps1"),
    ("SetAdmUser/GPO-Startup-SetAdmUser.ps1", "SetAdmUser", "GPO-Startup-SetAdmUser.ps1"),
    ("SetAdmUser/GPO-Startup-SetAdmUser.bat", "SetAdmUser", "GPO-Startup-SetAdmUser.bat"),
    ("SetAdmUser-Env/Get-SetAdmUserConfig.ps1", "SetAdmUser-Env", "Get-SetAdmUserConfig.ps1"),
    ("SetAdmUser-Env/Set-AdmUser.ps1", "SetAdmUser-Env", "Set-AdmUser.ps1"),
    ("SetAdmUser-Env/Install-SetAdmUser.ps1", "SetAdmUser-Env", "Install-SetAdmUser.ps1"),
    ("SetAdmUser-Env/GPO-Startup-SetAdmUser.ps1", "SetAdmUser-Env", "GPO-Startup-SetAdmUser.ps1"),
    ("SetAdmUser-Env/Set-SetAdmUserEnv.ps1", "SetAdmUser-Env", "Set-SetAdmUserEnv.ps1"),
    ("SetAdmUser-Env/set_adm_user.bat", "SetAdmUser-Env", "set_adm_user.bat"),
]

FUNCTIONS = [
    ("SetAdmUser/Set-AdmUser.ps1", "Get-ProtectedPassword", "SetAdmUser/Set-AdmUser.ps1"),
    ("SetAdmUser/Set-AdmUser.ps1", "Set-LocalAdminUser", "SetAdmUser/Set-AdmUser.ps1"),
    ("SetAdmUser/Set-AdmUser.ps1", "Disable-BuiltInAdministrator", "SetAdmUser/Set-AdmUser.ps1"),
    ("SetAdmUser/Install-SetAdmUser.ps1", "Save-ProtectedPassword", "SetAdmUser/Install-SetAdmUser.ps1"),
    ("SetAdmUser-Env/Get-SetAdmUserConfig.ps1", "Get-SetAdmUserConfig", "SetAdmUser-Env/Get-SetAdmUserConfig.ps1"),
    ("SetAdmUser-Env/Get-SetAdmUserConfig.ps1", "Get-SetAdmUserPasswordFromEnv", "SetAdmUser-Env/Get-SetAdmUserConfig.ps1"),
]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def read_file(rel):
    path = os.path.join(BAT_ROOT, rel.replace("/", os.sep))
    with open(path, encoding="utf-8") as f:
        return f.read()


def extract_function(full, name):
    pat = rf"(?ms)^function\s+{re.escape(name)}\s*\{{.*?^\}}"
    m = re.search(pat, full)
    return m.group(0) if m else f"# function {name}() — ver arquivo completo"


def nid(*parts):
    return slug(SLUG + "-" + "-".join(parts))


def main():
    readme_path = os.path.join(BAT_ROOT, "README.md")
    with open(readme_path, encoding="utf-8") as f:
        readme = f.read()[:4000]

    nodes = [
        {
            "id": nid("root"),
            "parent": None,
            "layer": "root",
            "title": "AdminUserManagement",
            "description": "Gestão segura de admin local via GPO: DPAPI + PowerShell + AD.",
            "file": "README.md",
            "code": readme,
            "implementation": [
                "Repo: https://github.com/CanonEngineer/AdminUserManagement",
                "Versões: SetAdmUser + SetAdmUser-Env",
                "2D + Galaxy 3D na Tree of Knowledge",
            ],
        }
    ]

    for mod in ("SetAdmUser", "SetAdmUser-Env"):
        mod_id = nid("dir", mod)
        nodes.append(
            {
                "id": mod_id,
                "parent": nid("root"),
                "layer": "module",
                "title": mod + "/",
                "description": f"Módulo `{mod}/` — {'config fixa' if mod == 'SetAdmUser' else 'variáveis de ambiente GPO'}.",
                "file": mod + "/",
                "code": f"# Diretório: {mod}/\n",
                "implementation": [f"path: {mod}/", "nó de agrupamento"],
            }
        )

    file_ids = {}
    for rel, mod, title in FILES:
        fid = nid("file", mod, title)
        parent = nid("dir", mod)
        file_ids[rel] = fid
        try:
            code = read_file(rel)
        except OSError:
            continue
        nodes.append(
            {
                "id": fid,
                "parent": parent,
                "layer": "file",
                "title": title,
                "description": f"Código-fonte: `{rel}`",
                "file": rel.replace("\\", "/"),
                "code": code,
                "implementation": [
                    f"path: {rel}",
                    "GitHub: https://github.com/CanonEngineer/AdminUserManagement/blob/main/" + rel.replace("\\", "/"),
                ],
            }
        )

    for rel, func, _ in FUNCTIONS:
        parent = file_ids.get(rel)
        if not parent:
            continue
        try:
            full = read_file(rel)
        except OSError:
            continue
        code = extract_function(full, func)
        nodes.append(
            {
                "id": nid("fn", func),
                "parent": parent,
                "layer": "function",
                "title": func + "()",
                "description": f"Função `{func}` em `{rel}`",
                "file": rel.replace("\\", "/"),
                "code": code,
                "implementation": [
                    f"Arquivo: {rel}",
                    f"Função: {func}",
                ],
            }
        )

    project = {
        "slug": SLUG,
        "name": "AdminUserManagement",
        "repoUrl": "https://github.com/CanonEngineer/AdminUserManagement",
        "color": "#7c3aed",
        "icon": "shield",
        "stack": "PowerShell 5.1 + GPO + DPAPI + AD",
        "summary": f"Cobertura: {len(FILES)} arquivos principais ({len(nodes)} nós na árvore).",
        "nodes": nodes,
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(project, f, ensure_ascii=False, indent=2)

    print(f"Gerado {OUT} — {len(nodes)} nós")


if __name__ == "__main__":
    main()
