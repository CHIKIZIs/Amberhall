package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.registry.FlammableBlockRegistry;
import net.fabricmc.fabric.api.registry.StrippableBlockRegistry;
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
		StrippableBlockRegistry.register(ModBlocks.GLOW_LOG, ModBlocks.STRIPPED_GLOW_LOG);
		FlammableBlockRegistry flammable = FlammableBlockRegistry.getDefaultInstance();
		for (var b : new net.minecraft.block.Block[] {ModBlocks.GLOW_PLANKS, ModBlocks.GLOW_STAIRS, ModBlocks.GLOW_SLAB, ModBlocks.GLOW_FENCE, ModBlocks.GLOW_FENCE_GATE}) {
			flammable.add(b, 5, 20);
		}
		flammable.add(ModBlocks.GLOW_LOG, 5, 5);
		flammable.add(ModBlocks.STRIPPED_GLOW_LOG, 5, 5);
		ModEntities.init();
		ModItems.init();
		ModEffects.init();

		// Дублируем предметы в обычные вкладки креатива, чтобы их было легко найти и в поиске.
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.BUILDING_BLOCKS).register(e -> {
			e.add(ModBlocks.AMBER_BLOCK);
			e.add(ModBlocks.AMBER_BRICKS);
			e.add(ModBlocks.AMBER_BRICK_STAIRS);
			e.add(ModBlocks.AMBER_BRICK_SLAB);
			e.add(ModBlocks.AMBER_BRICK_WALL);
			e.add(ModBlocks.GLOW_PLANKS);
			e.add(ModBlocks.GLOW_STAIRS);
			e.add(ModBlocks.GLOW_SLAB);
			e.add(ModBlocks.GLOW_FENCE);
			e.add(ModBlocks.GLOW_FENCE_GATE);
			e.add(ModBlocks.GLOW_DOOR);
			e.add(ModBlocks.GLOW_TRAPDOOR);
			e.add(ModBlocks.GLOW_BUTTON);
			e.add(ModBlocks.GLOW_PRESSURE_PLATE);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.NATURAL).register(e -> {
			e.add(ModBlocks.AMBER_ORE);
			e.add(ModBlocks.LUMINOUS_MOSS);
			e.add(ModBlocks.GLOW_LOG);
			e.add(ModBlocks.GLOW_CAP);
			e.add(ModBlocks.STRIPPED_GLOW_LOG);
			e.add(ModBlocks.GLOW_FERN);
			e.add(ModBlocks.SPORE_BULB);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.INGREDIENTS).register(e -> e.add(ModItems.AMBER_GEM));
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.COMBAT).register(e -> {
			e.add(ModItems.AMBER_SWORD);
			e.add(ModItems.AMBER_AXE);
			e.add(ModItems.AMBER_HELMET);
			e.add(ModItems.AMBER_CHESTPLATE);
			e.add(ModItems.AMBER_LEGGINGS);
			e.add(ModItems.AMBER_BOOTS);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.TOOLS).register(e -> {
			e.add(ModItems.AMBER_PICKAXE);
			e.add(ModItems.AMBER_SHOVEL);
			e.add(ModItems.AMBER_AXE);
			e.add(ModItems.AMBER_HOE);
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.FOOD_AND_DRINK).register(e -> e.add(ModItems.AMBER_APPLE));

		ItemGroupEvents.modifyEntriesEvent(ItemGroups.FOOD_AND_DRINK).register(e -> {
			e.add(PotionContentsComponent.createStack(Items.POTION, ModEffects.RAGE_POTION));
			e.add(PotionContentsComponent.createStack(Items.SPLASH_POTION, ModEffects.RAGE_POTION));
			e.add(PotionContentsComponent.createStack(Items.LINGERING_POTION, ModEffects.RAGE_POTION));
		});
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> {
			e.add(ModItems.AMBER_BEETLE_SPAWN_EGG);
			e.add(ModItems.LEVIATHAN_SPAWN_EGG);
			e.add(ModItems.GLOW_MOTH_SPAWN_EGG);
		});

		// Янтарные жуки живут в пещерах Верхнего мира, группами по 2–3.
		BiomeModifications.addSpawn(BiomeSelectors.foundInOverworld(), SpawnGroup.MONSTER, ModEntities.AMBER_BEETLE, 25, 2, 3);

		// Левиафаны: только глубокие океаны, очень редко и по одному.
		BiomeModifications.addSpawn(BiomeSelectors.tag(BiomeTags.IS_DEEP_OCEAN), SpawnGroup.WATER_CREATURE, ModEntities.LEVIATHAN, 1, 1, 1);

		// Янтарная руда появляется в подземельях Верхнего мира (описание в data/amberhall/worldgen).
		BiomeModifications.addFeature(
			BiomeSelectors.foundInOverworld(),
			GenerationStep.Feature.UNDERGROUND_ORES,
			RegistryKey.of(RegistryKeys.PLACED_FEATURE, id("amber_ore")));
	}
}
