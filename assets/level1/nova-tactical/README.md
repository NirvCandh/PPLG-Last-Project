# Nova Tactical Hero

Original: `Tactical Hero Animation Sprite Sheet.png`. Cleaned atlas: `source-assets/Tactical Hero Animation Sprite Sheet.cleaned.png`.

Built-in imagegen prompt: remove background, grid and labels; preserve every hero, pose, effect, position and the 1536x1024 canvas. Deterministic slicing follows.

| Review row | Action | Frames | FPS | Source row (zero based) |
|---|---|---|---|---|
| 1 | Idle | 5 | 5 | 0 |
| 2 | Run | 8 | 12 | 2 |
| 3 | Jump | 6 | 9 | 3 |
| 4 | Climb | 4 | 7 | Legacy climb fallback |
| 5 | Pulse | 6 | 13 | 4 |
| 6 | Interact | 6 | 9 | 5 |
| 7 | Hurt | 4 | 10 | 6 |
| 8 | Defeat | 6 | 7 | 7 |
| 9 | ClimbSide | 4 | 7 | Legacy climb fallback |
| 10 | Walk | 8 | 9 | 1 |

Five Idle poses are visible despite the six-frame label. Climb/ClimbSide use the previous complete sheet because Tactical Hero has no climbing poses. Attack maps to Pulse. Frames share a 128x128 canvas and 96x96 display size with existing masks. One scale preserves source proportions; per-row floor anchors preserve jump lift and defeat posture. Walk at speed 15–139; Run at 140+.
