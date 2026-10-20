package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.ModificationPhase;
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.item.ItemGroups;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.BiomeKeys;

public class AmberhallMod implements ModInitializer {
	public static final String MOD_ID = "amberhall";

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
		ModEntities.init();
		ModItems.init();
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> {
			e.add(ModItems.STALKER_SPAWN_EGG);
			e.add(ModItems.FROST_CREEPER_SPAWN_EGG);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.INGREDIENTS).register(e -> e.add(ModItems.ICE_SHARD));
		// сталкер: наравне с зомби и скелетами — весь Верхний мир, ночью и в тёмных пещерах
		BiomeModifications.addSpawn(BiomeSelectors.foundInOverworld(), SpawnGroup.MONSTER, ModEntities.STALKER, 60, 1, 2);
		// ледяной крипер: в зимних биомах заменяет обычного крипера
		var snowy = BiomeSelectors.includeByKey(BiomeKeys.SNOWY_PLAINS, BiomeKeys.ICE_SPIKES, BiomeKeys.SNOWY_TAIGA, BiomeKeys.GROVE,
			BiomeKeys.SNOWY_SLOPES, BiomeKeys.FROZEN_PEAKS, BiomeKeys.JAGGED_PEAKS, BiomeKeys.FROZEN_RIVER, BiomeKeys.SNOWY_BEACH,
			BiomeKeys.FROZEN_OCEAN, BiomeKeys.DEEP_FROZEN_OCEAN);
		BiomeModifications.create(id("frost_creeper_replaces_creeper")).add(ModificationPhase.REMOVALS, snowy,
			ctx -> ctx.getSpawnSettings().removeSpawnsOfEntityType(EntityType.CREEPER));
		BiomeModifications.addSpawn(snowy, SpawnGroup.MONSTER, ModEntities.FROST_CREEPER, 100, 4, 4);
	}
}
