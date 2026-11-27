import { SHOTS, TOTAL, FPS } from "/home/claude/shorts/src/videos/cherami/story";
import { EDIT_CUES } from "/home/claude/shorts/src/videos/cherami/edit";
import W from "/home/claude/shorts/src/videos/cherami/words.json";
import * as fs from "fs";
fs.writeFileSync("/home/claude/cherami/audio/cues.json", JSON.stringify({ FPS, TOTAL, SHOTS, words: (W as any).words, edit: EDIT_CUES }));
console.log(TOTAL, EDIT_CUES.TRANS.length, JSON.stringify(EDIT_CUES.TRANS.map(t => t.kind[0] + t.f)));
