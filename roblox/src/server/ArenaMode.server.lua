-- «Орда Эмберхолла»: волновое выживание на арене.
-- Игроки получают меч, отбиваются от волн врагов, копят монеты и улучшаются у кузнеца.
-- Если погибли все — игра начинается заново; лучшая волна сервера запоминается.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Debris = game:GetService("Debris")

local Config = require(ReplicatedStorage:WaitForChild("Shared"):WaitForChild("ArenaConfig"))

Players.CharacterAutoLoads = false

local stateRemote = Instance.new("RemoteEvent")
stateRemote.Name = "ArenaState"
stateRemote.Parent = ReplicatedStorage

local state = { phase = "intermission", wave = 0, enemies = 0, endsAt = 0, best = 0, msg = "" }
local enemies = {} -- [Model] = { hum, root, cfg, lastAttack }
local enemyCount = 0
local lastSwing = {}
local swing -- объявлена ниже, нужна мечу

---------------------------------------------------------------- состояние / UI
local function push(player, extra)
	local payload = table.clone(state)
	payload.enemies = enemyCount
	if extra then
		for k, v in pairs(extra) do
			payload[k] = v
		end
	end
	if player then
		stateRemote:FireClient(player, payload)
	else
		stateRemote:FireAllClients(payload)
	end
end

local function notify(player, text)
	push(player, { toast = text })
end

---------------------------------------------------------------- арена
local function part(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do
		p[k] = v
	end
	return p
end

local function buildArena()
	local old = workspace:FindFirstChild("HordeArena")
	if old then
		old:Destroy()
	end
	local folder = Instance.new("Folder")
	folder.Name = "HordeArena"
	folder.Parent = workspace

	local S = Config.ArenaSize
	part({ Name = "Floor", Size = Vector3.new(S, 2, S), Position = Vector3.new(0, -1, 0), Color = Color3.fromRGB(38, 34, 52), Material = Enum.Material.Slate, Parent = folder })
	local h, t = 30, 4
	local walls = {
		{ Vector3.new(S + t * 2, h, t), Vector3.new(0, h / 2, S / 2 + t / 2) },
		{ Vector3.new(S + t * 2, h, t), Vector3.new(0, h / 2, -S / 2 - t / 2) },
		{ Vector3.new(t, h, S), Vector3.new(S / 2 + t / 2, h / 2, 0) },
		{ Vector3.new(t, h, S), Vector3.new(-S / 2 - t / 2, h / 2, 0) },
	}
	for i, w in ipairs(walls) do
		part({ Name = "Wall" .. i, Size = w[1], Position = w[2], Color = Color3.fromRGB(24, 20, 36), Material = Enum.Material.Brick, Parent = folder })
	end

	-- костёр в центре
	part({ Name = "Hearth", Shape = Enum.PartType.Cylinder, Size = Vector3.new(1, 10, 10), CFrame = CFrame.new(0, 0.5, 0) * CFrame.Angles(0, 0, math.rad(90)), Color = Color3.fromRGB(255, 140, 40), Material = Enum.Material.Neon, CanCollide = false, Parent = folder })
	local light = Instance.new("PointLight")
	light.Range = 40
	light.Color = Color3.fromRGB(255, 160, 70)
	light.Parent = folder.Hearth

	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "ArenaSpawn"
	spawn.Anchored = true
	spawn.Size = Vector3.new(14, 1, 14)
	spawn.Position = Vector3.new(0, 0.5, 14)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Parent = folder

	-- прилавки кузнеца и целителя
	local function station(name, pos, color, action, handler)
		local p = part({ Name = name, Size = Vector3.new(6, 5, 6), Position = pos, Color = color, Material = Enum.Material.Metal, Parent = folder })
		local prompt = Instance.new("ProximityPrompt")
		prompt.ObjectText = name
		prompt.ActionText = action
		prompt.HoldDuration = 0.3
		prompt.MaxActivationDistance = 10
		prompt.Parent = p
		prompt.Triggered:Connect(handler)
	end

	station("Кузнец", Vector3.new(-22, 2.5, -10), Color3.fromRGB(150, 150, 170), "Улучшить меч", function(player)
		local level = player:GetAttribute("DmgLevel") or 0
		if level >= Config.Shop.MaxLevel then
			return notify(player, "Меч уже максимально улучшен")
		end
		local cost = Config.Shop.UpgradeBase + level * Config.Shop.UpgradeStep
		local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Монеты")
		if not coins or coins.Value < cost then
			return notify(player, "Нужно монет: " .. cost)
		end
		coins.Value -= cost
		player:SetAttribute("DmgLevel", level + 1)
		notify(player, "Меч улучшен до уровня " .. (level + 1))
	end)

	station("Целитель", Vector3.new(22, 2.5, -10), Color3.fromRGB(110, 210, 150), "Исцелиться", function(player)
		local char = player.Character
		local hum = char and char:FindFirstChildOfClass("Humanoid")
		local coins = player:FindFirstChild("leaderstats") and player.leaderstats:FindFirstChild("Монеты")
		if not hum or hum.Health <= 0 or not coins then
			return
		end
		if hum.Health >= hum.MaxHealth then
			return notify(player, "Ты и так здоров")
		end
		if coins.Value < Config.Shop.HealCost then
			return notify(player, "Нужно монет: " .. Config.Shop.HealCost)
		end
		coins.Value -= Config.Shop.HealCost
		hum.Health = hum.MaxHealth
		notify(player, "Здоровье восстановлено")
	end)
end

---------------------------------------------------------------- игроки и меч
local function makeSword()
	local tool = Instance.new("Tool")
	tool.Name = "Янтарный меч"
	tool.RequiresHandle = true
	tool.CanBeDropped = false
	tool.GripForward = Vector3.new(-1, 0, 0)
	tool.GripRight = Vector3.new(0, 1, 0)
	tool.GripUp = Vector3.new(0, 0, 1)
	tool.GripPos = Vector3.new(0, 0, -1.5)
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.4, 0.8, 4)
	handle.Color = Color3.fromRGB(255, 190, 70)
	handle.Material = Enum.Material.Neon
	handle.CanCollide = false
	handle.Parent = tool

	tool.Activated:Connect(function()
		local player = Players:GetPlayerFromCharacter(tool.Parent)
		if player then
			swing(player)
		end
	end)
	return tool
