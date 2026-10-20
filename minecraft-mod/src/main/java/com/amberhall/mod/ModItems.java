package com.amberhall.mod;

import net.minecraft.item.Item;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModItems {
	public static final Item STALKER_SPAWN_EGG = Registry.register(Registries.ITEM, AmberhallMod.id("stalker_spawn_egg"),
		new SpawnEggItem(ModEntities.STALKER, 0x4a4a51, 0xffb02e, new Item.Settings()));

	public static void init() {
	}
}
