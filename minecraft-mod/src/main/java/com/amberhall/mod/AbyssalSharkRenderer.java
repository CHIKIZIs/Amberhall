package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.model.DolphinEntityModel;
import net.minecraft.client.render.entity.model.EntityModelLayers;
import net.minecraft.client.util.math.MatrixStack;
import net.minecraft.util.Identifier;

/** Использует ванильную модель дельфина с собственной текстурой и вдвое большим размером. */
public class AbyssalSharkRenderer extends MobEntityRenderer<AbyssalSharkEntity, DolphinEntityModel<AbyssalSharkEntity>> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/abyssal_shark.png");

	public AbyssalSharkRenderer(EntityRendererFactory.Context context) {
		super(context, new DolphinEntityModel<>(context.getPart(EntityModelLayers.DOLPHIN)), 0.9f);
	}

	@Override
	protected void scale(AbyssalSharkEntity entity, MatrixStack matrices, float amount) {
		matrices.scale(2.2f, 2.2f, 2.2f);
	}

	@Override
	public Identifier getTexture(AbyssalSharkEntity entity) {
		return TEXTURE;
	}
}
