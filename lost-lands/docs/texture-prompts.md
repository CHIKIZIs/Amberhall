# Промты для генерации текстур — PIXEL SURVIVAL: LOST LANDS

Здесь промты для каждой текстуры игры: предметов, объектов мира, существ и тайлов земли.

Сгенерированные картинки присылайте мне. Я вырежу их попиксельно и вставлю в игру, как курицу, еду, грибы, деревья и камни.

---

## 1. Как генерировать, чтобы я смог вставить без потерь

1. **Один объект — одна картинка.** Можно и лист из нескольких, если между ними пустой фон и они не касаются друг друга.
2. **Фон — ровный, одного цвета, без градиента и текстуры.** Лучше всего чисто-белый `#FFFFFF`. Если в объекте много белого (снег, скелет, облака), берите ярко-розовый `#FF00FF`.
3. **Без тени на земле, без земли под объектом, без рамки, без текста и подписи.** Тень игра рисует сама.
4. **Пиксели должны быть чёткими квадратами, без размытия и сглаживания.** Генератор обычно рисует картинку крупно, например 1024×1024, где один «пиксель» спрайта занимает квадрат 8–16 точек. Так и нужно: я сам найду сетку и уменьшу до настоящего размера.
5. **Размер в пикселях спрайта** указан у каждого объекта. В промт его можно вписать как `32x32 pixel sprite`.
6. **Вид — сверху под углом (3/4)**, как у героя и курицы. Предметы в инвентаре — иконки, чуть наклонённые к зрителю.
7. **Существа смотрят вправо, вид сбоку.** Если генератор умеет, сделайте ещё кадр шага — «walk frame 2».
8. **Генератор.** Лучше всего с пиксель-артом справляются специальные генераторы (например, PixelLab, Retro Diffusion). Обычные (Midjourney, DALL·E, Stable Diffusion, Leonardo) тоже подойдут, если добавить стиль ниже. Для Midjourney допишите в конец `--style raw`, а при желании и `--no blur, gradient, shadow, text`.

---

## 2. Общий стиль — добавлять в КОНЕЦ каждого промта

### Для предметов (иконки инвентаря)
```
cozy 16-bit pixel art game item icon, clean hard pixel edges, no anti-aliasing, no blur, 
dark warm colored outline (dark brown or dark version of the object color, not pure black), 
soft cel shading with 3-4 tones per color, light from top-left, small bright highlight, 
warm saturated cheerful palette, chunky readable silhouette, slight 3/4 tilt toward viewer, 
single object centered, plain flat solid white background, no ground shadow, no text, no frame
```

### Для объектов мира (деревья, камни, постройки, мебель)
```
cozy 16-bit pixel art top-down RPG game asset, 3/4 top-down view, clean hard pixel edges, 
no anti-aliasing, no blur, dark colored outline matching the object hue (never pure black), 
soft cel shading 3-5 tones, light from top-left, warm saturated palette, readable chunky shapes, 
single asset centered, plain flat solid white background, no ground, no cast shadow, no text
```

### Для существ
```
cute cozy 16-bit pixel art creature sprite, side view facing right, chunky round body, 
big readable silhouette, clean hard pixel edges, no anti-aliasing, 
dark warm colored outline (dark brown / dark hue of the creature, not black), 
inner contour lines in the same dark color, eye is a single dark pixel or 2 pixels, 
soft cel shading with 3-4 tones, light cream highlight on top, warm darker tone at the bottom, 
plain flat solid white background, no shadow, no ground, no text
```
Образец стиля — ваша курица: 16×17 пикселей, коричневый контур, кремовый верх, рыжевато-коричневая тень снизу, жёлтые лапки, красный гребешок.

### Для тайлов земли
```
seamless tileable 16x16 pixel art ground texture, top-down view, cozy 16-bit RPG style, 
flat base color with sparse small details, no outline, no perspective, hard pixel edges, 
no anti-aliasing, edges must tile seamlessly with itself, no text
```

