package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;

public class DunkleosteusRenderer extends MobEntityRenderer<DunkleosteusEntity, DunkleosteusModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/dunkleosteus.png");

	public DunkleosteusRenderer(EntityRendererFactory.Context context) {
		super(context, new DunkleosteusModel(context.getPart(DunkleosteusModel.LAYER)), 0.8f);
	}

	@Override
	protected void scale(DunkleosteusEntity entity, MatrixStack matrices, float amount) {
		matrices.scale(1.5f, 1.5f, 1.5f);
	}

	@Override
	public Identifier getTexture(DunkleosteusEntity entity) {
		return TEXTURE;
	}
}
