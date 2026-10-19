package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.item.ItemGroups;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.util.Identifier;
import net.minecraft.world.gen.GenerationStep;
import net.minecraft.world.gen.feature.PlacedFeature;

public class AmberhallMod implements ModInitializer {
	public static final String MOD_ID = "amberhall";

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
		ModBlocks.init();
		ModItems.init();

		// Дублируем предметы в обычные вкладки креатива, чтобы их было легко найти и в поиске.
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.BUILDING_BLOCKS).register(e -> e.add(ModBlocks.AMBER_BLOCK));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.NATURAL).register(e -> e.add(ModBlocks.AMBER_ORE));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.INGREDIENTS).register(e -> e.add(ModItems.AMBER_GEM));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.COMBAT).register(e -> e.add(ModItems.AMBER_SWORD));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register(e -> e.add(ModItems.AMBER_PICKAXE));

		// Янтарная руда появляется в подземельях Верхнего мира (описание в data/amberhall/worldgen).
		BiomeModifications.addFeature(
			BiomeSelectors.foundInOverworld(),
			GenerationStep.Feature.UNDERGROUND_ORES,
			RegistryKey.of(RegistryKeys.PLACED_FEATURE, id("amber_ore")));
	}
}