---

## 3. Размеры (пиксели спрайта)

| Что | Размер |
|---|---|
| Иконки предметов | 16×16 |
| Мелочь на земле (цветы, ветки, грибы) | 12–16 × 10–16 |
| Кусты, трава, пень | 16–24 × 14–20 |
| Камни | 20–40 × 14–30 |
| Большие скалы (3×2 клетки) | 44–48 × 30–45 |
| Деревья круглые | от 36×46 (малое) до 73×91 (большое) |
| Ели | 24–35 × 40–62 |
| Существа маленькие | 14–18 × 12–18 |
| Существа средние | 20–26 × 16–24 |
| Боссы | 40–56 × 40–56 |
| Мебель и постройки 1 клетка | 16×16 – 16×24 |
| Тайл земли | 16×16 |

---

## 4. Предметы (иконки 16×16)

Формат каждой строки: **название** (`код`) — промт (на английском, перед общим стилем).

### Ресурсы
- **Дерево** (`wood`) — `a short chopped log of oak wood, light tan cut end with tree rings, brown bark`
- **Сосновая древесина** (`pine_wood`) — `a short chopped pine log, pale yellow cut end with rings, reddish-brown rough bark`
- **Розовая древесина** (`pink_wood`) — `a short magical log with pink bark and pale pink cut end with rings`
- **Палка** (`stick`) — `a thin wooden stick with a small twig, brown`
- **Кора** (`bark`) — `a curved piece of tree bark, brown with darker grooves`
- **Смола** (`resin`) — `a drop-shaped blob of golden amber tree resin, glossy highlight`
- **Камень** (`stone`) — `a small rounded grey stone with soft facets`
- **Гранит** (`granite`) — `a chunk of pinkish-grey speckled granite`
- **Известняк** (`limestone`) — `a chunk of pale cream limestone with small holes`
- **Уголь** (`coal`) — `a lump of black coal with dark blue glossy facets`
- **Железная руда** (`iron_ore`) — `a grey rock chunk with rusty orange-beige iron veins`
- **Медная руда** (`copper_ore`) — `a grey rock chunk with bright orange copper nuggets`
- **Золотая руда** (`gold_ore`) — `a grey rock chunk with shiny yellow gold nuggets`
- **Кристалл** (`crystal`) — `a cluster of three glowing teal-green crystals`
- **Осколок льда** (`ice_shard`) — `a sharp pale blue ice shard, translucent look`
- **Звёздная руда** (`star_ore`) — `a dark purple meteorite chunk with glowing violet star specks`
- **Глина** (`clay`) — `a lump of soft orange-brown clay`
- **Трава** (`grass`) — `a small bundle of cut green grass blades`
- **Волокно** (`fiber`) — `a coiled bundle of pale green plant fiber`
- **Цветок** (`flower`) — `a single picked flower with pink petals and green stem`
- **Светоцвет** (`glow_flower`) — `a magical glowing cyan flower with soft light around petals`
- **Светящийся гриб** (`glow_mushroom`) — `a small glowing blue mushroom with light spots`
- **Кожа** (`leather`) — `a folded piece of brown leather hide`
- **Кость** (`bone`) — `a white cartoon bone`
- **Перо** (`feather`) — `a single cream and tan bird feather`
- **Слизь** (`slime_gel`) — `a wobbly blob of green slime gel with highlight`
- **Эссенция** (`essence`) — `a floating swirl of pink-violet magical essence`
- **Ядро голема** (`golem_core`) — `a round stone core with a glowing cyan rune`
- **Сердце стужи** (`frost_heart`) — `an icy blue crystal heart, glowing`
- **Шестерня** (`gear`) — `a bronze mechanical gear`
- **Пшеница** (`wheat`) — `a bundle of golden wheat ears`

