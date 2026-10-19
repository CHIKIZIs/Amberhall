package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.biome.v1.BiomeModifications;
import net.fabricmc.fabric.api.biome.v1.BiomeSelectors;
import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.entity.SpawnGroup;
import net.minecraft.item.ItemGroups;
import net.minecraft.item.Items;
import net.minecraft.component.type.PotionContentsComponent;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.tag.BiomeTags;
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
		ModEntities.init();
		ModItems.init();
		ModEffects.init();

		// Дублируем предметы в обычные вкладки креатива, чтобы их было легко найти и в поиске.
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.BUILDING_BLOCKS).register(e -> e.add(ModBlocks.AMBER_BLOCK));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.NATURAL).register(e -> e.add(ModBlocks.AMBER_ORE));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.INGREDIENTS).register(e -> e.add(ModItems.AMBER_GEM));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.COMBAT).register(e -> e.add(ModItems.AMBER_SWORD));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register(e -> e.add(ModItems.AMBER_PICKAXE));

		ItemGroupEvents.modifyEntriesEvent(ItemGroups.FOOD_AND_DRINK).register(e -> {
			e.add(PotionContentsComponent.createStack(Items.POTION, ModEffects.RAGE_POTION));
			e.add(PotionContentsComponent.createStack(Items.SPLASH_POTION, ModEffects.RAGE_POTION));
			e.add(PotionContentsComponent.createStack(Items.LINGERING_POTION, ModEffects.RAGE_POTION));
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> {
			e.add(ModItems.AMBER_BEETLE_SPAWN_EGG);
			e.add(ModItems.ABYSSAL_SHARK_SPAWN_EGG);
		});

		// Янтарные жуки живут в пещерах Верхнего мира, группами по 2–3.
		BiomeModifications.addSpawn(BiomeSelectors.foundInOverworld(), SpawnGroup.MONSTER, ModEntities.AMBER_BEETLE, 25, 2, 3);

		// Глубинные акулы: только глубокие океаны, по одной-две.
		BiomeModifications.addSpawn(BiomeSelectors.tag(BiomeTags.IS_DEEP_OCEAN), SpawnGroup.WATER_CREATURE, ModEntities.ABYSSAL_SHARK, 6, 1, 2);

		// Янтарная руда появляется в подземельях Верхнего мира (описание в data/amberhall/worldgen).
		BiomeModifications.addFeature(
			BiomeSelectors.foundInOverworld(),
			GenerationStep.Feature.UNDERGROUND_ORES,
			RegistryKey.of(RegistryKeys.PLACED_FEATURE, id("amber_ore")));
	}
}
