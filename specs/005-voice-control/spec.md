# Feature Specification: Voice Control

**Feature Branch**: `005-voice-control` · **Created**: 2026-10-29 · **Status**: Implemented (see `browser-check.mjs`)

**Input**: "include full voice control" (the earlier Voice screen only dictated and understood a few navigation phrases).

## User Scenarios

### US1 - Run the whole app by voice (P1)
A person turns on voice control from the top bar and can move between every screen, press buttons and links by name, move into fields by label, type or dictate into them, fill named fields, choose list options, tick boxes, scroll, go back, change text size and contrast, hear the screen heading read, and sign out, without touching the mouse.

**Independent test**: turn voice control on, say "open client intake", "focus client name", "type Test Client", "set practice area to civil", "click save intake draft", and see the draft saved.

### US2 - Know what is happening and stay in control (P1)
While it listens the app shows that it is listening, what it heard and what it did, in plain words. "What can I say" lists every command. "Stop listening" or Alt+V turns it off.

### US3 - Same control without a microphone (P2)
Alt+C opens a box in which any command can be typed; it runs exactly like a spoken one. This serves people who cannot speak, browsers with no speech recognition, and the automated check.

### US4 - Privacy is explained before audio is used (P1)
The first time, a plain warning says that Chrome and Edge send the audio to the browser vendor, and that voice control is for demonstration material only. It cannot be turned on until the person agrees.

## Requirements

- **FR-001**: Voice control MUST be a single control in the top bar of every workspace screen, with a pressed/not-pressed state and the shortcut Alt+V.
- **FR-002**: It MUST understand: go to a screen (every workspace and portal screen), back, forward, reload; scroll up, down, to top, to bottom; click or press a control by its name; focus a field by its label; type text; set a named field to a value; choose an option in a list; tick or untick a box; next and previous field; clear the field; submit the form; start and stop dictation; text bigger, smaller, normal; high contrast on and off; reset display; read the page; sign out; help; stop listening.
- **FR-003**: Controls MUST be found by what a person would say: label, accessible name, visible text, placeholder or field name, with tolerance for filler words and partial names. When nothing matches it MUST say so, never guess a different control.
- **FR-004**: While dictating, everything said MUST be typed into the focused field, except the words that end dictation or voice control.
- **FR-005**: Typed or dictated values MUST keep the person's own capitals and punctuation.
- **FR-006**: Every command MUST give a visible, plain-language answer (a status area announced to screen readers, and the toast), and MAY be spoken aloud when the person chooses.
- **FR-007**: A command that cannot be done (no such control, no field selected, not signed in) MUST say why and change nothing.
- **FR-008**: It MUST keep listening while on (browsers stop recognition after a pause) and MUST show errors such as a refused microphone.
- **FR-009**: Before first use it MUST show the privacy warning and require agreement; it MUST NOT start the microphone before that.
- **FR-010**: Alt+C MUST open a box where any command can be typed and run with the same result as speech.
- **FR-011**: Commands are understood in English. Dictation can be in English, Hindi, Marathi, Gujarati, Kannada or Tamil; speaking commands in those languages is not supported in this release.
- **FR-012**: The control MUST not cause sideways scrolling at 360 px and MUST be keyboard operable.
- **FR-013**: While on, a dark bar at the bottom MUST show a microphone mark, the state ("Listening…", "Dictating…", "Starting the microphone…", or the microphone problem), a one-line hint or the last answer, and the buttons **Numbers**, **Replies**, **Help** and **Stop**.
- **FR-014**: **Numbers** MUST put a numbered badge on every control that can be pressed or filled on the screen, kept in step as the page scrolls and changes; "click 12", "12" or "press number twelve" MUST press, or move into, that item. With no numbers showing it MUST say so.
- **FR-015**: **Replies** MUST show what was said and what the app answered, newest last, announced politely to screen readers.
- **FR-017**: Every command that moves to a screen MUST answer "Navigating to <screen name>." (for example "Navigating to case status."), shown on screen and spoken aloud while voice control is on. The parser MUST accept natural wording ("go to", "open", "show me", "take me to", "navigate to", with or without "the" and "page") and close variants of a screen's name.
- **FR-018**: A pause in speaking MUST NOT stop voice control. The browser's "no speech" and "aborted" events are not errors and listening restarts at once; only real problems (microphone refused, no microphone, speech service unreachable) are shown. The app's own spoken answers MUST NOT be taken as commands.
- **FR-019**: On phones the voice bar MUST be a full-width tray at the bottom with large buttons, and the page MUST leave room beneath it; on larger screens it sits at the bottom right.
- **FR-016**: Voice control MUST be available on every screen: in the top bar of the workspace, and as a round launcher in the corner of the sign-in screen and the full-page Services site.

## Success Criteria

- **SC-001**: The 27 browser checks in `browser-check.mjs` pass: navigation, focus, typing, set-field, list choice, button press, number entry, not-found and unknown-phrase answers, text size, contrast, scroll, dictation, read-page, privacy warning, the bar with its four buttons, numbers and "click 2", replies, stop, the Services-site launcher, no sideways scroll at 360 px.
- **SC-002**: Every example in the help list parses to a command (unit test), so the help never promises something that does not work.
- **SC-003**: 0 commands act on a control other than the one named when no good match exists (unit test of the matcher).

## Assumptions and limits

- Browser speech recognition is used (Web Speech API). It is not private; it is opt-in and demonstration only (constitution V). A private transcription service would replace it before any real client data is used.
- Spoken commands in languages other than English, hands-free wake words ("hey myCourt") and on-device recognition are out of scope.
