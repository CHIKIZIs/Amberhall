package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.item.ItemGroups;
import net.minecraft.util.Identifier;

public class AmberhallMod implements ModInitializer {
	public static final String MOD_ID = "amberhall";

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
		ModEntities.init();
		ModItems.init();
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> e.add(ModItems.STALKER_SPAWN_EGG));
		// спавн наравне с зомби и скелетами: весь Верхний мир, ночью и в тёмных пещерах
		BiomeModifications.addSpawn(BiomeSelectors.foundInOverworld(), SpawnGroup.MONSTER, ModEntities.STALKER, 60, 1, 2);
	}
}
