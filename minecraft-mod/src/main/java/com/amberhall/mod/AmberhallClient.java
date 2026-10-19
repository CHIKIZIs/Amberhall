package com.amberhall.mod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.blockrenderlayer.v1.BlockRenderLayerMap;
import net.minecraft.client.render.RenderLayer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;

public class AmberhallClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		BlockRenderLayerMap.INSTANCE.putBlocks(RenderLayer.getCutout(), ModBlocks.GLOW_FERN, ModBlocks.SPORE_BULB,
			ModBlocks.GLOW_DOOR, ModBlocks.GLOW_TRAPDOOR, ModBlocks.AMBER_LANTERN);
		EntityModelLayerRegistry.registerModelLayer(AmberBeetleModel.LAYER, AmberBeetleModel::getTexturedModelData);
		EntityModelLayerRegistry.registerModelLayer(LeviathanModel.LAYER, LeviathanModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.LEVIATHAN, LeviathanRenderer::new);
		EntityModelLayerRegistry.registerModelLayer(GlowMothModel.LAYER, GlowMothModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.GLOW_MOTH, GlowMothRenderer::new);
		EntityRendererRegistry.register(ModEntities.AMBER_BEETLE, AmberBeetleRenderer::new);
	}
}