### Семена (одинаковый мешочек, разный значок)
Общий промт: `a small tied burlap seed pouch with a little picture of [овощ] on it`. Вместо `[овощ]` подставьте нужное:
`seed_carrot` carrot · `seed_potato` potato · `seed_wheat` wheat · `seed_cabbage` cabbage · `seed_berry` red berries · `seed_pumpkin` pumpkin · `seed_herb` green herb leaf · `seed_eggplant` eggplant · `seed_radish` radish · `seed_corn` corn · `seed_chili` red chili · `seed_turnip` turnip · `seed_leek` leek

### Еда
Уже есть с ваших картинок: морковь, баклажан, редис, шампиньон, кукуруза, чили, репа, лук-порей, тыква. Для остальных:
- **Ягоды** (`berries`) — `a small cluster of shiny red berries with a green leaf`
- **Лечебная трава** (`herb`) — `a sprig of fresh green medicinal herb leaves`
- **Кактус** (`cactus`) — `a cut green cactus piece with tiny white spines`
- **Сырое мясо** (`raw_meat`) — `a raw pink-red meat steak with white fat edge`
- **Сырая рыба** (`raw_fish`) — `a fresh blue-silver fish`
- **Картофель** (`potato`) — `a brown potato with small eyes`
- **Капуста** (`cabbage`) — `a round green cabbage head`
- **Лисички** (`chanterelle`) — `a few orange chanterelle mushrooms`
- **Мухомор** (`amanita`) — `a red fly agaric mushroom with white spots`
- **Жареная кукуруза** (`grilled_corn`) — `a grilled corn cob with dark char marks and melted butter`
- **Жареные лисички** (`fried_chanterelle`) — `fried orange chanterelle mushrooms in a small pan`
- **Рататуй** (`ratatouille`) — `a bowl of colorful ratatouille stew, eggplant, tomato, pepper`
- **Жареное мясо** (`cooked_meat`) — `a juicy cooked brown steak with grill lines`
- **Жареная рыба** (`cooked_fish`) — `a cooked golden-brown fish`
- **Печёный картофель** (`baked_potato`) — `a baked potato split open with butter`
- **Лепёшка** (`flatbread`) — `a round golden flatbread`
- **Хлеб** (`bread`) — `a loaf of crusty brown bread`
- **Грибной суп** (`mushroom_soup`) — `a wooden bowl of creamy mushroom soup`
- **Овощное рагу** (`veg_stew`) — `a wooden bowl of vegetable stew with carrots`
- **Ягодный морс** (`berry_drink`) — `a glass of red berry juice`
- **Травяной чай** (`herb_tea`) — `a clay cup of green herbal tea with steam`
- **Тыквенный пирог** (`pumpkin_pie`) — `a slice of orange pumpkin pie with cream`
- **Пир** (`feast`) — `a plate with roast meat, bread and vegetables`
- **Зелье лечения** (`potion_heal`) — `a round glass potion bottle with red liquid and cork`
- **Зелье выносливости** (`potion_stam`) — `a round glass potion bottle with yellow-green liquid and cork`
- **Фляга** (`flask`) — `an empty leather water flask`
- **Мутная вода** (`flask_dirty`) — `a leather flask with murky brownish water`
- **Чистая вода** (`flask_clean`) — `a leather flask with clear blue water drop symbol`

### Материалы
- **Доска** (`plank`) — `two stacked light wooden planks`
- **Верёвка** (`rope`) — `a coiled beige rope`
- **Ткань** (`cloth`) — `a folded piece of white-beige cloth`
- **Кирпич** (`brick`) — `a red clay brick`
- **Железный слиток** (`iron_ingot`) — `a shiny steel-grey metal ingot bar`
- **Медный слиток** (`copper_ingot`) — `a shiny orange copper ingot bar`
- **Золотой слиток** (`gold_ingot`) — `a shiny yellow gold ingot bar`
- **Сплав** (`alloy`) — `a glowing violet-blue alloy ingot bar`

