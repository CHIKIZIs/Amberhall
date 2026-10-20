package com.dread;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import net.fabricmc.fabric.api.entity.event.v1.EntitySleepEvents;
import net.fabricmc.fabric.api.event.lifecycle.v1.ServerTickEvents;
import net.minecraft.block.Blocks;
import net.minecraft.block.DoorBlock;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.text.Text;
import net.minecraft.util.Formatting;
import net.minecraft.entity.LivingEntity;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.server.world.ServerWorld;
import net.minecraft.sound.SoundCategory;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Box;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/** «Режиссёр» ужаса: ночью и в тёмных пещерах случайно подбрасывает игроку жуткие события. */
public final class DreadDirector {
	private static final Map<UUID, Long> NEXT = new HashMap<>();
	public static boolean enabled = true;
	/** интервал между событиями, тики (по умолчанию 45–130 секунд) */
	public static int minInterval = 900, maxInterval = 2600;

	private DreadDirector() {
	}

	public static void init() {
		ServerTickEvents.END_WORLD_TICK.register(DreadDirector::tick);
		// проснулся — рядом может стоять Наблюдатель
		EntitySleepEvents.STOP_SLEEPING.register((LivingEntity entity, BlockPos pos) -> {
			if (entity instanceof ServerPlayerEntity player && player.getWorld() instanceof ServerWorld world && enabled && world.random.nextFloat() < 0.15f) {
				WatcherEntity w = spawnWatcher(world, player, pos.toCenterPos().add(world.random.nextBetween(-3, 3), 0, world.random.nextBetween(-3, 3)));
				if (w != null) player.playSoundToPlayer(DreadSounds.WHISPER, SoundCategory.AMBIENT, 1.0f, 0.9f);
			}
		});
	}

	private static boolean scary(ServerWorld world, ServerPlayerEntity player) {
		long t = world.getTimeOfDay() % 24000;
		boolean night = t > 13000 && t < 23000;
		boolean deepDark = world.getLightLevel(player.getBlockPos()) < 4 && player.getY() < world.getSeaLevel() - 8;
		return night || deepDark || world.isThundering();
	}

	private static void tick(ServerWorld world) {
		if (!enabled || world.getRegistryKey() != World.OVERWORLD || world.getTime() % 20 != 0) {
			return;
		}
		for (ServerPlayerEntity player : world.getPlayers()) {
			if (player.isSpectator()) continue;
			// сердцебиение: чем ближе Наблюдатель, тем громче
			var watchers = world.getEntitiesByType(ModEntities.WATCHER, new Box(player.getBlockPos()).expand(26), e -> true);
			if (!watchers.isEmpty()) {
				double d = watchers.stream().mapToDouble(w -> w.distanceTo(player)).min().orElse(26);
				player.playSoundToPlayer(DreadSounds.HEARTBEAT, SoundCategory.HOSTILE, (float) Math.max(0.15, 1.4 - d / 22.0), 0.9f + (float) (1.0 - d / 26.0) * 0.5f);
			}
			if (!scary(world, player)) continue;
			long next = NEXT.computeIfAbsent(player.getUuid(), k -> world.getTime() + 400 + world.random.nextInt(600));
			if (world.getTime() >= next) {
				event(world, player);
				NEXT.put(player.getUuid(), world.getTime() + minInterval + world.random.nextInt(Math.max(1, maxInterval - minInterval)));
			}
		}
	}

