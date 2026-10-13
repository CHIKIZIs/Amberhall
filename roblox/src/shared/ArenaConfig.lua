-- Настройки режима «Орда Эмберхолла». Всё, что хочется подкрутить, лежит здесь.
return {
	ArenaSize = 220, -- сторона квадратной арены, studs
	SpawnRadius = 90, -- враги появляются по кольцу такого радиуса
	IntermissionTime = 15, -- пауза между волнами, сек
	BossEvery = 5, -- каждая N-я волна с боссом
	MaxAliveEnemies = 40,

	Sword = {
		Damage = 20,
		PerLevel = 8, -- прибавка урона за уровень улучшения
		Range = 7,
		Cooldown = 0.45,
		Knockback = 35,
	},

	Shop = {
		UpgradeBase = 20, -- цена улучшения = base + уровень * step
		UpgradeStep = 15,
		HealCost = 15,
		MaxLevel = 15,
	},

	-- hp/damage умножаются на (1 + Growth * (волна - 1)).
	Growth = 0.12,
	CoinsPerWave = 10,

	Enemies = {
		grunt = { name = "Тень", hp = 60, damage = 8, speed = 12, size = 1, color = Color3.fromRGB(70, 60, 110), coins = 3, from = 1, weight = 6 },
		runner = { name = "Бегун", hp = 35, damage = 6, speed = 20, size = 0.8, color = Color3.fromRGB(200, 90, 60), coins = 4, from = 3, weight = 3 },
		tank = { name = "Страж", hp = 220, damage = 18, speed = 9, size = 1.5, color = Color3.fromRGB(90, 130, 90), coins = 10, from = 5, weight = 2 },
		boss = { name = "Хранитель Тишины", hp = 1500, damage = 35, speed = 11, size = 3, color = Color3.fromRGB(255, 170, 40), coins = 80, boss = true },
	},
}
