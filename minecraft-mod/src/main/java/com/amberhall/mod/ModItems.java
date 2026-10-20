package com.amberhall.mod;

import net.minecraft.item.Item;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModItems {
	public static final Item STALKER_SPAWN_EGG = register("stalker_spawn_egg",
		new SpawnEggItem(ModEntities.STALKER, 0x4a4a51, 0xffb02e, new Item.Settings()));
	public static final Item FROST_CREEPER_SPAWN_EGG = register("frost_creeper_spawn_egg",
		new SpawnEggItem(ModEntities.FROST_CREEPER, 0xa9dcf2, 0x3f78b4, new Item.Settings()));
	public static final Item DESERT_CREEPER_SPAWN_EGG = register("desert_creeper_spawn_egg",
		new SpawnEggItem(ModEntities.DESERT_CREEPER, 0xe8cf8e, 0xf0a0a8, new Item.Settings()));
	public static final Item ICE_SHARD = register("ice_shard", new IceShardItem(new Item.Settings()));

	private static Item register(String name, Item item) {
		return Registry.register(Registries.ITEM, AmberhallMod.id(name), item);
	}

	public static void init() {
	}
}