	/** случайное событие (вызывается и командой /dread event) */
	public static void event(ServerWorld world, ServerPlayerEntity player) {
		Vec3d look = player.getRotationVec(1.0f);
		Vec3d flat = new Vec3d(look.x, 0, look.z).normalize();
		Vec3d p = player.getPos();
		int roll = world.random.nextInt(100);
		if (roll < 12) {
			at(world, p.subtract(flat.multiply(3.5)), world.random.nextBoolean() ? DreadSounds.FOOTSTEPS : DreadSounds.FOOTSTEPS, 1.0f);                  // шаги за спиной
		} else if (roll < 22) {
			at(world, p.add(0, 1.6, 0).add(flat.rotateY((float) Math.PI / 2).multiply(0.8)), DreadSounds.WHISPER, 1.3f);                                    // шёпот у уха
		} else if (roll < 29) {
			at(world, p.subtract(flat.multiply(1.2)).add(0, 1.5, 0), DreadSounds.BREATH, 1.3f);                                                              // дыхание в затылок
		} else if (roll < 36) {
			at(world, p.add(flat.rotateY((float) (Math.PI * (world.random.nextBoolean() ? 0.5 : -0.5))).multiply(5)), DreadSounds.KNOCK, 1.3f);            // стук
		} else if (roll < 43) {
			BlockPos door = nearest(world, player, 10, true);
			Vec3d at = door != null ? door.toCenterPos() : p.subtract(flat.multiply(6));
			at(world, at, DreadSounds.CREAK, 1.3f);
			if (door != null && world.getBlockState(door).getBlock() instanceof DoorBlock d) {
				d.setOpen(player, world, world.getBlockState(door), door, !world.getBlockState(door).get(DoorBlock.OPEN));
			}
		} else if (roll < 48) {
			player.playSoundToPlayer(DreadSounds.DRONE, SoundCategory.AMBIENT, 1.0f, 1.0f);
		} else if (roll < 53) {
			player.playSoundToPlayer(DreadSounds.EERIE, SoundCategory.AMBIENT, 1.0f, 0.9f);
		} else if (roll < 58) {
			BlockPos torch = nearest(world, player, 8, false);                                                                                          // гаснет факел
			if (torch != null) {
				world.setBlockState(torch, Blocks.AIR.getDefaultState());
				world.playSound(null, torch, SoundEvents.BLOCK_FIRE_EXTINGUISH, SoundCategory.BLOCKS, 1.0f, 0.8f);
				player.playSoundToPlayer(DreadSounds.WHISPER, SoundCategory.AMBIENT, 0.9f, 0.8f);
			} else {
				at(world, p.subtract(flat.multiply(3)), DreadSounds.FOOTSTEPS, 1.0f);
			}
		} else if (roll < 63) {
			player.playSoundToPlayer(DreadSounds.STING, SoundCategory.HOSTILE, 0.7f, 0.7f);                                                              // ложная тревога
		} else if (roll < 69) {
			at(world, p.subtract(flat.multiply(2.2)).add(0, 1.6, 0), DreadSounds.VOICE, 1.5f);                                                          // «Я вижу тебя» за спиной
		} else if (roll < 74) {
			player.playSoundToPlayer(DreadSounds.CHANT, SoundCategory.AMBIENT, 0.9f, 1.0f);                                                              // хор вдали
		} else if (roll < 79) {
			BlockPos door = nearest(world, player, 14, true);
			if (door != null && world.getBlockState(door).getBlock() instanceof DoorBlock d) {
				if (world.getBlockState(door).get(DoorBlock.OPEN)) d.setOpen(player, world, world.getBlockState(door), door, false);
				at(world, door.toCenterPos(), DreadSounds.SLAM, 1.8f);                                                                                   // дверь захлопнулась
			} else {
				at(world, p.add(flat.multiply(7)), DreadSounds.SLAM, 1.8f);
			}
		} else if (roll < 84) {
			fakeChat(player);
		} else if (roll < 88) {
			lightsOut(world, player);
		} else if (roll < 93) {
			summon(world, player, "smile");
		} else if (roll < 96) {
			summon(world, player, "crawler");
		} else {
			spawnWatcherBeforeEyes(world, player);
		}
	}

	private static final String[] CHAT = {"Не оборачивайся.", "Я смотрю на тебя.", "Ты не один.", "Почему ты не спишь?", "Оно уже идёт за тобой.", "Ты слышишь шаги?", "Посмотри назад.", "Здесь кто-то есть."};

	private static void fakeChat(ServerPlayerEntity player) {
		String line = player.getRandom().nextInt(3) == 0 ? player.getName().getString() + "... " + CHAT[player.getRandom().nextInt(CHAT.length)] : CHAT[player.getRandom().nextInt(CHAT.length)];
		player.sendMessage(Text.literal("<???> " + line).formatted(Formatting.DARK_RED, Formatting.ITALIC), false);
		player.playSoundToPlayer(DreadSounds.WHISPER, SoundCategory.AMBIENT, 0.8f, 0.7f);
	}

	/** гаснут все факелы вокруг, давит тьма и слышен скрип */
	private static void lightsOut(ServerWorld world, ServerPlayerEntity player) {
		int n = 0;
		for (BlockPos pos : BlockPos.iterate(player.getBlockPos().add(-12, -4, -12), player.getBlockPos().add(12, 4, 12))) {
			var b = world.getBlockState(pos).getBlock();
			if (b == Blocks.TORCH || b == Blocks.WALL_TORCH || b == Blocks.LANTERN || b == Blocks.SOUL_TORCH || b == Blocks.SOUL_WALL_TORCH) {
				world.setBlockState(pos, Blocks.AIR.getDefaultState());
				n++;
			}
		}
		player.addStatusEffect(new StatusEffectInstance(StatusEffects.DARKNESS, 200, 0, false, false, false));
		player.playSoundToPlayer(n > 0 ? DreadSounds.CREAK : DreadSounds.EERIE, SoundCategory.AMBIENT, 1.0f, 0.7f);
		world.playSound(null, player.getBlockPos(), SoundEvents.BLOCK_FIRE_EXTINGUISH, SoundCategory.BLOCKS, 1.5f, 0.6f);
	}

