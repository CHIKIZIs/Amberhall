package com.amberhall.mod;

import com.mojang.datafixers.util.Pair;
import java.util.function.Consumer;
import net.minecraft.registry.Registry;
import net.minecraft.registry.RegistryKey;
import net.minecraft.util.Identifier;
import net.minecraft.world.biome.source.util.MultiNoiseUtil;
import net.minecraft.world.biome.Biome;
import net.minecraft.world.biome.BiomeKeys;
import terrablender.api.Region;
import terrablender.api.RegionType;

/**
 * Регион TerraBlender: в нём вместо тёмного леса растёт светящаяся чаща.
 * Вес региона мал, поэтому чаща встречается редко, примерно как грибное поле.
 */
public class GlowRegion extends Region {
	public GlowRegion(Identifier name, int weight) {
		super(name, RegionType.OVERWORLD, weight);
	}

	@Override
	public void addBiomes(Registry<Biome> registry, Consumer<Pair<MultiNoiseUtil.NoiseHypercube, RegistryKey<Biome>>> mapper) {
		this.addModifiedVanillaOverworldBiomes(mapper, builder -> {
			builder.replaceBiome(BiomeKeys.DARK_FOREST, ModBiomes.GLOWING_THICKET);
		});
	}
}
