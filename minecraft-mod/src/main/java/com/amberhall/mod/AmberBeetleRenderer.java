package com.amberhall.mod;

import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.util.Identifier;

public class AmberBeetleRenderer extends MobEntityRenderer<AmberBeetleEntity, AmberBeetleModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/amber_beetle.png");

	public AmberBeetleRenderer(EntityRendererFactory.Context context) {
		super(context, new AmberBeetleModel(context.getPart(AmberBeetleModel.LAYER)), 0.5f);
	}

	@Override
	public Identifier getTexture(AmberBeetleEntity entity) {
		return TEXTURE;
	}
}
