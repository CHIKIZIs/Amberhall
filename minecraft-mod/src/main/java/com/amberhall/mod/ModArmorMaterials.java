package com.amberhall.mod;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import net.minecraft.item.ArmorItem;
import net.minecraft.item.ArmorMaterial;
import net.minecraft.recipe.Ingredient;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;
import net.minecraft.registry.entry.RegistryEntry;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.Identifier;
import net.minecraft.util.Util;

/** Янтарная броня: между железом и алмазом. Слои на модели игрока — textures/models/armor/amber_layer_1/2.png. */
public final class ModArmorMaterials {
	public static final RegistryEntry<ArmorMaterial> AMBER = register("amber",
		Util.make(new EnumMap<>(ArmorItem.Type.class), map -> {
			map.put(ArmorItem.Type.BOOTS, 3);
			map.put(ArmorItem.Type.LEGGINGS, 6);
			map.put(ArmorItem.Type.CHESTPLATE, 7);
			map.put(ArmorItem.Type.HELMET, 3);
			map.put(ArmorItem.Type.BODY, 7);
		}), 20, 1.0f, 0.0f);

	private static RegistryEntry<ArmorMaterial> register(String name, Map<ArmorItem.Type, Integer> defense, int enchantability,
			float toughness, float knockbackResistance) {
		Identifier id = AmberhallMod.id(name);
		ArmorMaterial material = new ArmorMaterial(defense, enchantability, SoundEvents.ITEM_ARMOR_EQUIP_IRON,
			() -> Ingredient.ofItems(ModItems.AMBER_GEM), List.of(new ArmorMaterial.Layer(id)), toughness, knockbackResistance);
		return Registry.registerReference(Registries.ARMOR_MATERIAL, id, material);
	}

	public static void init() {
	}
}
