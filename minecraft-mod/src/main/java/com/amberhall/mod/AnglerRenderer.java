package com.amberhall.mod;

import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;

public class AnglerRenderer extends MobEntityRenderer<AnglerEntity, AnglerModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/deep_angler.png");
	private static final Identifier GLOW = AmberhallMod.id("textures/entity/deep_angler_glow.png");

	public AnglerRenderer(EntityRendererFactory.Context context) {
		super(context, new AnglerModel(context.getPart(AnglerModel.LAYER)), 0.5f);
		this.addFeature(new GlowFeature(this));
	}

	@Override
	public Identifier getTexture(AnglerEntity entity) {
		return TEXTURE;
	}

	/** Приманка и фотофоры светятся в темноте так же ярко, как глаза паука. */
	private static class GlowFeature extends FeatureRenderer<AnglerEntity, AnglerModel> {
		GlowFeature(FeatureRendererContext<AnglerEntity, AnglerModel> context) {
			super(context);
		}

		@Override
		public void render(MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light, AnglerEntity entity,
				float limbAngle, float limbDistance, float tickDelta, float animationProgress, float headYaw, float headPitch) {
			VertexConsumer buffer = vertexConsumers.getBuffer(RenderLayer.getEyes(GLOW));
			this.getContextModel().render(matrices, buffer, LightmapTextureManager.MAX_LIGHT_COORDINATE, OverlayTexture.DEFAULT_UV);
		}
	}
}