### Инструменты и оружие (рисовать по диагонали, рукоять внизу слева)
- **Каменный топор** (`stone_axe`) — `a stone axe, grey stone head tied with rope to a wooden handle, diagonal`
- **Каменная кирка** (`stone_pick`) — `a stone pickaxe, grey stone head, wooden handle, diagonal`
- **Железный топор** (`iron_axe`) — `an iron axe with shiny steel blade and wooden handle, diagonal`
- **Железная кирка** (`iron_pick`) — `an iron pickaxe with steel head and wooden handle, diagonal`
- **Древняя кирка** (`ancient_pick`) — `an ancient pickaxe with violet crystal head and gold bands, diagonal`
- **Молот** (`hammer`) — `a wooden mallet hammer, diagonal`
- **Лопата** (`shovel`) — `a shovel with iron blade and wooden handle, diagonal`
- **Удочка** (`fishing_rod`) — `a wooden fishing rod with line and red bobber, diagonal`
- **Лейка** (`watering_can`) — `a small tin watering can with spout`
- **Факел** (`torch`) — `a wooden torch with bright orange flame, diagonal`
- **Деревянный меч** (`wood_sword`) — `a wooden training sword, diagonal`
- **Каменный меч** (`stone_sword`) — `a sword with chipped grey stone blade and wooden hilt, diagonal`
- **Железный меч** (`iron_sword`) — `an iron sword with shiny blade and leather hilt, diagonal`
- **Кинжал** (`dagger`) — `a short iron dagger, diagonal`
- **Лук** (`bow`) — `a wooden hunting bow with string`
- **Посох** (`staff`) — `a wooden magic staff with a glowing green gem on top, diagonal`
- **Древний клинок** (`ancient_blade`) — `an ancient sword with teal glowing blade and gold guard, diagonal`
- **Кристальный посох** (`crystal_staff`) — `a staff topped with a large glowing violet crystal, diagonal`
- **Стрела** (`arrow`) — `a wooden arrow with feather fletching, diagonal`

### Одежда и броня
- **Рубаха** (`cloth_shirt`) — `a simple beige cloth shirt`
- **Кожаная броня** (`leather_armor`) — `a brown leather armor vest`
- **Железная броня** (`iron_armor`) — `a steel chestplate armor`
- **Тёплая куртка** (`warm_coat`) — `a warm red winter coat with fur collar`
- **Древняя броня** (`ancient_armor`) — `an ancient violet and gold chest armor with glowing rune`
- **Кожаная шапка** (`leather_cap`) — `a brown leather cap`
- **Железный шлем** (`iron_helmet`) — `a steel helmet`
- **Меховая шапка** (`fur_hat`) — `a fluffy fur hat`
- **Кожаные сапоги** (`leather_boots`) — `a pair of brown leather boots`
- **Железные сапоги** (`iron_boots`) — `a pair of steel armored boots`
- **Меховые сапоги** (`fur_boots`) — `a pair of fur-lined winter boots`
- **Кожаные перчатки** (`leather_gloves`) — `a pair of brown leather gloves`
- **Железные рукавицы** (`iron_gauntlets`) — `a pair of steel gauntlets`
- **Рюкзак** (`backpack`) — `a small brown leather backpack`
- **Большой рюкзак** (`big_backpack`) — `a big travel backpack with bedroll on top`

### Особые
- **Ключ** (`key`) — `an old golden key`
- **Печать леса** (`sigil_forest`) — `a round stone medallion with a glowing green leaf rune`
- **Печать камня** (`sigil_stone`) — `a round stone medallion with a glowing orange mountain rune`
- **Печать стужи** (`sigil_frost`) — `a round stone medallion with a glowing blue snowflake rune`
- **Осколок сердца** (`heart_shard`) — `a glowing magenta crystal heart shard`

Иконки построек (стены, полы, верстак, печь…) отдельно рисовать не нужно: игра берёт их из картинок самих построек ниже.

