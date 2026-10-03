# Endless War

A Vampire Survivors–style game in portrait mode for phones. HTML5/JS: the same code runs in the APK and, later, in Telegram as a Mini App.

## Telegram Mini App
The game is published from the `main` branch with GitHub Pages: **https://gandalfsumlama.github.io/endless-war/** (any push to `main` updates it in a minute or two). Connect it in Telegram via @BotFather: `/newapp` → pick the bot → title, description, 640×360 picture → Web App URL above → short name; the game link is `t.me/<bot>/<short name>`. A menu button: `/mybots` → bot → Bot Settings → Menu Button → same URL. Inside Telegram `js/core.js` switches to full screen, portrait lock and Telegram insets.

What is not in the repository (see `.gitignore`): the signing key `android/endlesswar.keystore`, APK, third-party source packs `assets_src/` (some licences forbid redistributing the files separately), concept sheets from the project root.

## Build the APK
```
powershell -ExecutionPolicy Bypass -File android/build.ps1            # build EndlessWar.apk
powershell -ExecutionPolicy Bypass -File android/build.ps1 -Install   # + install on a phone connected via USB
```
Keep `android/endlesswar.keystore`: game updates must be signed with the same key, otherwise the phone won't install the update over the old version.

## Test on PC
`powershell -ExecutionPolicy Bypass -File serve.ps1`, then open http://localhost:8080 (WASD/arrow keys, Esc for pause).

## Art from concept sheets
Sprites are cut automatically from the sheets in the project root:
```
powershell -ExecutionPolicy Bypass -File tools/cut-mobs.ps1   # enemies -> art/enemies + js/art-meta.js
powershell -ExecutionPolicy Bypass -File tools/cut-hero.ps1   # heroes  -> art/heroes  + js/art-meta-heroes.js
```
Frame areas on the sheets are set at the top of each script (x, y, w, h, frame count). Enemy sheet rows: walk, attack, hit, death; plus `<id>_big.png` (big art for elites and bosses). Hero: idle, run, attack, death, plus a `_big` portrait for the menu.

## Art manually
Anything without art is drawn as a placeholder (colored circle). Manual PNGs (transparent background):

| What | File |
|---|---|
| Heroes | `art/heroes/<id>.png`: wanderer, scavenger, hunter, guardian, pyro, vampire, gambler, witch, storm, necro |
| Enemies | `art/enemies/<id>.png`: crow, roach, skeleton, mushroom, wolf, gnome |

- The character should face **right** (or set `facesLeft: true` in `ART` in `js/data.js`).
- Animation is a horizontal strip of same-size frames; set the frame count in `ART[...].frames` (and `fps`).
- Bosses and elites use the same enemy art, just scaled up.
- After adding art, rebuild the APK.

## Where things live
- `js/data.js`: weapons, evolutions, items, heroes, enemies, levels, shop prices, coin drop chance
- `js/weapons.js`: weapon behavior
- `js/game.js`: engine (spawning, damage, levels, rendering)
- `js/ui.js`: menus, shop, collection, in-run windows

## История изменений
Все правки записываются в `CHANGELOG.md` (дата, версия, кто и что поменял). Версия и дата последней правки — в `js/version.js`, в игре видны в Настройках.

## Языки
Тексты в коде пишутся по-русски и оборачиваются в `t('…')` (`js/i18n.js`). Английский перевод — `js/lang-en.js`: строки интерфейса в `I18N.en`, названия и описания данных в `EN_DATA`. Язык переключается в Настройках.