end

local function isAlive(player)
	local char = player.Character
	local hum = char and char:FindFirstChildOfClass("Humanoid")
	return hum ~= nil and hum.Health > 0
end

local function aliveCount()
	local n = 0
	for _, p in ipairs(Players:GetPlayers()) do
		if isAlive(p) then
			n += 1
		end
	end
	return n
end

local function onCharacter(player, char)
	local backpack = player:WaitForChild("Backpack")
	makeSword().Parent = backpack
	local hum = char:WaitForChild("Humanoid")
	hum.Died:Connect(function()
		push(nil)
	end)
end

local function onPlayer(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"
	local coins = Instance.new("IntValue")
	coins.Name = "Монеты"
	coins.Parent = stats
	local kills = Instance.new("IntValue")
	kills.Name = "Убийства"
	kills.Parent = stats
	stats.Parent = player
	player:SetAttribute("DmgLevel", 0)

	player.CharacterAdded:Connect(function(char)
		onCharacter(player, char)
	end)
	push(player)
end

---------------------------------------------------------------- удар мечом
function swing(player)
	local char = player.Character
	local root = char and char:FindFirstChild("HumanoidRootPart")
	if not root or not isAlive(player) then
		return
	end
	local now = os.clock()
	if now - (lastSwing[player] or 0) < Config.Sword.Cooldown then
		return
	end
	lastSwing[player] = now

	local S = Config.Sword
	local dmg = S.Damage + (player:GetAttribute("DmgLevel") or 0) * S.PerLevel
	local look = root.CFrame.LookVector
	for _, e in pairs(enemies) do
		if e.hum.Health > 0 then
			local d = e.root.Position - root.Position
			local flat = Vector3.new(d.X, 0, d.Z)
			if flat.Magnitude > 0 and flat.Magnitude <= S.Range + e.cfg.size * 2 and flat.Unit:Dot(look) > 0.1 then
				e.model:SetAttribute("LastHit", player.UserId)
				e.hum:TakeDamage(dmg)
				e.root.AssemblyLinearVelocity = flat.Unit * S.Knockback / math.max(1, e.cfg.size) + Vector3.new(0, 12, 0)
			end
		end
	end
end

---------------------------------------------------------------- враги
local function removeEnemy(model)
	if enemies[model] then
		enemies[model] = nil
		enemyCount -= 1
		push(nil)
	end
end

local function spawnEnemy(kind, wave, playerScale)
	local cfg = Config.Enemies[kind]
	local mult = (1 + Config.Growth * (wave - 1))
	local sz = cfg.size

	local model = Instance.new("Model")
	model.Name = cfg.name

	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"
	root.Size = Vector3.new(2, 4, 1) * sz
	root.Color = cfg.color
	root.Material = Enum.Material.SmoothPlastic
	root.Parent = model

	local head = Instance.new("Part")
	head.Name = "Head"
	head.Shape = Enum.PartType.Ball
	head.Size = Vector3.new(1.6, 1.6, 1.6) * sz
	head.Color = cfg.color:Lerp(Color3.new(1, 1, 1), 0.2)
	head.Material = Enum.Material.Neon
	head.CanCollide = false
	head.Massless = true
	head.CFrame = root.CFrame * CFrame.new(0, 2.6 * sz, 0)
	head.Parent = model
	local weld = Instance.new("WeldConstraint")
	weld.Part0, weld.Part1 = root, head
	weld.Parent = root

	local hum = Instance.new("Humanoid")
	hum.MaxHealth = cfg.hp * mult * playerScale
	hum.Health = hum.MaxHealth
	hum.WalkSpeed = cfg.speed
	hum.HipHeight = 0
	hum.DisplayName = cfg.name
	hum.Parent = model

	model.PrimaryPart = root
	local angle = math.random() * math.pi * 2
	local r = Config.SpawnRadius
	model:PivotTo(CFrame.new(math.cos(angle) * r, 2 * sz + 1, math.sin(angle) * r))
	model.Parent = workspace
	root:SetNetworkOwner(nil)

	local e = { model = model, hum = hum, root = root, cfg = cfg, wave = mult, lastAttack = 0 }
	enemies[model] = e
	enemyCount += 1

	hum.Died:Connect(function()
		local uid = model:GetAttribute("LastHit")
		local killer = uid and Players:GetPlayerByUserId(uid)
		if killer and killer:FindFirstChild("leaderstats") then
			killer.leaderstats["Монеты"].Value += cfg.coins
			killer.leaderstats["Убийства"].Value += 1
		end
		removeEnemy(model)
		Debris:AddItem(model, 2)
	end)
	return e
end

-- ИИ: идём к ближайшему живому игроку, вблизи бьём
task.spawn(function()
	while true do
		task.wait(0.2)
		local now = os.clock()
		for model, e in pairs(enemies) do
			if not model.Parent then
				removeEnemy(model)
			elseif e.hum.Health > 0 then
				local best, bestD
				for _, p in ipairs(Players:GetPlayers()) do
					local char = p.Character
					local r = char and char:FindFirstChild("HumanoidRootPart")
					if r and isAlive(p) then
						local d = (r.Position - e.root.Position).Magnitude
						if not bestD or d < bestD then
							best, bestD = p, d
						end
					end
				end
				if best then
					e.hum:MoveTo(best.Character.HumanoidRootPart.Position)
					if bestD <= 4 * e.cfg.size + 2 and now - e.lastAttack > 1 then
						e.lastAttack = now
						best.Character.Humanoid:TakeDamage(e.cfg.damage * (1 + Config.Growth * 0.5 * (e.wave - 1)))
					end
				end
			end
		end
	end
end)

local function pickKind(wave)
	local pool, total = {}, 0
	for id, cfg in pairs(Config.Enemies) do
		if not cfg.boss and wave >= cfg.from then
			table.insert(pool, { id, cfg.weight })
			total += cfg.weight
		end
	end
	local roll = math.random() * total
	for _, v in ipairs(pool) do
		roll -= v[2]
		if roll <= 0 then
			return v[1]
		end
	end
	return "grunt"
end

---------------------------------------------------------------- цикл раундов
local function clearEnemies()
	for model in pairs(enemies) do
		model:Destroy()
	end
	table.clear(enemies)
	enemyCount = 0
end

local function respawnAll()
	for _, p in ipairs(Players:GetPlayers()) do
		if isAlive(p) then
			local hum = p.Character.Humanoid
			hum.Health = hum.MaxHealth
		else
			p:LoadCharacter()
		end
	end
end

-- возвращает true, если волну пережили
local function runWave(wave)
	local players = math.max(1, #Players:GetPlayers())
	local scale = 1 + 0.5 * (players - 1)
	local boss = wave % Config.BossEvery == 0
	local total = math.floor((5 + wave * 2) * scale)
	local queue = {}
	for _ = 1, total do
		table.insert(queue, pickKind(wave))
	end
	if boss then
		table.insert(queue, 1, "boss")
	end

	state.phase, state.wave, state.endsAt = "wave", wave, 0
	state.msg = boss and "Появился Хранитель Тишины!" or ("Волна " .. wave)
	push(nil)

	local spawned = 0
	while true do
		if aliveCount() == 0 then
			return false
		end
		while spawned < #queue and enemyCount < Config.MaxAliveEnemies do
			spawned += 1
			spawnEnemy(queue[spawned], wave, queue[spawned] == "boss" and scale or 1)
			if spawned % 3 == 0 then
				task.wait(0.15)
			end
		end
		if spawned >= #queue and enemyCount == 0 then
			return true
		end
		task.wait(0.3)
	end
end

local function mainLoop()
	buildArena()
	local wave = 0
	while true do
		while #Players:GetPlayers() == 0 do
			task.wait(1)
		end
		-- пауза: оживляем павших и даём передышку
		state.phase = "intermission"
		state.endsAt = workspace:GetServerTimeNow() + Config.IntermissionTime
		state.msg = wave == 0 and "Орда близко. Приготовьтесь!" or ("Волна " .. wave .. " отбита!")
		respawnAll()
		if wave > 0 then
			for _, p in ipairs(Players:GetPlayers()) do
				if p:FindFirstChild("leaderstats") then
					p.leaderstats["Монеты"].Value += Config.CoinsPerWave + wave * 2
				end
			end
		end
		push(nil)
		task.wait(Config.IntermissionTime)

		wave += 1
		if not runWave(wave) then
			state.best = math.max(state.best, wave - 1)
			state.phase = "over"
			state.msg = "Орда победила. Дошли до волны " .. (wave - 1)
			clearEnemies()
			push(nil)
			task.wait(8)
			for _, p in ipairs(Players:GetPlayers()) do
				p:SetAttribute("DmgLevel", 0)
				if p:FindFirstChild("leaderstats") then
					p.leaderstats["Монеты"].Value = 0
					p.leaderstats["Убийства"].Value = 0
				end
			end
			wave = 0
		end
	end
end

Players.PlayerAdded:Connect(onPlayer)
Players.PlayerRemoving:Connect(function(p)
	lastSwing[p] = nil
end)
for _, p in ipairs(Players:GetPlayers()) do
	task.spawn(onPlayer, p)
end

mainLoop()