---

## 5. Объекты мира

Формат каждой строки: **название** (`код`, размер) — промт.

### Деревья и растения (дерево, ель, кусты, пень — уже ваши)
- **Пальма** (`palm`, 32×44) — `a tropical palm tree with curved segmented tan trunk, big green fronds, brown coconuts`
- **Сухое дерево** (`dead`, 24×32) — `a dead leafless tree with bare twisted brown branches`
- **Берёза** (`birch`, 40×60) — `a birch tree with white bark and black marks, round light green leafy crown`
- **Розовое дерево** (`pinkt`, 50×64) — `a magical tree with fluffy pink blossom crown and dark magenta trunk`
- **Малиновое дерево** (`crim`, 50×64) — `a magical tree with deep crimson red leafy crown`
- **Бирюзовое дерево** (`teal`, 50×64) — `a magical tree with teal-turquoise leafy crown`
- **Кактус** (`cactus`, 16×18) — `a green saguaro cactus with two arms and small white spines`
- **Высокая трава** (`tgrass`, 22×18) — `a clump of tall wild green grass`
- **Розовая трава** (`pgrass`, 22×18) — `a clump of tall magical pink grass`
- **Сухая трава** (`dgrass`, 22×18) — `a clump of dry yellow-brown grass`
- **Камыш** (`reed`, 16×22) — `cattail reeds with brown tops`
- **Цветы** (`flower`, 4 варианта по 14×12) — `a small patch of wildflowers: (1) white daisies (2) yellow buttercups (3) blue bells (4) pink tulips`
- **Светоцвет** (`gflower`, 14×14) — `a magical glowing cyan flower`
- **Лекарственная трава** (`herbp`, 14×12) — `a small plant with broad green medicinal leaves`
- **Дикий лён** (`fiberp`, 14×14) — `a small wild flax plant with tiny blue flowers`
- **Светящиеся грибы** (`gmush`, 14×12) — `a cluster of glowing blue mushrooms`
- **Сухие ветки** (`stickg`, 14×8) — `a few dry brown twigs lying on the ground`
- **Ракушка** (`shell`, 10×8) — `a small pink-white seashell`
- **Глина** (`claypit`, 16×10) — `a small mound of wet orange clay`
- **Ягодный куст** (`berry`, 16×16) — `a round green bush with clusters of red berries`
- **Розовый куст** (`pbush`, 16×16) — `a round pink-leaved bush`
- **Сияющая ягода** (`pberry`, 16×16) — `a dark magenta bush with glowing blue berries`
- **Сухой куст** (`dbush`, 16×14) — `a dry yellow-brown tumbleweed bush`
- **Заснеженный куст** (`sbush`, 16×16) — `a round dark green bush covered with snow on top`

### Камни и руды
- **Угольная жила** (`coalr`, 24×18) — `a grey boulder with black coal chunks embedded`
- **Медная жила** (`copperr`, 24×18) — `a grey boulder with orange copper nuggets embedded`
- **Железная жила** (`ironr`, 24×18) — `a reddish granite boulder with beige iron ore veins`
- **Золотая жила** (`goldr`, 24×18) — `a grey boulder with shiny gold nuggets embedded`
- **Снежный валун** (`srock`, 24×18) — `a grey-blue boulder with snow cap`
- **Ледяная глыба** (`icer`, 32×24) — `a big chunk of translucent blue ice`
- **Метеорит** (`meteor`, 22×18) — `a dark purple meteorite rock with glowing violet star specks`
- **Кристаллы** (`cryst_g`, `cryst_p`, `cryst_b`, по 16×18) — `a cluster of glowing crystals growing from rock: (1) green (2) violet (3) blue`
- **Гранит** (`granite`, 24×18) — `a pinkish-grey granite boulder`
- **Известняк** (`lime`, 24×16) — `a pale cream limestone rock`
- **Каменный столб** (`spire`, 20×32) — `a tall red sandstone rock pillar`

