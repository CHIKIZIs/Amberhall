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

/** Левиафан рисуется в 2,6 раза крупнее модели; глаза, кристаллы и фотофоры светятся в темноте. */
public class LeviathanRenderer extends MobEntityRenderer<LeviathanEntity, LeviathanModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/leviathan.png");
	private static final Identifier GLOW = AmberhallMod.id("textures/entity/leviathan_glow.png");

	public LeviathanRenderer(EntityRendererFactory.Context context) {
		super(context, new LeviathanModel(context.getPart(LeviathanModel.LAYER)), 2.2f);
		this.addFeature(new GlowFeature(this));
	}

	@Override
	protected void scale(LeviathanEntity entity, MatrixStack matrices, float amount) {
		matrices.scale(2.6f, 2.6f, 2.6f);
	}

	@Override
	public Identifier getTexture(LeviathanEntity entity) {
		return TEXTURE;
	}

	private static class GlowFeature extends FeatureRenderer<LeviathanEntity, LeviathanModel> {
		GlowFeature(FeatureRendererContext<LeviathanEntity, LeviathanModel> context) {
			super(context);
		}

		@Override
		public void render(MatrixStack matrices, VertexConsumerProvider vertexConsumers, int light, LeviathanEntity entity,
				float limbAngle, float limbDistance, float tickDelta, float animationProgress, float headYaw, float headPitch) {
			VertexConsumer buffer = vertexConsumers.getBuffer(RenderLayer.getEyes(GLOW));
			this.getContextModel().render(matrices, buffer, LightmapTextureManager.MAX_LIGHT_COORDINATE, OverlayTexture.DEFAULT_UV);
		}
	}
}
