package com.amberhall.mod;

import java.util.ArrayList;
import java.util.List;

import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Blocks;
import net.minecraft.block.entity.BlockEntityType;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

/** Сундуки из каждого вида дерева: текстура сундука совпадает с досками, из которых он сделан. */
public final class ModChests {
	public static final String[] WOODS = {"oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "bamboo", "crimson", "warped"};

	public static final List<WoodChestBlock> BLOCKS = new ArrayList<>();
	public static final List<Item> ITEMS = new ArrayList<>();
	public static BlockEntityType<WoodChestBlockEntity> BLOCK_ENTITY;

	public static void init() {
		for (String wood : WOODS) {
			WoodChestBlock block = Registry.register(Registries.BLOCK, AmberhallMod.id(wood + "_chest"),
				new WoodChestBlock(wood, AbstractBlock.Settings.copy(Blocks.CHEST)));
			BLOCKS.add(block);
			ITEMS.add(Registry.register(Registries.ITEM, AmberhallMod.id(wood + "_chest"), new BlockItem(block, new Item.Settings())));
		}
		BLOCK_ENTITY = Registry.register(Registries.BLOCK_ENTITY_TYPE, AmberhallMod.id("wood_chest"),
			BlockEntityType.Builder.create(WoodChestBlockEntity::new, BLOCKS.toArray(new WoodChestBlock[0])).build(null));
	}
}