### Руины и подземелья
- **Древняя стена** (`rwall`, 16×24) — `a segment of ancient mossy stone brick wall, 3/4 view showing top and front`
- **Стена храма** (`lwall`, 16×24) — `a segment of pale limestone temple wall with carved pattern`
- **Обломок стены** (`bwall`, 16×16) — `a broken low ruined stone wall piece with moss`
- **Треснувшая стена** (`cracked`, 16×24) — `an ancient stone wall segment with a big crack`
- **Колонна** (`pillar`, 14×28) — `an ancient grey stone column with capital`
- **Обломок колонны** (`pillar_b`, 14×16) — `a broken stone column stump`
- **Арка** (`arch`, 48×32) — `a ruined ancient stone arch gateway`
- **Древняя статуя** (`rstatue`, 16×28) — `a weathered stone statue of a hooded figure with moss`
- **Обелиск** (`monument`, 14×32) — `a tall stone obelisk with glowing cyan runes`
- **Святилище** (`shrine`, 32×24) — `a small stone shrine with glowing violet crystal`
- **Древний колодец** (`rwell`, 16×18) — `an old round stone well with moss`
- **Древний сундук** (`achest`, 18×16) — `an ancient purple and gold treasure chest`
- **Ящик** (`crate`, 16×16) — `a wooden crate with metal corners`
- **Бочка** (`barrel`, 14×16) — `a wooden barrel with iron hoops`
- **Древняя ваза** (`urn`, 12×16) — `an ancient clay urn with pattern`
- **Каменная табличка** (`tablet`, 14×16) — `a stone tablet with carved glowing text runes`
- **Спуск** (`stairs_d`, 16×16) — `stone stairs going down into darkness, top-down`
- **Подъём** (`stairs_u`, 16×16) — `stone stairs going up with light, top-down`
- **Вход в копи** (`cave_r`, 32×32) — `a mine entrance in red rock with wooden support beams`
- **Ледяная пещера** (`cave_i`, 32×32) — `a cave entrance in blue ice rock with icicles`
- **Решётка** (`gate`, 16×24, 2 кадра) — `an iron portcullis gate: (1) closed (2) open`
- **Запертая дверь** (`ldoor`, 16×24, 2 кадра) — `a heavy wooden dungeon door with iron lock: (1) closed (2) open`
- **Рычаг** (`lever`, 12×14, 2 кадра) — `a wall lever: (1) up (2) down`
- **Древний механизм** (`mech`, 16×16) — `an ancient bronze mechanism with gears`
- **Шипы** (`spike`, 16×16) — `floor spike trap, metal spikes, top-down`
- **Жаровня** (`brazier`, 12×16, 2 кадра) — `a stone brazier: (1) unlit (2) with fire`
- **Кости** (`bones`, 16×10) — `a small pile of old bones and a skull`
- **Алтарь** (`altar`, 18×16) — `an ancient stone altar with glowing symbol`
- **Врата Сердца** (`hgate`, 48×32) — `a huge ancient magical gate with glowing magenta core`
- **Обломки корабля** (`wreck`, 48×20) — `a small wrecked wooden boat on the shore`
- **Метка клада** (`xmark`, 12×12) — `a red X mark painted on the ground`
- **Плавающий ящик** (`flotsam`, 14×12) — `a wooden crate floating in water`
- **Скала тёмная** (`crag_p`) — уже ваша.

### Деревня (вам нравится, но если хотите заменить)
- **Дом** (`house`, 80×92, 4 варианта) — `a cozy wooden cottage with stone base, gable roof (variants: blue slate, red tile, green, thatch), arched wooden door, windows with flower boxes`
- **Старая мельница** (`mill`, 48×48) — `an old wooden windmill with stone base`
- **Стог сена** (`hay`, 16×16) — `a golden haystack`
- **Телега** (`cart`, 32×18) — `a wooden farm cart with wheels`
- **Указатель** (`sign`, 14×18) — `a wooden signpost with arrow boards`
- **Фонарный столб** (`lamp`, 10×28) — `a wooden lamp post with hanging glowing lantern`
- **Полка** (`shelf`, 16×20) — `a wooden shelf with jars and books`
- **Стол** (`vtable`, `table`, 16×14) — `a small wooden table`
- **Камин** (`fireplace`, 16×20) — `a stone fireplace with burning fire`

