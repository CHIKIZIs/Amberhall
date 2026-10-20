package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.model.CreeperEntityModel;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.MathHelper;

/** Ванильная модель крипера с ледяной текстурой; пульсация перед взрывом — как у обычного. */
public class FrostCreeperRenderer extends MobEntityRenderer<FrostCreeperEntity, CreeperEntityModel<FrostCreeperEntity>> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/frost_creeper.png");

	public FrostCreeperRenderer(EntityRendererFactory.Context context) {
		super(context, new CreeperEntityModel<>(context.getPart(EntityModelLayers.CREEPER)), 0.5f);
	}

	@Override
	protected void scale(FrostCreeperEntity entity, MatrixStack matrices, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		float h = 1.0f + MathHelper.sin(g * 100.0f) * g * 0.01f;
		g = MathHelper.clamp(g, 0.0f, 1.0f);
		g *= g;
		g *= g;
		matrices.scale((1.0f + g * 0.4f) * h, (1.0f + g * 0.1f) / h, (1.0f + g * 0.4f) * h);
	}

	@Override
	protected float getAnimationCounter(FrostCreeperEntity entity, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		return (int) (g * 10.0f) % 2 == 0 ? 0.0f : MathHelper.clamp(g, 0.5f, 1.0f);
	}

	@Override
	public Identifier getTexture(FrostCreeperEntity entity) {
		return TEXTURE;
	}
}
