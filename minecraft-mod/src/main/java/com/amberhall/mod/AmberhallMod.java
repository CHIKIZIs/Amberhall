package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.biome.v1.ModificationPhase;
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroups;
import net.minecraft.item.Items;
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
		ModChests.init();
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> {
			e.add(ModItems.STALKER_SPAWN_EGG);
			e.add(ModItems.FROST_CREEPER_SPAWN_EGG);
			e.add(ModItems.DESERT_CREEPER_SPAWN_EGG);
			ModItems.VARIANT_EGGS.values().forEach(e::add);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.FUNCTIONAL).register(e -> e.addAfter(Items.CHEST, ModChests.ITEMS.toArray(new Item[0])));
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
		// пустынный крипер: в пустыне заменяет обычного
		var desert = BiomeSelectors.includeByKey(BiomeKeys.DESERT);
		BiomeModifications.create(id("desert_creeper_replaces_creeper")).add(ModificationPhase.REMOVALS, desert,
			ctx -> ctx.getSpawnSettings().removeSpawnsOfEntityType(EntityType.CREEPER));
		BiomeModifications.addSpawn(desert, SpawnGroup.MONSTER, ModEntities.DESERT_CREEPER, 100, 4, 4);
	
		// биомные криперы: в своих биомах заменяют обычного
		for (VariantType v : VariantType.values()) {
			var selector = BiomeSelectors.includeByKey(v.biomes);
			BiomeModifications.create(id(v.entityName() + "_replaces_creeper")).add(ModificationPhase.REMOVALS, selector,
				ctx -> ctx.getSpawnSettings().removeSpawnsOfEntityType(EntityType.CREEPER));
			BiomeModifications.addSpawn(selector, SpawnGroup.MONSTER, ModEntities.VARIANTS.get(v), 100, 4, 4);
		}
	}
}