### Постройки игрока
- **Деревянная стена** (`wall_wood`, 16×24, 2 вар.) — `a log wall segment, 3/4 view`
- **Каменная стена** (`wall_stone`, 16×24, 2 вар.) — `a grey stone brick wall segment, 3/4 view`
- **Окно деревянное** (`win_wood`, 16×24) — `a log wall segment with a small glass window`
- **Окно каменное** (`win_stone`, 16×24) — `a stone wall segment with a small glass window`
- **Дверь** (`door`, 16×24) — `a wooden plank door in a frame`
- **Забор** (`fence`, 16×16) — `a short wooden picket fence segment`
- **Ворота** (`fgate`, 16×16) — `a wooden fence gate`
- **Сторожевая башня** (`tower`, 32×48) — `a wooden watchtower with ladder and small roof`
- **Костёр** (`campfire`, 16×14) — `a campfire with stones around, logs and bright flame`
- **Верстак** (`workbench`, 16×16) — `a wooden workbench with saw and hammer on top`
- **Печь** (`furnace`, 16×20) — `a stone smelting furnace with glowing opening`
- **Кузница** (`forge`, 18×18) — `a blacksmith anvil next to a small forge with coals`
- **Кухонный котёл** (`kitchen`, 16×16) — `a black cooking pot over fire with steam`
- **Кровать** (`bed`, 16×28) — `a wooden single bed with red blanket and white pillow, top-down`
- **Палатка** (`tent`, 32×28) — `a small canvas camping tent`
- **Факел на стойке** (`torch`, 8×18) — `a standing wooden torch with flame`
- **Фонарь** (`lantern`, 10×14) — `a small glowing oil lantern`
- **Колодец** (`well`, 16×20) — `a wooden water well with small roof and bucket`
- **Грядка** (`plot`, 16×16) — `a tilled soil garden bed, dark brown furrows, top-down`
- **Пугало** (`scarecrow`, 14×24) — `a straw scarecrow with hat`
- **Цветочный горшок** (`flowerpot`, 10×12) — `a clay flowerpot with red flowers`
- **Знамя** (`banner`, 10×24) — `a red cloth banner on a wooden pole`
- **Ковёр** (`rug`, 16×16) — `a woven red rug with pattern, top-down`
- **Статуя** (`statue`, 16×24) — `a small marble statue on pedestal`

### Ростки огорода (3 стадии на каждую культуру, 16×16)
`a crop growing in soil: stage 1 tiny sprout, stage 2 leafy young plant, stage 3 ripe [культура]`.
Культуры: carrot, potato, wheat, cabbage, berry bush, pumpkin, herb, eggplant, radish, corn, chili, turnip, leek.

---

## 6. Существа

Добавлять общий стиль «Для существ». Образец — ваша курица.

