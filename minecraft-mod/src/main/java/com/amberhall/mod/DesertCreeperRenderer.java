package com.amberhall.mod;

import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.EyesFeatureRenderer;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.MathHelper;

public class DesertCreeperRenderer extends MobEntityRenderer<DesertCreeperEntity, DesertCreeperModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/desert_creeper.png");
	private static final RenderLayer GLOW = RenderLayer.getEyes(AmberhallMod.id("textures/entity/desert_creeper_eyes.png"));

	public DesertCreeperRenderer(EntityRendererFactory.Context context) {
		super(context, new DesertCreeperModel(context.getPart(DesertCreeperModel.LAYER)), 0.35f);
		// светящиеся глаза и тлеющие трещины
		this.addFeature(new EyesFeatureRenderer<DesertCreeperEntity, DesertCreeperModel>(this) {
			@Override
			public RenderLayer getEyesTexture() {
				return GLOW;
			}
		});
	}

	@Override
	protected void scale(DesertCreeperEntity entity, MatrixStack matrices, float tickDelta) {
		// раздувается и дрожит перед взрывом, как обычный крипер
		float g = entity.getClientFuseTime(tickDelta);
		float h = 1.0f + MathHelper.sin(g * 100.0f) * g * 0.01f;
		g = MathHelper.clamp(g, 0.0f, 1.0f);
		g *= g;
		g *= g;
		matrices.scale((1.0f + g * 0.4f) * h, (1.0f + g * 0.1f) / h, (1.0f + g * 0.4f) * h);
	}

	@Override
	protected float getAnimationCounter(DesertCreeperEntity entity, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		return (int) (g * 10.0f) % 2 == 0 ? 0.0f : MathHelper.clamp(g, 0.5f, 1.0f);
	}

	@Override
	public Identifier getTexture(DesertCreeperEntity entity) {
		return TEXTURE;
	}
}
