package com.amberhall.mod;

import net.minecraft.registry.RegistryKey;
import net.minecraft.registry.RegistryKeys;
import net.minecraft.world.biome.Biome;

public final class ModBiomes {
	/** Светящаяся чаща: редкий лес, где ночью светятся мох, стволы и кроны. Описание — data/amberhall/worldgen/biome. */
	public static final RegistryKey<Biome> GLOWING_THICKET = RegistryKey.of(RegistryKeys.BIOME, AmberhallMod.id("glowing_thicket"));

	private ModBiomes() {
	}
}