- **Кролик** (`rabbit`, 15×14) — `a cute beige-white bunny with long ears, pink inner ears, fluffy white tail`
- **Олень** (`deer`, 22×22) — `a cute brown deer with small antlers, white belly spot, thin legs`
- **Лиса** (`fox`, 20×14) — `a cute orange fox with white chest and white tail tip, dark brown paws`
- **Птица** (`bird`, 12×10, + кадр «крылья вверх») — `a cute small blue songbird with yellow beak`
- **Лесной бесёнок** (`imp`, 16×18) — `a cute mischievous green forest imp goblin with a leaf hat, brown tunic, yellow eyes`
- **Слизень** (`slime`, 16×13, + сплющенный кадр) — `a cute round green slime blob with two dot eyes and a small mouth, glossy highlight`
- **Розовый слизень** (`pslime`) — то же, `pink slime`
- **Ледяной слизень** (`islime`) — то же, `icy light blue slime`
- **Лесной дух** (`spirit`, 16×18) — `a cute floating pink-violet ghost spirit with wispy tail and glowing eyes`
- **Каменный голем** (`golem`, 22×20) — `a chunky grey stone golem with moss on shoulders and glowing cyan eyes`
- **Пещерная мышь** (`bat`, 16×10, + кадр крыльев) — `a cute purple cave bat with red eyes, wings spread`
- **Пещерный ползун** (`crawler`, 24×12) — `a dark purple cave beetle crawler with many legs and glowing green eyes`
- **Забытый воин** (`skeleton`, 16×21) — `a cute skeleton warrior with rusty sword and red glowing eyes`
- **Древний страж** (`guardian`, 22×23) — `an ancient bronze armored guardian robot with glowing cyan visor`
- **Морозный волк** (`wolf`, 24×17) — `a blue-grey frost wolf with white chest and icy cyan eyes`
- **Ледяной элементаль** (`frost`, 18×18) — `a floating ice crystal elemental with shard arms and a face`
- **Ночная тень** (`shade`, 16×20) — `a dark navy hooded shadow ghost with glowing red eyes`
- **Курица** (`chicken`) — уже ваша.

### Боссы (крупнее, 40–56 пикселей)
- **Старший дух** (`elder`) — `a big majestic glowing pink-violet forest spirit with flower crown`
- **Страж Склепа** (`boss_guardian`) — `a huge ancient bronze guardian knight with glowing cyan core and shield`
- **Каменный Колосс** (`boss_golem`) — `a giant stone golem colossus covered in moss and glowing orange cracks`
- **Владыка Стужи** (`boss_frost`) — `a giant ice lord elemental with crown of icicles, glowing blue`
- **Архонт Сердца** (`boss_heart`) — `a giant ancient magenta crystal archon with floating armor pieces`

---

## 7. Тайлы земли (16×16, бесшовные)

Добавлять общий стиль «Для тайлов». Лучше по 4 варианта каждого, чтобы земля не повторялась.

- **Трава** — `green grass ground, flat medium green #5a9638 base, few small darker green grass tufts, few lighter blades, rare tiny white daisy`
- **Тёмная лесная трава** — `dark forest grass ground, deep green, few dark tufts`
- **Розовая трава** — `magical pink grass ground, soft pink base, small darker pink tufts`
- **Песок** — `beach sand ground, warm light tan, few tiny darker grains and pebbles`
- **Земля, дорога** — `dirt path ground, reddish-brown, small darker specks and tiny pebbles`
- **Красная земля каньона** — `red canyon earth ground, terracotta, small cracks`
- **Снег** — `fresh snow ground, white with soft light blue shading specks`
- **Лёд** — `frozen ice ground, light blue with white crack lines`
- **Камень руин** — `ancient stone floor tiles with moss in gaps`
- **Деревянный пол** — `wooden plank floor, warm brown boards`
- **Каменный пол** — `grey flagstone floor`
- **Мост** — `wooden bridge planks running horizontally with dark gaps`
- **Пол подземелья** — `dark dungeon stone floor, cool dark grey-purple`
- **Скала** (стена обрыва) — `cliff wall face made of large rounded brown earth stones, front view, with grass overhang on top variant`
- **Вода** (4 кадра анимации) — `calm blue water surface with small light ripples` (вода вам нравится, можно не менять)

---

## 8. Что прислать мне

Присылайте картинки любыми порциями, по одной или пачкой. К каждой подпишите код, например `bird` или `stone_axe`. Подпись можно сделать прямо в имени файла или в сообщении.

Вырежу, проверю в игре и закоммичу.
