# Glowjar

Вертикальная казуальная игра для телефона: бросай светлячков в банку, одинаковые сливаются
в одного побольше. Работает без интернета, без рекламы, язык (русский/английский) выбирается по языку телефона.

## Что где лежит

| Путь | Что это |
| --- | --- |
| `www/index.html` | Вся игра в одном файле. Открывается в любом браузере. |
| `android/` | Android-проект: полноэкранная обёртка, которая показывает `www/index.html`. |
| `store/` | Иконка 512×512, баннер 1024×500, скриншоты и тексты для страницы в Google Play. |
| `privacy.html` | Политика конфиденциальности (Google Play требует ссылку на неё). |

## Сборка

Нужны JDK 17+ и Android SDK (platform 36). Из папки `android/`:

```bash
./gradlew assembleDebug    # APK для проверки на телефоне: app/build/outputs/apk/debug/
./gradlew bundleRelease    # AAB для Google Play:           app/build/outputs/bundle/release/
```

Чтобы release был подписан, положите рядом с `android/build.gradle` файл `keystore.properties`
(он и сам ключ в репозиторий не попадают):

```properties
storeFile=/полный/путь/к/glowjar-upload.jks
storePassword=...
keyAlias=upload
keyPassword=...
```

Для каждого обновления в Google Play увеличивайте `versionCode` в `android/app/build.gradle`.

## Перед первой загрузкой в Google Play

- **Идентификатор приложения** `com.chikizis.glowjar` (в `android/app/build.gradle`) после публикации изменить нельзя.
  Если нужен другой — поменяйте `applicationId` до первой загрузки.
- В `privacy.html` впишите контактный e-mail и выложите файл по публичной ссылке.
- Название «Glowjar» стоит проверить поиском в Google Play, чтобы не совпало с чужим.
