# Daily reels

Each day's article becomes a 40-50 second vertical reel (1080x1920) in Shantanu's
cloned voice, with captions, soft music and the ThinkwithClaude end card. The daily
scheduled task follows the steps below; nothing is posted publicly. Finished reels
go to the Google Drive folder "Daily Reels - ThinkwithClaude".

## reel.json
See `example-reel.json`. 5-7 scenes. Scene types:
- `hook`: `icon` (one emoji), `title` (wrap 1-3 words in **double stars** to colour them), optional `stamp`
- `point`: `icon`, `title`, optional `sub` (one short line)
- `list`: `title`, `items` (2-4 short items, under 32 characters each)
- `cta`: always last; the end card is fixed. Use this voice line exactly:
  "Visit us today at think with claude dot com, or call us at seven zero four two six, three three one zero seven."

Every scene has `voice`: what is said during it. On-screen text should be shorter than
the voice line. Total voice: 95-120 words (about 40-48 seconds).

## Rules for the script
- Say "AI" or "your AI tool", never "Claude", "ChatGPT" or "Gemini" in voice or on screen.
- Plain, complete sentences for busy leaders. No hype words, no prices, no invented numbers.
- Spell numbers the way they should be spoken in `voice`; on-screen text can use digits.

## Build
    VOICE_SKILL=<path to my-voice-clone skill> reels/build_reel.sh reel.json reels/out
Then check the voice with a transcript before uploading.
