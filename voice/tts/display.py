# caption/cue text per phrase (same order as qperform.S): numbers as digits, the rest as spoken
D = [
 'In 1944, the most important engineer on a U.S. airfield weighed four pounds.',
 'She was a Yorkshire terrier.',
 'Her name was Smoky.',
 'A soldier found her in an abandoned foxhole in the New Guinea jungle.',
 'He sold her for two Australian pounds...',
 'so he could get back to his poker game.',
 'Corporal Bill Wynne bought her, and carried her everywhere. In his backpack.',
 'Then, in the Philippines, the engineers had a problem.',
 'They needed a telegraph wire under the airfield, through a 70-foot pipe just eight inches wide.',
 'Digging it up would take three days, with 250 men out in the open, under enemy bombs.',
 "So they tied a string to Smoky's collar.",
 'Bill called her from the other end.',
 'The pipe was half full of sand. In places, she had four inches to squeeze through.',
 'Then... a little face popped out the other end. Wire attached.',
 'Three days of digging. Done in minutes.',
 'By a dog the size of a sandwich.',
 'Send this to the smallest person in your friend group.',
]
if __name__ == "__main__":
    import json, sys
    sys.path.insert(0, ".")
    from qperform import S
    assert len(S) == len(D)
    W = []
    for (li, _, _, _), d in zip(S, D):
        for w in d.split(): W.append({"w": w, "s": 0, "e": 0, "line": li})
    # placeholder timings at ~2.8 words/s so the build can be tested before the voice lands
    t = 0.3
    for w in W: w["s"] = round(t, 3); w["e"] = round(t + 0.3, 3); t += 0.36
    json.dump({"words": W, "duration": round(t + 1.0, 3)}, open("/home/claude/shorts/src/videos/simon/words.json", "w"))
    print(len(W), t)
