package com.amberhall.mod;

import net.minecraft.client.render.LightmapTextureManager;
import net.minecraft.client.render.OverlayTexture;
import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.VertexConsumer;
import net.minecraft.client.render.VertexConsumerProvider;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.FeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;

public class GlowMothRenderer extends MobEntityRenderer<GlowMothEntity, GlowMothModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/glow_moth.png");
	private static final Identifier GLOW = AmberhallMod.id("textures/entity/glow_moth_glow.png");

	public GlowMothRenderer(EntityRendererFactory.Context context) {
		super(context, new GlowMothModel(context.getPart(GlowMothModel.LAYER)), 0.2f);
		this.addFeature(new GlowFeature(this));
	}

	@Override
	public Identifier getTexture(GlowMothEntity entity) {
		return TEXTURE;
	}

	/** «Глазки» на крыльях и огонёк на брюшке светятся в темноте. */
	private static class GlowFeature extends FeatureRenderer<GlowMothEntity, GlowMothModel> {
		GlowFeature(FeatureRendererContext<GlowMothEntity, GlowMothModel> context) {
			super(context);
		}

		@Override
		public void render(MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light, GlowMothEntity entity,
				float limbAngle, float limbDistance, float tickDelta, float animationProgress, float headYaw, float headPitch) {
			VertexConsumer buffer = vertexConsumers.getBuffer(RenderLayer.getEyes(GLOW));
			this.getContextModel().render(matrices, buffer, LightmapTextureManager.MAX_LIGHT_COORDINATE, OverlayTexture.DEFAULT_UV);
		}
	}
}
