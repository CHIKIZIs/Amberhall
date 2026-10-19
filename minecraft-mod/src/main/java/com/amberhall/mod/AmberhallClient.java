package com.amberhall.mod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;

public class AmberhallClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(AmberBeetleModel.LAYER, AmberBeetleModel::getTexturedModelData);
		EntityModelLayerRegistry.registerModelLayer(DunkleosteusModel.LAYER, DunkleosteusModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.DUNKLEOSTEUS, DunkleosteusRenderer::new);
		EntityRendererRegistry.register(ModEntities.AMBER_BEETLE, AmberBeetleRenderer::new);
	}
}
