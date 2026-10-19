package com.amberhall.mod;

import net.minecraft.block.ShortPlantBlock;

/** Светящийся папоротник: обычное низкое растение, но с публичным конструктором (у ванильного он защищённый). */
public class GlowFernBlock extends ShortPlantBlock {
	public GlowFernBlock(Settings settings) {
		super(settings);
	}
}
