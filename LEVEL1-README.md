# Circuit Quest — Stage 1: Hutan Sensor

Open **Project TA PPLG.json** in GDevelop 5 and preview **MainGame Scene**. The project starts in this scene with a level introduction.

## Controls

- A/D or Left/Right: move. Tap Space for a short jump or hold it to reach the raised platforms.
- W/S or Up/Down: climb ladders.
- E: interact with a chest, research station, Warga, power post, or workbench.
- J: Pulse Wave (5 energy per shot). Batteries restore 20 energy.
- I: inventory. Escape: pause/resume. Touch buttons appear on touch devices.

## Route

1. Talk to Prof. Ohm near the start; his research station replenishes energy and 1 HP.
2. Hold Space from a running approach to reach the DHT22 platform. Open the chest after landing on the platform.
3. Jump over the broken bridge. Jump onto the raised platform for the LDR chest.
4. Follow the ladder into the cave. Open the Soil Moisture chest and answer Warga's question for PIR.
5. Avoid the timed electrical floors and climb the stone steps. Hold Up and Right near the top of the exit ladder to step onto the forest floor.
6. Activate the environmental sensor post to restore power and disable electrical floors.
7. Use the workbench with all four sensors. Drag components to their matching slots (or tap a chip then its slot on touch), set VCC/GND/DATA connections, and select Uji Rangkaian.

Correct simulated input-board connections: all VCC → 3V3, all GND → GND; DHT22.DATA → D4, LDR.DATA → A0, Soil.DATA → A1, PIR.DATA → D5. Each connection receives red/green feedback. Successful assembly sets SensorHub = 1 and StageUnlocked = 2. These are session Global Variables; permanent browser saving and Stage 2 are outside this Level 1 implementation.

## Editing

The forest, cave, collision platforms, ladders, pickups and characters are native scene instances. Nova uses GDevelop's native Platformer behavior. Solid and Ladder use the native Platform behavior. Their collision rectangles are hidden at runtime. Sprites remain separately editable in the scene. Gameplay, HTML HUD, dialogue, mobile controls and the assembly overlay are in the scene's JavaScript event, with the same source in **level1-runtime.js**. The current stage uses a 760 px/s jump speed and a 96 px bridge gap. The cave roof steps up above the exit staircase to preserve headroom.

**build_level1.py** replaces MainGame Scene while preserving the current project's other scenes. Do not run the builder after making scene edits unless you intend to regenerate the level. It requires Pillow and NumPy. **prepare_level1_assets.py** slices the supplied character sheets and prepares continuous terrain/background textures. **validate_level1.py** checks resources, animation canvases/collision masks, terrain opacity and jump geometry, and creates the overview image. **check_animation_states.cjs** checks animation priorities and transitions.

## Assets and scope

Uses the supplied forest/village panoramas, forest and cave terrain, individual prop tiles, and NOVA and VOLT character sheets. Source archives, character sheets and PDF are preserved under source-assets. Components, supporting characters and interactive props now use the detailed editable 2D pixel-art atlas described below. Music is not included. Original home, win and game-over scenes are retained; Level 1 uses its own intro and end overlays. Asset licenses were not supplied and are not asserted here.

Nova has Idle (4), Run (6), Jump/Fall (4), Climb (4), Pulse (4), Interact (4), Hurt (2), Defeat (6), and descending ClimbSide (4). Volt has Hover (4), Speak (4), Hint (4), Happy (4), and Worried (2): 56 frames total. All frames share a 128×128 transparent canvas and consistent collision mask. Nova's canvas displays at 96×96 (approximately 78 px visible standing height); Volt displays at 48×48 (approximately 40 px visible height). Prop transparency is trimmed and sprites fit their intended boxes with preserved proportions and bottom alignment. See Animation-Review.png for every frame.

Terrain is built as opaque continuous landmass sprites. There are no transparent gutters between individual tiles. The intentional broken bridge remains; the cave now sits underneath a continuous grass ceiling with two compact shaft openings. Landscape joins are blended. Before this refinement the project was backed up to **Project TA PPLG.before-map-animation-update.json**; the original pre-Level-1 backup also remains.

Tile-ratio correction: the texture repeat and editor grid are now **64x64 px**. A 192x192 source region is scaled uniformly to 64x64. Surface artwork keeps its native aspect ratio (192x159 becomes 64x53) and is composited onto the tile instead of being stretched square or squeezed into mirrored half-tiles. Landmass images display at exactly their source dimensions (scale X = scale Y = 1). The panorama is cropped to the level width rather than compressed, the cave background repeats at native scale, and bridge artwork retains its aspect ratio. Nova remains approximately 78 px tall, or 1.22 base tiles. See **Tile-Scale-Review.png** for a 1:1 scene composition and tile-size reference. The previous project is backed up as **Project TA PPLG.before-tile-ratio-fix.json**.

Validation: GDevelop opened the refined project and launched the animated preview. Terrain continuity and character scale were visually inspected. File references, 56 frame canvases, fixed collision masks, fully opaque terrain, jump geometry, and 11 animation scenarios passed automated checks. A full end-to-end playthrough has not been verified. If the editor was already open during a filesystem update, close and reopen the project before saving so the latest scene and event data are loaded.

## 2D component art

The 18-sprite atlas in **assets/art2d/CircuitQuest-2D-Atlas.png** supplies Professor Ohm, Rani, Bug, Glitch, Battery, Pulse, DHT22, LDR, Soil Moisture, PIR, Heart, Jumper leads, closed/open Chest, off/on Terminal, Workbench and SensorPost. **draw_2d_components.py** is the editable source: dark outlines, clustered highlights, teal/cyan technology, copper/wood accents and flat side-view silhouettes. **install_2d_art.py** slices this atlas, preserves floor anchors and aspect ratios, and installs the same component illustrations in inventory, dialogue portraits, HUD and assembly UI. **build_level1.py** reapplies it automatically after a level rebuild. The terrain, Nova and Volt retain their provided 2D art and animations.

