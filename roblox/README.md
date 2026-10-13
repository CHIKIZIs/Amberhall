# Орда Эмберхолла — режим для Roblox

Волновое выживание на арене (1–N игроков, кооператив).

- Волны врагов растут по числу, здоровью и урону; каждая 5-я — с боссом «Хранитель Тишины».
- Убийства дают монеты; в паузе между волнами — бонус монет.
- **Кузнец** (слева от костра) улучшает меч, **Целитель** (справа) лечит за монеты.
- Павшие игроки возрождаются в паузе. Если пали все — игра начинается заново, рекорд волны сохраняется на сервере.

## Установка

**Rojo:** `cd roblox && rojo serve`, затем Connect в Roblox Studio (пустой Baseplate; сам пол арены скрипт создаёт).

**Вручную:** в Studio создайте
- `ReplicatedStorage/Shared/ArenaConfig` (ModuleScript) ← `src/shared/ArenaConfig.lua`
- `ServerScriptService/ArenaMode` (Script) ← `src/server/ArenaMode.server.lua`
- `StarterPlayer/StarterPlayerScripts/ArenaHUD` (LocalScript) ← `src/client/ArenaHUD.client.lua`

Баланс и настройки — в `ArenaConfig.lua`.
