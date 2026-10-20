package com.amberhall.mod;

import net.minecraft.client.render.entity.BatEntityRenderer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.entity.passive.BatEntity;
import net.minecraft.util.Identifier;

/** Ванильная летучая мышь со случайной расцветкой (ETF/OptiFine не нужны). */
public class ColoredBatRenderer extends BatEntityRenderer {
	public ColoredBatRenderer(EntityRendererFactory.Context context) {
		super(context);
	}

	@Override
	public Identifier getTexture(BatEntity entity) {
		return BatColors.texture(entity);
	}
}
