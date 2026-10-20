package com.amberhall.mod;

import net.minecraft.registry.RegistryKey;
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeKeys;

/** Биомные разновидности крипера: размеры, характеристики, цвет яйца, биомы появления. */
public enum VariantType {
	SWAMP("swamp", 0.6f, 1.9f, 20, 0.25, 0xcfe84a, 0x1f3a22, "Болотный крипер", "Swamp Creeper", BiomeKeys.SWAMP, BiomeKeys.MANGROVE_SWAMP),
	JUNGLE("jungle", 0.6f, 1.9f, 20, 0.30, 0x52bd38, 0x1e6a12, "Джунглевый крипер", "Jungle Creeper", BiomeKeys.JUNGLE, BiomeKeys.SPARSE_JUNGLE, BiomeKeys.BAMBOO_JUNGLE),
	MUSHROOM("mushroom", 0.7f, 1.9f, 20, 0.25, 0xcc3a30, 0x544a64, "Грибной крипер", "Mushroom Creeper", BiomeKeys.MUSHROOM_FIELDS),
	BADLANDS("badlands", 0.6f, 2.0f, 20, 0.25, 0xcf7e40, 0x7e4e2e, "Крипер бесплодных земель", "Badlands Creeper", BiomeKeys.BADLANDS, BiomeKeys.ERODED_BADLANDS, BiomeKeys.WOODED_BADLANDS),
	CAVE("cave", 0.8f, 1.7f, 30, 0.22, 0x80808a, 0x505055, "Пещерный крипер", "Cave Creeper", BiomeKeys.DRIPSTONE_CAVES),
	MEADOW("meadow", 0.6f, 1.7f, 20, 0.25, 0x58ae48, 0xe04848, "Луговой крипер", "Meadow Creeper", BiomeKeys.MEADOW, BiomeKeys.FLOWER_FOREST, BiomeKeys.CHERRY_GROVE),
	DARKFOREST("darkforest", 0.6f, 1.7f, 20, 0.25, 0x614c36, 0xcc3030, "Крипер тёмного леса", "Dark Forest Creeper", BiomeKeys.DARK_FOREST);

	public final String id;
	public final float width, height;
	public final double health, speed;
	public final int eggPrimary, eggSecondary;
	public final String ru, en;
	public final RegistryKey<Biome>[] biomes;

	@SafeVarargs
	VariantType(String id, float width, float height, double health, double speed, int eggPrimary, int eggSecondary, String ru, String en, RegistryKey<Biome>... biomes) {
		this.id = id;
		this.width = width;
		this.height = height;
		this.health = health;
		this.speed = speed;
		this.eggPrimary = eggPrimary;
		this.eggSecondary = eggSecondary;
		this.ru = ru;
		this.en = en;
		this.biomes = biomes;
	}

	public String entityName() {
		return id + "_creeper";
	}
}
