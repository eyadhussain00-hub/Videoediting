"""Turn the word-timed transcript (plan/words.json) into src/data.json: caption groups + key word times.
Edit GROUPS to retime/re-group captions; everything on screen reads its timing from data.json."""
import json
W = json.load(open('plan/words.json'))
# (first word, last word, keyword index or None). Sections with their own graphics have no caption groups.
GROUPS = [
    (0, 1, None), (2, 3, None), (4, 6, 6), (7, 9, 9), (10, 14, None),
    (16, 17, None), (18, 19, 19), (20, 21, 21), (22, 23, None), (24, 26, None), (27, 29, None), (30, 32, None),
    (74, 75, None), (76, 79, 77), (80, 80, None),
    (88, 91, 89), (92, 95, None), (96, 98, 97),
    (103, 105, None), (106, 110, 107),
    (111, 113, 111), (114, 116, 116),
    (140, 143, None), (144, 147, 147), (148, 150, None), (151, 153, None),
    (164, 166, None), (167, 169, 169), (170, 172, None), (173, 175, 175), (176, 178, None),
    (179, 181, None), (182, 184, None), (185, 187, 187), (188, 191, 191),
]
# Caption groups end early where a graphic takes over.
START = {}
HARD_END = {14: 2.86, 32: 9.80, 80: 24.40, 98: 32.25, 110: 36.6, 116: 39.15, 153: 53.75, 191: 65.70}

STRIKE = {151: 53.0, 179: 62.25}   # gold strike-through drawn at this time

def clean(s): return s.strip(',.?')
groups = []
for gi, (a, b, k) in enumerate(GROUPS):
    nxt = W[GROUPS[gi + 1][0]]['s'] if gi + 1 < len(GROUPS) else 99
    end = min(nxt, W[b]['e'] + 0.6)
    end = HARD_END.get(b, end)
    groups.append({'start': START.get(a, W[a]['s']), 'strike': STRIKE.get(a), 'end': round(end, 3),
                   'words': [{'t': W[i]['s'], 'w': clean(W[i]['w']), 'key': i == k} for i in range(a, b + 1)]})
words = [{'t': x['s'], 'e': x['e'], 'w': x['w']} for x in W]
json.dump({'groups': groups, 'words': words}, open('src/data.json', 'w'), indent=1)
print(len(groups), 'groups')
