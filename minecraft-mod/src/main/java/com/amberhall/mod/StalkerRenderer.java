package com.amberhall.mod;

import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.EyesFeatureRenderer;
import net.minecraft.client.render.entity.feature.FeatureRendererContext;
import net.minecraft.util.Identifier;

public class StalkerRenderer extends MobEntityRenderer<StalkerEntity, StalkerModel> {
	private static final Identifier TEXTURE = AmberhallMod.id("textures/entity/stalker.png");
	private static final RenderLayer EYES = RenderLayer.getEyes(AmberhallMod.id("textures/entity/stalker_eyes.png"));

	public StalkerRenderer(EntityRendererFactory.Context context) {
		super(context, new StalkerModel(context.getPart(StalkerModel.LAYER)), 0.5f);
		this.addFeature(new EyesFeatureRenderer<StalkerEntity, StalkerModel>(this) {
			@Override
			public RenderLayer getEyesTexture() {
				return EYES;
			}
		});
	}

	@Override
	public Identifier getTexture(StalkerEntity entity) {
		return TEXTURE;
	}
}
