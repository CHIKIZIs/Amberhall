package com.dread;

import com.mojang.brigadier.arguments.BoolArgumentType;
import com.mojang.brigadier.arguments.IntegerArgumentType;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.fabricmc.fabric.api.command.v2.CommandRegistrationCallback;
import net.minecraft.command.CommandSource;
import net.minecraft.server.command.CommandManager;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

/** Команды для проверки (нужны права оператора): /dread scare [1-3], summon <watcher|crawler|smile>, watcher, event, enabled <bool>, interval <секунды>. */
public final class DreadCommands {
	private DreadCommands() {
	}

	public static void init() {
		CommandRegistrationCallback.EVENT.register((dispatcher, registry, env) -> dispatcher.register(CommandManager.literal("dread")
			.requires(src -> src.hasPermissionLevel(2))
			.then(CommandManager.literal("scare")
				.executes(c -> scare(c.getSource().getPlayerOrThrow(), 1 + c.getSource().getWorld().random.nextInt(3)))
				.then(CommandManager.argument("image", IntegerArgumentType.integer(1, 3)).executes(c -> scare(c.getSource().getPlayerOrThrow(), IntegerArgumentType.getInteger(c, "image")))))
			.then(CommandManager.literal("watcher").executes(c -> {
				DreadDirector.spawnWatcherBeforeEyes(c.getSource().getWorld(), c.getSource().getPlayerOrThrow());
				return 1;
			}))
			.then(CommandManager.literal("summon").then(CommandManager.argument("monster", StringArgumentType.word())
				.suggests((c, b) -> CommandSource.suggestMatching(new String[] {"watcher", "crawler", "smile"}, b))
				.executes(c -> {
					String type = StringArgumentType.getString(c, "monster");
					boolean ok = DreadDirector.summon(c.getSource().getWorld(), c.getSource().getPlayerOrThrow(), type);
					if (!ok) c.getSource().sendError(Text.literal("Неизвестный монстр: " + type + " (watcher, crawler, smile)"));
					return ok ? 1 : 0;
				})))
			.then(CommandManager.literal("event").executes(c -> {
				DreadDirector.event(c.getSource().getWorld(), c.getSource().getPlayerOrThrow());
				return 1;
			}))
			.then(CommandManager.literal("enabled").then(CommandManager.argument("on", BoolArgumentType.bool()).executes(c -> {
				DreadDirector.enabled = BoolArgumentType.getBool(c, "on");
				c.getSource().sendFeedback(() -> Text.literal("Dread: " + (DreadDirector.enabled ? "включён" : "выключен")), false);
				return 1;
			})))
			.then(CommandManager.literal("interval").then(CommandManager.argument("seconds", IntegerArgumentType.integer(5, 3600)).executes(c -> {
				int s = IntegerArgumentType.getInteger(c, "seconds");
				DreadDirector.minInterval = s * 20;
				DreadDirector.maxInterval = s * 30;
				c.getSource().sendFeedback(() -> Text.literal("Dread: события примерно каждые " + s + "–" + (s * 3 / 2) + " сек"), false);
				return 1;
			})))));
	}

	private static int scare(ServerPlayerEntity player, int image) {
		Jumpscare.trigger(player, image, false);
		return 1;
	}
}
