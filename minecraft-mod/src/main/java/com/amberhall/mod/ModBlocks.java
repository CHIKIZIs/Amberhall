package com.amberhall.mod;

import net.minecraft.block.AbstractBlock;
import net.minecraft.block.Block;
import net.minecraft.block.Blocks;
import net.minecraft.block.BlockSetType;
import net.minecraft.block.ButtonBlock;
import net.minecraft.block.DoorBlock;
import net.minecraft.block.FenceBlock;
import net.minecraft.block.FenceGateBlock;
import net.minecraft.block.LanternBlock;
import net.minecraft.block.PressurePlateBlock;
import net.minecraft.block.SlabBlock;
import net.minecraft.block.StairsBlock;
import net.minecraft.block.TrapdoorBlock;
import net.minecraft.block.WallBlock;
import net.minecraft.block.WoodType;
import net.minecraft.item.TallBlockItem;
import net.minecraft.block.FlowerBlock;
import net.minecraft.block.PillarBlock;
import net.minecraft.block.MapColor;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.item.BlockItem;
import net.minecraft.item.Item;
import net.minecraft.registry.Registries;
import net.minecraft.registry.Registry;

public final class ModBlocks {
	public static final Block AMBER_ORE = register("amber_ore",
		new Block(AbstractBlock.Settings.copy(Blocks.IRON_ORE)));
	public static final Block AMBER_BLOCK = register("amber_block",
		new Block(AbstractBlock.Settings.copy(Blocks.GOLD_BLOCK).luminance(state -> 8)));

	// ---- биом «Светящаяся чаща» ----
	public static final Block LUMINOUS_MOSS = register("luminous_moss",
		new Block(AbstractBlock.Settings.copy(Blocks.MOSS_BLOCK).luminance(state -> 6)));
	public static final Block GLOW_LOG = register("glow_log",
		new PillarBlock(AbstractBlock.Settings.copy(Blocks.OAK_LOG).mapColor(MapColor.PURPLE).luminance(state -> 4)));
	public static final Block GLOW_CAP = register("glow_cap",
		new Block(AbstractBlock.Settings.copy(Blocks.SHROOMLIGHT).luminance(state -> 12)));
	public static final Block GLOW_FERN = register("glow_fern",
		new GlowFernBlock(AbstractBlock.Settings.copy(Blocks.FERN).luminance(state -> 7)));
	public static final Block SPORE_BULB = register("spore_bulb",
		new FlowerBlock(StatusEffects.NIGHT_VISION, 6.0f, AbstractBlock.Settings.copy(Blocks.DANDELION).luminance(state -> 10)));

	// ---- деревянный набор «светящееся дерево» ----
	private static AbstractBlock.Settings wood(Block base) {
		return AbstractBlock.Settings.copy(base).mapColor(MapColor.PURPLE);
	}
	public static final Block GLOW_PLANKS = register("glow_planks", new Block(wood(Blocks.OAK_PLANKS)));
	public static final Block STRIPPED_GLOW_LOG = register("stripped_glow_log", new PillarBlock(wood(Blocks.STRIPPED_OAK_LOG)));
	public static final Block GLOW_STAIRS = register("glow_stairs", new StairsBlock(GLOW_PLANKS.getDefaultState(), AbstractBlock.Settings.copy(GLOW_PLANKS)));
	public static final Block GLOW_SLAB = register("glow_slab", new SlabBlock(AbstractBlock.Settings.copy(GLOW_PLANKS)));
	public static final Block GLOW_FENCE = register("glow_fence", new FenceBlock(AbstractBlock.Settings.copy(GLOW_PLANKS)));
	public static final Block GLOW_FENCE_GATE = register("glow_fence_gate", new FenceGateBlock(WoodType.OAK, AbstractBlock.Settings.copy(GLOW_PLANKS)));
	public static final Block GLOW_DOOR = register("glow_door", new DoorBlock(BlockSetType.OAK, wood(Blocks.OAK_DOOR)),
		block -> new TallBlockItem(block, new Item.Settings()));
	public static final Block GLOW_TRAPDOOR = register("glow_trapdoor", new TrapdoorBlock(BlockSetType.OAK, wood(Blocks.OAK_TRAPDOOR)));
	public static final Block GLOW_BUTTON = register("glow_button", new ButtonBlock(BlockSetType.OAK, 30, wood(Blocks.OAK_BUTTON)));
	public static final Block GLOW_PRESSURE_PLATE = register("glow_pressure_plate", new PressurePlateBlock(BlockSetType.OAK, wood(Blocks.OAK_PRESSURE_PLATE)));

	// ---- янтарные кирпичи ----
	public static final Block AMBER_LANTERN = register("amber_lantern", new LanternBlock(AbstractBlock.Settings.copy(Blocks.LANTERN).luminance(state -> 15)));
	public static final Block AMBER_BRICKS = register("amber_bricks", new Block(AbstractBlock.Settings.copy(Blocks.STONE_BRICKS).mapColor(MapColor.GOLD)));
	public static final Block AMBER_BRICK_STAIRS = register("amber_brick_stairs", new StairsBlock(AMBER_BRICKS.getDefaultState(), AbstractBlock.Settings.copy(AMBER_BRICKS)));
	public static final Block AMBER_BRICK_SLAB = register("amber_brick_slab", new SlabBlock(AbstractBlock.Settings.copy(AMBER_BRICKS)));
	public static final Block AMBER_BRICK_WALL = register("amber_brick_wall", new WallBlock(AbstractBlock.Settings.copy(AMBER_BRICKS)));

	private static Block register(String name, Block block, java.util.function.Function<Block, Item> itemFactory) {
		Registry.register(Registries.ITEM, AmberhallMod.id(name), itemFactory.apply(block));
		return Registry.register(Registries.BLOCK, AmberhallMod.id(name), block);
	}

	private static Block register(String name, Block block) {
		Registry.register(Registries.ITEM, AmberhallMod.id(name), new BlockItem(block, new Item.Settings()));
		return Registry.register(Registries.BLOCK, AmberhallMod.id(name), block);
	}

	public static void init() {
	}
}
