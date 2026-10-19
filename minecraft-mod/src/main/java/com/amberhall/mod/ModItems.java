package com.amberhall.mod;

import net.fabricmc.fabric.api.itemgroup.v1.FabricItemGroup;
import net.minecraft.component.type.FoodComponent;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.AxeItem;
import net.minecraft.item.HoeItem;
import net.minecraft.item.Item;
import net.minecraft.item.ShovelItem;
import net.minecraft.util.Rarity;
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

	public static final Item AMBER_AXE = register("amber_axe",
		new AxeItem(AmberToolMaterial.INSTANCE, new Item.Settings()
			.attributeModifiers(AxeItem.createAttributeModifiers(AmberToolMaterial.INSTANCE, 6.0f, -3.1f))));
	public static final Item AMBER_SHOVEL = register("amber_shovel",
		new ShovelItem(AmberToolMaterial.INSTANCE, new Item.Settings()
			.attributeModifiers(ShovelItem.createAttributeModifiers(AmberToolMaterial.INSTANCE, 1.5f, -3.0f))));
	public static final Item AMBER_HOE = register("amber_hoe",
		new HoeItem(AmberToolMaterial.INSTANCE, new Item.Settings()
			.attributeModifiers(HoeItem.createAttributeModifiers(AmberToolMaterial.INSTANCE, -2.0f, -1.0f))));

	public static final Item AMBER_HELMET = register("amber_helmet",
		new ArmorItem(ModArmorMaterials.AMBER, ArmorItem.Type.HELMET, new Item.Settings().maxDamage(ArmorItem.Type.HELMET.getMaxDamage(26))));
	public static final Item AMBER_CHESTPLATE = register("amber_chestplate",
		new ArmorItem(ModArmorMaterials.AMBER, ArmorItem.Type.CHESTPLATE, new Item.Settings().maxDamage(ArmorItem.Type.CHESTPLATE.getMaxDamage(26))));
	public static final Item AMBER_LEGGINGS = register("amber_leggings",
		new ArmorItem(ModArmorMaterials.AMBER, ArmorItem.Type.LEGGINGS, new Item.Settings().maxDamage(ArmorItem.Type.LEGGINGS.getMaxDamage(26))));
	public static final Item AMBER_BOOTS = register("amber_boots",
		new ArmorItem(ModArmorMaterials.AMBER, ArmorItem.Type.BOOTS, new Item.Settings().maxDamage(ArmorItem.Type.BOOTS.getMaxDamage(26))));

	/** Янтарное яблоко: поглощение и регенерация, как у золотого, но дольше держится щит. */
	public static final Item AMBER_APPLE = register("amber_apple",
		new Item(new Item.Settings().rarity(Rarity.RARE).food(new FoodComponent.Builder()
			.nutrition(4).saturationModifier(1.2f).alwaysEdible()
			.statusEffect(new StatusEffectInstance(StatusEffects.ABSORPTION, 2400, 1), 1.0f)
			.statusEffect(new StatusEffectInstance(StatusEffects.REGENERATION, 100, 1), 1.0f)
			.build())));

	public static final Item AMBER_BEETLE_SPAWN_EGG = register("amber_beetle_spawn_egg",
		new SpawnEggItem(ModEntities.AMBER_BEETLE, 0xE09A1A, 0x3B2A12, new Item.Settings()));

	public static final Item LEVIATHAN_SPAWN_EGG = register("leviathan_spawn_egg",
		new SpawnEggItem(ModEntities.LEVIATHAN, 0x1A3A82, 0xFFA010, new Item.Settings()));

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
				entries.add(ModBlocks.LUMINOUS_MOSS);
				entries.add(ModBlocks.GLOW_LOG);
				entries.add(ModBlocks.GLOW_CAP);
				entries.add(ModBlocks.GLOW_FERN);
				entries.add(ModBlocks.STRIPPED_GLOW_LOG);
				entries.add(ModBlocks.GLOW_PLANKS);
				entries.add(ModBlocks.GLOW_STAIRS);
				entries.add(ModBlocks.GLOW_SLAB);
				entries.add(ModBlocks.GLOW_FENCE);
				entries.add(ModBlocks.GLOW_FENCE_GATE);
				entries.add(ModBlocks.GLOW_DOOR);
				entries.add(ModBlocks.GLOW_TRAPDOOR);
				entries.add(ModBlocks.GLOW_BUTTON);
				entries.add(ModBlocks.GLOW_PRESSURE_PLATE);
				entries.add(ModBlocks.AMBER_BRICKS);
				entries.add(ModBlocks.AMBER_BRICK_STAIRS);
				entries.add(ModBlocks.AMBER_BRICK_SLAB);
				entries.add(ModBlocks.AMBER_BRICK_WALL);
				entries.add(ModBlocks.SPORE_BULB);
				entries.add(AMBER_SWORD);
				entries.add(AMBER_PICKAXE);
				entries.add(AMBER_AXE);
				entries.add(AMBER_SHOVEL);
				entries.add(AMBER_HOE);
				entries.add(AMBER_HELMET);
				entries.add(AMBER_CHESTPLATE);
				entries.add(AMBER_LEGGINGS);
				entries.add(AMBER_BOOTS);
				entries.add(AMBER_APPLE);
				entries.add(AMBER_BEETLE_SPAWN_EGG);
				entries.add(LEVIATHAN_SPAWN_EGG);
				entries.add(PotionContentsComponent.createStack(Items.POTION, ModEffects.RAGE_POTION));
				entries.add(PotionContentsComponent.createStack(Items.SPLASH_POTION, ModEffects.RAGE_POTION));
				entries.add(PotionContentsComponent.createStack(Items.LINGERING_POTION, ModEffects.RAGE_POTION));
			})
			.build());
	}
}
