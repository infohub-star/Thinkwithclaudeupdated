#!/usr/bin/env python3
"""Turn the voice tool's sentence timings into the template's timings.json.

Usage: make_timings.py reel.json voiceover.wav.timings.json out/timings.json

reel.json scenes each have "voice": the lines spoken in that scene. Sentences
from the voice tool are matched to scenes in order. Captions use each scene's
optional "caption_fixes" ({"spoken form": "written form"}) so a phone number
read out as words shows as digits.
"""
import json, re, sys

reel = json.load(open(sys.argv[1]))
segs = json.load(open(sys.argv[2]))
segs = segs if isinstance(segs, list) else segs.get("segments") or segs.get("sentences")


def norm(t):
    return re.sub(r"[^a-z0-9]", "", t.lower())


# Build the expected character stream per scene, then walk the sentences.
targets = [norm(s["voice"]) for s in reel["scenes"]]
out, scene, used = [], 0, 0
for seg in segs:
    n = norm(seg["text"])
    while scene < len(targets) - 1 and used >= len(targets[scene]) - 2:
        scene, used = scene + 1, 0
    used += len(n)
    cap = seg["text"]
    for spoken, written in reel["scenes"][scene].get("caption_fixes", {}).items():
        cap = cap.replace(spoken, written)
    out.append({"text": seg["text"], "caption": cap, "start": seg["start"], "end": seg["end"], "scene": scene})

missing = sorted(set(range(len(targets))) - {o["scene"] for o in out})
if missing:
    sys.exit(f"No speech matched scenes {missing}; check reel.json voice lines")
total = max(o["end"] for o in out)
json.dump({"segments": out, "total": total}, open(sys.argv[3], "w"), indent=1)
print(f"{len(out)} sentences, {total:.1f}s, scenes 0-{len(targets) - 1}")
