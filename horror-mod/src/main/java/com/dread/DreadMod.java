package com.dread;

import net.fabricmc.api.ModInitializer;
import net.fabricmc.fabric.api.networking.v1.PayloadTypeRegistry;
import net.minecraft.util.Identifier;

public class DreadMod implements ModInitializer {
	public static final String MOD_ID = "dread";

	public static Identifier id(String path) {
		return Identifier.of(MOD_ID, path);
	}

	@Override
	public void onInitialize() {
		DreadSounds.init();
		ModEntities.init();
		ModItems.init();
		DreadDirector.init();
		DreadCommands.init();
		PayloadTypeRegistry.playS2C().register(JumpscarePayload.ID, JumpscarePayload.CODEC);
	}
}
