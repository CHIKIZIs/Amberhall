package com.amberhall.mod;

import net.fabricmc.api.ModInitializer;
import net.minecraft.util.Identifier;

public class AmberhallMod implements ModInitializer {
	public static final String MOD_ID = "amberhall";

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
	}
}
