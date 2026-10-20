package com.dread;

import net.fabricmc.fabric.api.itemgroup.v1.ItemGroupEvents;
import net.minecraft.item.Item;
import net.minecraft.item.ItemGroups;
import net.minecraft.item.SpawnEggItem;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModItems {
	public static final Item WATCHER_EGG = reg("watcher_spawn_egg", new SpawnEggItem(ModEntities.WATCHER, 0x0b0b0d, 0xdedad2, new Item.Settings()));
	public static final Item CRAWLER_EGG = reg("crawler_spawn_egg", new SpawnEggItem(ModEntities.CRAWLER, 0xa8a49a, 0x5a0a0e, new Item.Settings()));
	public static final Item SMILE_EGG = reg("smile_spawn_egg", new SpawnEggItem(ModEntities.SMILE, 0x8a9a5e, 0x1a0000, new Item.Settings()));

	private static Item reg(String name, Item item) {
		return Registry.register(Registries.ITEM, DreadMod.id(name), item);
	}

	public static void init() {
		ItemGroupEvents.modifyEntriesEvent(ItemGroups.SPAWN_EGGS).register(e -> {
			e.add(WATCHER_EGG);
			e.add(CRAWLER_EGG);
			e.add(SMILE_EGG);
		});
	}
}
