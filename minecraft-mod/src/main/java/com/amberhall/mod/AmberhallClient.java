package com.amberhall.mod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;

public class AmberhallClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(AmberBeetleModel.LAYER, AmberBeetleModel::getTexturedModelData);
		EntityModelLayerRegistry.registerModelLayer(AnglerModel.LAYER, AnglerModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.DEEP_ANGLER, AnglerRenderer::new);
		EntityRendererRegistry.register(ModEntities.AMBER_BEETLE, AmberBeetleRenderer::new);
	}
}
