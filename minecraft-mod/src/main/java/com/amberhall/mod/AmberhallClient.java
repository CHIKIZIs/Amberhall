package com.amberhall.mod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;

public class AmberhallClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(StalkerModel.LAYER, StalkerModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.STALKER, StalkerRenderer::new);
	}
}