	/** призвать монстра рядом с игроком: watcher | crawler | smile */
	public static boolean summon(ServerWorld world, ServerPlayerEntity player, String type) {
		Vec3d look = player.getRotationVec(1.0f);
		Vec3d flat = new Vec3d(look.x, 0, look.z).normalize();
		switch (type) {
			case "watcher" -> {
				spawnWatcherBeforeEyes(world, player);
				return true;
			}
			case "crawler" -> {
				Vec3d at = player.getPos().add(flat.rotateY((float) ((world.random.nextDouble() - 0.5) * 2.2)).multiply(14 + world.random.nextInt(6)));
				BlockPos stand = WatcherEntity.findStand(world, BlockPos.ofFloored(at));
				if (stand == null) stand = player.getBlockPos();
				CrawlerEntity c = ModEntities.CRAWLER.create(world);
				if (c == null) return false;
				c.refreshPositionAndAngles(stand.getX() + 0.5, stand.getY(), stand.getZ() + 0.5, world.random.nextFloat() * 360, 0);
				world.spawnEntity(c);
				c.setTarget(player);
				player.playSoundToPlayer(DreadSounds.GROWL, SoundCategory.HOSTILE, 1.2f, 0.7f);
				return true;
			}
			case "smile" -> {
				Vec3d at = player.getEyePos().add(flat.rotateY((float) ((world.random.nextDouble() - 0.5) * 2.4)).multiply(10 + world.random.nextInt(4)));
				SmileEntity sm = ModEntities.SMILE.create(world);
				if (sm == null) return false;
				sm.refreshPositionAndAngles(at.x, at.y - 0.4, at.z, 0, 0);
				sm.setTarget(player);
				world.spawnEntity(sm);
				player.playSoundToPlayer(DreadSounds.BREATH, SoundCategory.HOSTILE, 0.8f, 0.6f);
				return true;
			}
			default -> {
				return false;
			}
		}
	}

	private static void at(ServerWorld world, Vec3d pos, SoundEvent sound, float vol) {
		world.playSound(null, pos.x, pos.y, pos.z, sound, SoundCategory.AMBIENT, vol, 0.9f + world.random.nextFloat() * 0.2f);
	}

	private static BlockPos nearest(ServerWorld world, ServerPlayerEntity player, int r, boolean door) {
		BlockPos best = null; double bd = 1e9;
		for (BlockPos pos : BlockPos.iterate(player.getBlockPos().add(-r, -3, -r), player.getBlockPos().add(r, 3, r))) {
			var b = world.getBlockState(pos).getBlock();
			boolean match = door ? b instanceof DoorBlock : (b == Blocks.TORCH || b == Blocks.WALL_TORCH);
			if (match && pos.getSquaredDistance(player.getBlockPos()) < bd) { bd = pos.getSquaredDistance(player.getBlockPos()); best = pos.toImmutable(); }
		}
		return best;
	}

	public static void spawnWatcherBeforeEyes(ServerWorld world, ServerPlayerEntity player) {
		if (!world.getEntitiesByType(ModEntities.WATCHER, new Box(player.getBlockPos()).expand(64), e -> true).isEmpty()) return;
		Vec3d look = player.getRotationVec(1.0f);
		double ang = (world.random.nextDouble() - 0.5) * 1.6;
		double dist = 22 + world.random.nextDouble() * 8;
		Vec3d dir = new Vec3d(look.x, 0, look.z).normalize().rotateY((float) ang);
		WatcherEntity w = spawnWatcher(world, player, player.getPos().add(dir.multiply(dist)));
		if (w != null) player.playSoundToPlayer(DreadSounds.SWELL, SoundCategory.AMBIENT, 1.0f, 1.0f);
	}

	public static WatcherEntity spawnWatcher(ServerWorld world, ServerPlayerEntity player, Vec3d at) {
		BlockPos stand = WatcherEntity.findStand(world, BlockPos.ofFloored(at));
		if (stand == null) return null;
		WatcherEntity w = ModEntities.WATCHER.create(world);
		if (w == null) return null;
		w.refreshPositionAndAngles(stand.getX() + 0.5, stand.getY(), stand.getZ() + 0.5, 0, 0);
		w.setTarget(player);
		world.spawnEntity(w);
		return w;
	}
}
