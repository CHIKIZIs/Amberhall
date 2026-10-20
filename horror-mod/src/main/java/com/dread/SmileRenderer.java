package com.dread;

import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.EyesFeatureRenderer;
import net.minecraft.util.Identifier;

public class SmileRenderer extends MobEntityRenderer<SmileEntity, SmileModel> {
	private static final Identifier TEXTURE = DreadMod.id("textures/entity/smile.png");
	private static final RenderLayer EYES = RenderLayer.getEyes(DreadMod.id("textures/entity/smile_eyes.png"));

	public SmileRenderer(EntityRendererFactory.Context context) {
		super(context, new SmileModel(context.getPart(SmileModel.LAYER)), 0.4f);
		this.addFeature(new EyesFeatureRenderer<SmileEntity, SmileModel>(this) {
			@Override
			public RenderLayer getEyesTexture() {
				return EYES;
			}
		});
	}

	@Override
	public Identifier getTexture(SmileEntity entity) {
		return TEXTURE;
	}
}
