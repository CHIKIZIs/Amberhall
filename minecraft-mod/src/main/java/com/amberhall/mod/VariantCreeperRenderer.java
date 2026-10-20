package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.MathHelper;

public class VariantCreeperRenderer extends MobEntityRenderer<VariantCreeperEntity, VariantCreeperModel> {
	private final Identifier texture;

	public VariantCreeperRenderer(EntityRendererFactory.Context context, VariantType variant) {
		super(context, new VariantCreeperModel(context.getPart(VariantCreeperModel.layer(variant))), 0.5f * Math.max(1.0f, variant.width / 0.6f));
		this.texture = AmberhallMod.id("textures/entity/" + variant.entityName() + ".png");
	}

	@Override
	protected void scale(VariantCreeperEntity entity, MatrixStack matrices, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		float h = 1.0f + MathHelper.sin(g * 100.0f) * g * 0.01f;
		g = MathHelper.clamp(g, 0.0f, 1.0f);
		g *= g;
		g *= g;
		matrices.scale((1.0f + g * 0.4f) * h, (1.0f + g * 0.1f) / h, (1.0f + g * 0.4f) * h);
	}

	@Override
	protected float getAnimationCounter(VariantCreeperEntity entity, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		return (int) (g * 10.0f) % 2 == 0 ? 0.0f : MathHelper.clamp(g, 0.5f, 1.0f);
	}

	@Override
	public Identifier getTexture(VariantCreeperEntity entity) {
		return texture;
	}
}
