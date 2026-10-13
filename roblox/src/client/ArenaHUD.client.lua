-- Интерфейс режима: волна, число врагов, таймер паузы, баннеры и подсказки.
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local remote = ReplicatedStorage:WaitForChild("ArenaState")
local gui = Instance.new("ScreenGui")
gui.Name = "HordeHUD"
gui.ResetOnSpawn = false
gui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")

local function label(size, pos, textSize)
	local l = Instance.new("TextLabel")
	l.Size, l.Position = size, pos
	l.AnchorPoint = Vector2.new(0.5, 0)
	l.BackgroundTransparency = 1
	l.TextColor3 = Color3.fromRGB(255, 226, 150)
	l.TextStrokeTransparency = 0.3
	l.Font = Enum.Font.GothamBold
	l.TextSize = textSize
	l.Parent = gui
	return l
end

local top = label(UDim2.fromOffset(500, 36), UDim2.new(0.5, 0, 0, 10), 24)
local sub = label(UDim2.fromOffset(500, 24), UDim2.new(0.5, 0, 0, 46), 18)
sub.TextColor3 = Color3.fromRGB(220, 215, 240)
local banner = label(UDim2.fromOffset(800, 60), UDim2.new(0.5, 0, 0.25, 0), 40)
banner.TextTransparency = 1
banner.TextStrokeTransparency = 1
local toast = label(UDim2.fromOffset(600, 30), UDim2.new(0.5, 0, 0.8, 0), 22)
toast.TextTransparency = 1
toast.TextStrokeTransparency = 1

local cur = { phase = "intermission", wave = 0, enemies = 0, endsAt = 0, best = 0, msg = "" }
local lastMsg

local function fade(l, text)
	l.Text = text
	l.TextTransparency, l.TextStrokeTransparency = 0, 0.3
	TweenService:Create(l, TweenInfo.new(2.5, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { TextTransparency = 1, TextStrokeTransparency = 1 }):Play()
end

remote.OnClientEvent:Connect(function(s)
	cur = s
	if s.toast then
		fade(toast, s.toast)
	end
	if s.msg ~= lastMsg and s.msg ~= "" then
		lastMsg = s.msg
		fade(banner, s.msg)
	end
end)

RunService.RenderStepped:Connect(function()
	if cur.phase == "wave" then
		top.Text = "Волна " .. cur.wave
		sub.Text = "Врагов осталось: " .. cur.enemies
	elseif cur.phase == "intermission" then
		local left = math.max(0, math.ceil(cur.endsAt - workspace:GetServerTimeNow()))
		top.Text = "Следующая волна через " .. left
		sub.Text = "Улучшай меч у Кузнеца, лечись у Целителя"
	else
		top.Text = "Конец игры"
		sub.Text = "Новая игра скоро начнётся"
	end
	if cur.best and cur.best > 0 then
		sub.Text ..= "  ·  Рекорд: волна " .. cur.best
	end
end)
