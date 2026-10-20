package com.dread;

import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.EyesFeatureRenderer;
import net.minecraft.util.Identifier;

public class CrawlerRenderer extends MobEntityRenderer<CrawlerEntity, CrawlerModel> {
	private static final Identifier TEXTURE = DreadMod.id("textures/entity/crawler.png");
	private static final RenderLayer EYES = RenderLayer.getEyes(DreadMod.id("textures/entity/crawler_eyes.png"));

	public CrawlerRenderer(EntityRendererFactory.Context context) {
		super(context, new CrawlerModel(context.getPart(CrawlerModel.LAYER)), 0.4f);
		this.addFeature(new EyesFeatureRenderer<CrawlerEntity, CrawlerModel>(this) {
			@Override
			public RenderLayer getEyesTexture() {
				return EYES;
			}
		});
	}

	@Override
	public Identifier getTexture(CrawlerEntity entity) {
		return TEXTURE;
	}
}
