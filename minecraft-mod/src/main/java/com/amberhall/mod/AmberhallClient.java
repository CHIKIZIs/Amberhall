package com.amberhall.mod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.BuiltinItemRendererRegistry;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.render.block.entity.BlockEntityRendererFactories;
import net.minecraft.client.render.block.entity.ChestBlockEntityRenderer;
import net.minecraft.client.render.entity.FlyingItemEntityRenderer;
import net.minecraft.util.math.BlockPos;

public class AmberhallClient implements ClientModInitializer {
	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(StalkerModel.LAYER, StalkerModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.STALKER, StalkerRenderer::new);
		EntityRendererRegistry.register(ModEntities.FROST_CREEPER, FrostCreeperRenderer::new);
		EntityRendererRegistry.register(ModEntities.ICE_SHARD, FlyingItemEntityRenderer::new);
	
		// сундуки: ванильный рендерер, текстуру подменяет миксин
		BlockEntityRendererFactories.register(ModChests.BLOCK_ENTITY, ChestBlockEntityRenderer::new);
		for (WoodChestBlock block : ModChests.BLOCKS) {
			WoodChestBlockEntity preview = new WoodChestBlockEntity(BlockPos.ORIGIN, block.getDefaultState());
			BuiltinItemRendererRegistry.INSTANCE.register(block.asItem(), (stack, mode, matrices, vertexConsumers, light, overlay) ->
				MinecraftClient.getInstance().getBlockEntityRenderDispatcher().renderEntity(preview, matrices, vertexConsumers, light, overlay));
		}
	}
}