The image-generation service was attempted but did not return an image and was canceled. The installed atlas is code-native artwork, not AI-generated output. The unused request is archived in **2D-ART-PROMPT.txt**; source and provenance are also recorded in **assets/art2d/ART-SOURCE.txt**. **2D-Art-Review.png** previews all installed sprites. **validate_2d_art.py** checks the 14 game-object replacements, 18 transparent sprites, nine embedded UI images, stable floor anchors and uniform scaling. The previous project is saved as **Project TA PPLG.before-2d-art.json**.

## Nova Complete Sprite Sheet

Nova now uses **Nova_Complete_Sprite_Sheet.png**, replacing the earlier separate Nova sheets. Both **Project TA PPLG.json** and **Circuit Quest - NPC Animasi.json** contain the new sprite animations. The supplied sheet contains 48x64 cells; its first row is a reference pose. The remaining rows supply 38 frames across Idle, Run, Jump/Fall, Climb, Pulse, Interact, Hurt, Defeat, and ClimbSide. Existing gameplay automatically selects them for movement, jump phase, ladder direction, attacks, interactions, damage and defeat.

**prepare_nova_assets.cjs** extracts the frames into **assets/level1/nova-complete/** and installs them without rebuilding the level. Every cell receives the same nearest-neighbor transform onto a transparent 128x128 canvas; Nova keeps the existing 96x96 instance size, collision mask, floor anchor and platformer behavior. Jump lift and crouching defeat poses retain their source proportions. **prepare_level1_assets.py** invokes this importer in preparation-only mode so future level builds retain the supplied sheet.

**Nova-Animation-Review.png** shows the nine actions in the order listed above; **assets/level1/nova-complete/README.md** records their source rows, frame counts and playback speeds. Run `node validate_nova_assets.cjs` and `node check_animation_states.cjs` to check imported assets, preserved scene data and animation selection. Pre-update backups end in **.before-nova-complete.json**. Reopen the project in GDevelop before previewing or saving if it was already open during this update. This update was checked through asset inspection and automated state tests; a new interactive GDevelop preview has not been run.

## Supplied Prof. Ohm and NPC animations

The current Ohm and Warga objects use the user's artwork copied into **source-assets/PROF OHM** and **source-assets/NPC**, superseding the two coded atlas characters. **prepare_npc_assets.py** extracts 21 frames: Prof. Ohm Idle (4), Talk (4), Explain (4), Diagnostic (one supplied still); villager Idle (4), Talk (4). The villager talking sheet's partially transparent white backdrop and matte fringe are removed during import. Every frame uses a 128x128 canvas, torso aligned to x=64 and feet at y=120, displayed at 96x96 to match Nova's visible ~78px height. Both keep their previous floor and horizontal-center anchors.

Prof. Ohm waits in Idle, checks his tablet briefly when Nova approaches, talks when his dialogue opens, and cycles into pointing/Explain while teaching. The villager switches from Idle to Talk during the sensor quiz. Both face Nova when nearby and return to Idle after the dialogue closes. Portraits in their dialogue panels animate with the same frames. The villager is called Warga/Penjaga Kebun in the UI; the existing QuestState.Rani storage key is preserved for compatibility.

The 2D-art installer automatically reapplies the supplied NPC artwork after rebuilding, so future builds retain it. **NPC-Animation-Review.png** shows every extracted frame; **validate_npc_assets.py** and the six NPC scenarios in **check_animation_states.cjs** validate states, transparency, anchors and portrait embedding. The previous project is backed up as **Project TA PPLG.before-npc-animation.json**.


## Tactical Hero Nova and terrain source update

Nova now uses `Tactical Hero Animation Sprite Sheet.png`, with an imagegen-cleaned transparent atlas at `source-assets/Tactical Hero Animation Sprite Sheet.cleaned.png`. `prepare_nova_assets.cjs` delegates to `prepare_tactical_nova.cjs`, including during future builds. There are 49 tactical frames across Idle (5 visible), Walk (8), Run (8), Jump (6), Pulse/Attack (6), Interact (6), Hurt (4), Defeat (6), plus eight original Climb/ClimbSide fallback frames because climbing is absent from the supplied sheet. Review: `Nova-Tactical-Animation-Review.png`; its row/action table is in `assets/level1/nova-tactical/README.md`. Frames use 128x128 canvases and existing 96x96 instances/masks. Jump pose selection now handles takeoff, rise, apex, fall and landing; slow movement uses Walk.

The terrain builders now read the supplied root files `Forest Terrain Pixel Art Tileset (1).png` and `Pixel Art Cave and Lab Tileset (1).png`. Both are byte-identical to the previous source files (1774x887), so existing composed terrain already represents these exact images. Source pointers were updated without rebuilding or changing level geometry. `assets/level1/tile-scale.json` records the current sources. Project snapshots before the Nova change end in `.before-nova-tactical.json`. Run `node validate_nova_assets.cjs` and `node check_animation_states.cjs`.


## Transparent ladder climb areas

`Ladder` uses the fully transparent 16x16 `assets/level1/LadderCollision.png`, while `LadderArt` retains its existing transparent artwork. Custom rectangular masks, Platform/Ladder behavior, and both climb areas retain their original dimensions and positions. This removes the white area from the editor as well as the game. `build_level1.py` preserves the change on rebuild.
