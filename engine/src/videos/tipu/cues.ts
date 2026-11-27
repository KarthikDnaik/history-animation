// Named cue times (seconds) on narration words; everything visual is timed from these.
import { at, lineStart, lineEnd } from "./story";
export const C = {
  fire: at(0, "firing"), british0: at(0, "British"), l0end: lineEnd(0),
  l1: lineStart(1), rocketMen: at(1, "rocket"), thousand: at(1, "thousand"),
  l2: lineStart(2), iron: at(2, "iron"), gunpowder: at(2, "gunpowder"), bamboo: at(2, "bamboo"),
  l3: lineStart(3), light: at(3, "Light"), screams: at(3, "screams"), kilometre: at(3, "kilometre"),
  l4: lineStart(4), paper: at(4, "paper"), fall: at(4, "fall"), short: at(4, "short"),
  l5: lineStart(5), pollilur: at(5, "Pollilur"), stray: at(5, "stray"), finds: at(5, "finds"), carts: at(5, "carts"), goes: at(5, "goes"), once: at(5, "once"),
  l6: lineStart(6), accurate: at(6, "accurate"),
  l7: lineStart(7), five: at(7, "five"), men7: at(7, "thousand") - 0.1,
  l8: lineStart(8), hose: at(8, "hose"), tighter: at(8, "tighter"), harder: at(8, "harder"), shoots: at(8, "shoots"),
  l9: lineStart(9), paperT: at(9, "paper"), splits: at(9, "splits"), ironT: at(9, "iron"), holds: at(9, "holds"), flies: at(9, "flies"), further: at(9, "further"),
  l10: lineStart(10), packed: at(10, "packed"), shipped: at(10, "shipped"),
  l11: lineStart(11), congreve: at(11, "Congreve"), sticks: at(11, "sticks"), insisted: at(11, "insisted"), copied: at(11, "copied"),
  l12: lineStart(12), lit: at(12, "lit"), fort: at(12, "fort"), poet: at(12, "poet"), glare: at(12, "glare"),
  l13: lineStart(13), sing: at(13, "sing"), game: at(13, "game"),
  l14: lineStart(14), thousands: at(14, "Thousands"), village: at(14, "village"), karnataka: at(14, "Karnataka"), waiting: at(14, "waiting"), launch: at(14, "launch"),
};
