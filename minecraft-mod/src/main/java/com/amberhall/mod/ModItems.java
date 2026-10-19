package com.amberhall.mod;

import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroup;
import net.minecraft.item.ItemStack;
import net.minecraft.item.Items;
import net.minecraft.item.PickaxeItem;
import net.minecraft.component.type.PotionContentsComponent;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.item.SwordItem;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.text.Text;

public final class ModItems {
	public static final Item AMBER_GEM = register("amber_gem", new Item(new Item.Settings()));

	public static final Item AMBER_SWORD = register("amber_sword",
		new SwordItem(AmberToolMaterial.INSTANCE, new Item.Settings()
			.attributeModifiers(SwordItem.createAttributeModifiers(AmberToolMaterial.INSTANCE, 3, -2.4f))));

	public static final Item AMBER_PICKAXE = register("amber_pickaxe",
		new PickaxeItem(AmberToolMaterial.INSTANCE, new Item.Settings()
			.attributeModifiers(PickaxeItem.createAttributeModifiers(AmberToolMaterial.INSTANCE, 1, -2.8f))));

	public static final Item AMBER_BEETLE_SPAWN_EGG = register("amber_beetle_spawn_egg",
		new SpawnEggItem(ModEntities.AMBER_BEETLE, 0xE09A1A, 0x3B2A12, new Item.Settings()));

	public static final Item ABYSSAL_SHARK_SPAWN_EGG = register("abyssal_shark_spawn_egg",
		new SpawnEggItem(ModEntities.ABYSSAL_SHARK, 0x22344E, 0xFFB020, new Item.Settings()));

	public static final RegistryKey<ItemGroup> GROUP = RegistryKey.of(RegistryKeys.ITEM_GROUP, AmberhallMod.id("amberhall"));

	private static Item register(String name, Item item) {
		return Registry.register(Registries.ITEM, AmberhallMod.id(name), item);
	}

	public static void init() {
		Registry.register(Registries.ITEM_GROUP, GROUP, FabricItemGroup.builder()
			.icon(() -> new ItemStack(AMBER_GEM))
			.displayName(Text.translatable("itemGroup.amberhall"))
			.entries((context, entries) -> {
				entries.add(AMBER_GEM);
				entries.add(ModBlocks.AMBER_ORE);
				entries.add(ModBlocks.AMBER_BLOCK);
				entries.add(AMBER_SWORD);
				entries.add(AMBER_PICKAXE);
				entries.add(AMBER_BEETLE_SPAWN_EGG);
				entries.add(ABYSSAL_SHARK_SPAWN_EGG);
				entries.add(PotionContentsComponent.createStack(Items.POTION, ModEffects.RAGE_POTION));
				entries.add(PotionContentsComponent.createStack(Items.SPLASH_POTION, ModEffects.RAGE_POTION));
				entries.add(PotionContentsComponent.createStack(Items.LINGERING_POTION, ModEffects.RAGE_POTION));
			})
			.build());
	}
}
