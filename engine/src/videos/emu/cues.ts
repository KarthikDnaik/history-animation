// Named cue times (seconds) on narration words for the emu short.
import { at, lineStart, lineEnd } from "./story";
export const C = {
  soldiers: at(0, "soldiers"), birds0: at(0, "birds"), won: at(0, "won"),
  l1: lineStart(1), wheat: at(1, "wheat"),
  l2: lineStart(2), emus2: at(2, "emus"), eating: at(2, "eating"),
  l3: lineStart(3), army: at(3, "army"), major: at(3, "major"), guns3: at(3, "guns"), ten: at(3, "ten"),
  l4: lineStart(4), fire: at(4, "fire"), split: at(4, "split"),
  l5: lineStart(5), dam: at(5, "dam"), jams: at(5, "jams"),
  l6: lineStart(6), truck: at(6, "truck"), outrun: at(6, "outrun"),
  l7: lineStart(7), hit: at(7, "hit"),
  l8: lineStart(8), hurt: at(8, "hurt"),
  l9: lineStart(9), emus9: at(9, "emus"),
  l10: lineStart(10), win: at(10, "win"),
  l11: lineStart(11), flock: at(11, "flock"), explodes: at(11, "explodes"), nobody: at(11, "nobody"),
  l12: lineStart(12), scatter: at(12, "scatter"),
  l13: lineStart(13), tanks: at(13, "tanks"),
  l14: lineStart(14), politician: at(14, "politician"), medals: at(14, "medals"), emus14: at(14, "emus"),
  l15: lineStart(15), stayed: at(15, "stayed"),
  l16: lineStart(16), coat: at(16, "coat"), end16: lineEnd(16),
};
