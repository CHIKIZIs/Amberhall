package com.amberhall.mod;

import java.util.Random;
import java.util.Set;

import net.minecraft.entity.passive.BatEntity;
import net.minecraft.registry.RegistryKey;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeKeys;

/**
 * Расцветки летучих мышей: у каждой мыши свой случайный цвет, закреплённый за её UUID (поэтому не мигает).
 * Биом на цвет не влияет, кроме одного исключения: в ледяных биомах мышь всегда морозная (и только там).
 */
public final class BatColors {
	private static final String[] SKINS = {"classic", "shadow", "albino", "crimson", "ocean", "forest", "amber", "violet", "cherry"};
	private static final int[] WEIGHTS = {16, 12, 8, 12, 12, 12, 10, 10, 8};

	private static final Set<RegistryKey<Biome>> ICY = Set.of(BiomeKeys.SNOWY_PLAINS, BiomeKeys.SNOWY_TAIGA, BiomeKeys.ICE_SPIKES, BiomeKeys.GROVE,
		BiomeKeys.SNOWY_SLOPES, BiomeKeys.FROZEN_PEAKS, BiomeKeys.JAGGED_PEAKS, BiomeKeys.FROZEN_RIVER, BiomeKeys.SNOWY_BEACH,
		BiomeKeys.FROZEN_OCEAN, BiomeKeys.DEEP_FROZEN_OCEAN);

	private BatColors() {
	}

	public static Identifier texture(BatEntity bat) {
		boolean icy = bat.getWorld().getBiome(bat.getBlockPos()).getKey().map(ICY::contains).orElse(false);
		if (icy) {
			return AmberhallMod.id("textures/entity/bat/frost.png");
		}
		Random rng = new Random(bat.getUuid().getLeastSignificantBits() ^ bat.getUuid().getMostSignificantBits());
		int total = 0;
		for (int w : WEIGHTS) total += w;
		int pick = rng.nextInt(total);
		for (int i = 0; i < SKINS.length; i++) {
			pick -= WEIGHTS[i];
			if (pick < 0) return AmberhallMod.id("textures/entity/bat/" + SKINS[i] + ".png");
		}
		return AmberhallMod.id("textures/entity/bat/classic.png");
	}
}
