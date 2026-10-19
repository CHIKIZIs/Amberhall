package com.amberhall.mod;

import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModBlocks {
	public static final Block AMBER_ORE = register("amber_ore",
		new Block(AbstractBlock.Settings.copy(Blocks.IRON_ORE)));
	public static final Block AMBER_BLOCK = register("amber_block",
		new Block(AbstractBlock.Settings.copy(Blocks.GOLD_BLOCK).luminance(state -> 8)));

	private static Block register(String name, Block block) {
		Registry.register(Registries.ITEM, AmberhallMod.id(name), new BlockItem(block, new Item.Settings()));
		return Registry.register(Registries.BLOCK, AmberhallMod.id(name), block);
	}

	public static void init() {
	}
}
