package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.model.CreeperEntityModel;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.entity.mob.CreeperEntity;
import net.minecraft.util.Identifier;
import net.minecraft.util.math.MathHelper;

/** Ванильная модель крипера со своей текстурой и размером; пульсация перед взрывом — как у обычного. */
public class ModCreeperRenderer<T extends CreeperEntity> extends MobEntityRenderer<T, CreeperEntityModel<T>> {
	private final Identifier texture;
	private final float size;

	public ModCreeperRenderer(EntityRendererFactory.Context context, String textureName, float size) {
		super(context, new CreeperEntityModel<>(context.getPart(EntityModelLayers.CREEPER)), 0.5f * size);
		this.texture = AmberhallMod.id("textures/entity/" + textureName + ".png");
		this.size = size;
	}

	@Override
	protected void scale(T entity, MatrixStack matrices, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		float h = 1.0f + MathHelper.sin(g * 100.0f) * g * 0.01f;
		g = MathHelper.clamp(g, 0.0f, 1.0f);
		g *= g;
		g *= g;
		matrices.scale((1.0f + g * 0.4f) * h * size, (1.0f + g * 0.1f) / h * size, (1.0f + g * 0.4f) * h * size);
	}

	@Override
	protected float getAnimationCounter(T entity, float tickDelta) {
		float g = entity.getClientFuseTime(tickDelta);
		return (int) (g * 10.0f) % 2 == 0 ? 0.0f : MathHelper.clamp(g, 0.5f, 1.0f);
	}

	@Override
	public Identifier getTexture(T entity) {
		return texture;
	}
}
