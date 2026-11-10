# Raidborn

Вертикальная экшен-RPG для телефона: камера сверху-сзади под 45°, 20 уровней в 4 локациях, боссы,
5 видов оружия, броня и амулеты, прокачка героя, арена против ботов. Работает без интернета.
Язык (русский/английский) выбирается по языку телефона.

## Что где лежит

| Путь | Что это |
| --- | --- |
| `src/` | Исходный код игры (JavaScript, 3D на three.js). |
| `src/data.js` | Все числа баланса: оружие, враги, локации, цены, награды. |
| `www/` | Готовая игра: `index.html` и собранный `game.js`. Открывается в браузере. |
| `android/` | Android-проект: полноэкранная обёртка, которая показывает `www/`. |
| `store/` | Иконка 512×512, баннер 1024×500, скриншоты и тексты для Google Play. |
| `privacy.html` | Политика конфиденциальности (Google Play требует ссылку на неё). |

## Сборка

Игра (нужен Node.js):

```bash
npm install
npm run build        # собирает src/ в www/game.js
```

Android (нужны JDK 17+ и Android SDK, platform 36), из папки `android/`:

```bash
./gradlew assembleRelease   # APK: app/build/outputs/apk/release/
./gradlew bundleRelease     # AAB для Google Play: app/build/outputs/bundle/release/
```

Чтобы release был подписан, положите рядом с `android/build.gradle` файл `keystore.properties`
(он и сам ключ в репозиторий не попадают):

```properties
storeFile=/полный/путь/к/ключу.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Для каждого обновления в Google Play увеличивайте `versionCode` в `android/app/build.gradle`.

## Перед первой загрузкой в Google Play

- **Идентификатор приложения** `com.chikizis.raidborn` (в `android/app/build.gradle`) после публикации изменить нельзя.
- В `privacy.html` впишите контактный e-mail и выложите файл по публичной ссылке.
- Название «Raidborn» стоит проверить поиском в Google Play.
