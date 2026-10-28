"""The only extension point for assistant, research and mapping output (research D2).

`DemoProvider` returns clearly labelled demonstration content and makes NO network call. Connecting a real AI service
means writing a new provider AND a new specification: it would send advocates' text to a third party, which needs a
data-protection review under constitution Principle V. Nothing in this module may invent authorities or statutory
mappings; where nothing is found it says so in the fixed words below.
"""
from typing import Protocol

NOTHING_FOUND = "Nothing found in the sources searched."
DEMO_NOTE = "Demonstration content: this is not legal advice and was not produced from real sources."

# Fictional authorities, so the demonstration can show a result with sources. They are labelled fictional.
_DEMO_INDEX = [
    ("Fictional Authority A v. Fictional Authority B (demo)", ["bail", "surety", "bond"]),
    ("Demonstration Statute, section 1 (demo)", ["limitation", "deadline", "filing"]),
    ("Sample Practice Note 7 (demo)", ["vakalatnama", "appearance", "memo"]),
]


class DraftProvider(Protocol):
    def reply(self, history: list[str]) -> tuple[str, list[dict]]: ...
    def research(self, query: str) -> tuple[str, list[dict]]: ...
    def mapping(self, query: str) -> tuple[str, list[dict]]: ...


class DemoProvider:
    is_demo = True
    name = "demo_provider"

    def reply(self, history: list[str]) -> tuple[str, list[dict]]:
        return (f"{DEMO_NOTE}\n\nThis is a placeholder answer. A real assistant is not connected, so nothing here "
                "should be relied on. Please verify any point against authoritative sources."), []

    def research(self, query: str) -> tuple[str, list[dict]]:
        terms = [t for t in query.lower().split() if len(t) > 2]
        hits = [{"label": label, "reference": "Fictional demonstration source"} for label, keys in _DEMO_INDEX
                if any(t in keys for t in terms)]
        if not hits:
            return NOTHING_FOUND, []
        return f"{DEMO_NOTE}\n\nThe demonstration index lists {len(hits)} fictional item(s) for this search. Verify before use.", hits

    def mapping(self, query: str) -> tuple[str, list[dict]]:
        return (f"{DEMO_NOTE}\n\nNo section mapping is produced in this release. Consult the Bharatiya Nyaya Sanhita and "
                "the official comparison tables yourself."), []


provider: DraftProvider = DemoProvider()
