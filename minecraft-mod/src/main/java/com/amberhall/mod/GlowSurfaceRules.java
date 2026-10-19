package com.amberhall.mod;

import net.minecraft.world.gen.surfacebuilder.MaterialRules;

public final class GlowSurfaceRules {
	private GlowSurfaceRules() {
	}

	/** Верхний слой земли в светящейся чаще — светящийся мох (под водой и в пещерах обычные правила). */
	public static MaterialRules.MaterialRule make() {
		MaterialRules.MaterialRule moss = MaterialRules.block(ModBlocks.LUMINOUS_MOSS.getDefaultState());
		return MaterialRules.condition(MaterialRules.biome(ModBiomes.GLOWING_THICKET),
			MaterialRules.condition(MaterialRules.water(0, 0),
				MaterialRules.condition(MaterialRules.STONE_DEPTH_FLOOR, moss)));
	}
}
