"""Operator commands: python -m app.cli <command>."""
import argparse
import json
import sys

from .core.real_data import problems
from .db import SessionLocal
from .migrate import upgrade
from .seed import seed
from .seed.workspace_demo import remove_demo, seed_demo
from .services.backup import export_archive, import_archive


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="python -m app.cli")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("migrate", help="apply all database migrations")
    sub.add_parser("seed-demo", help="load the labelled fictional workspace (prints a generated password once)")
    sub.add_parser("remove-demo", help="remove the demonstration matters and accounts")
    ex = sub.add_parser("export", help="write a logical backup")
    ex.add_argument("file")
    im = sub.add_parser("import", help="restore a logical backup into an EMPTY database")
    im.add_argument("file")
    sub.add_parser("check-real-data", help="list what blocks turning on real client data")
    args = ap.parse_args(argv)

    if args.cmd == "migrate":
        upgrade()
        with SessionLocal() as db:
            seed(db)
        print("Migrations applied.")
    elif args.cmd == "seed-demo":
        with SessionLocal() as db:
            out = seed_demo(db)
        print("Demonstration accounts:", ", ".join(out["emails"]))
        print("Password (shown once):", out["password"])
    elif args.cmd == "remove-demo":
        with SessionLocal() as db:
            print(remove_demo(db))
    elif args.cmd == "export":
        with SessionLocal() as db:
            data = export_archive(db)
        with open(args.file, "w", encoding="utf-8") as f:
            json.dump(data, f)
        print("Exported", {k: len(v) for k, v in data["tables"].items()})
    elif args.cmd == "import":
        with open(args.file, encoding="utf-8") as f:
            data = json.load(f)
        with SessionLocal() as db:
            print("Imported", import_archive(db, data))
    elif args.cmd == "check-real-data":
        found = problems()
        for p in found:
            print(" -", p)
        print("OK: all safeguards present." if not found else "NOT READY: real client data must not be enabled.")
        return 1 if found else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
