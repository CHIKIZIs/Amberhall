package com.dread;

import net.minecraft.client.render.RenderLayer;
import net.minecraft.client.render.entity.EntityRendererFactory;
import net.minecraft.client.render.entity.MobEntityRenderer;
import net.minecraft.client.render.entity.feature.EyesFeatureRenderer;
import net.minecraft.util.Identifier;

public class WatcherRenderer extends MobEntityRenderer<WatcherEntity, WatcherModel> {
	private static final Identifier TEXTURE = DreadMod.id("textures/entity/watcher.png");
	private static final RenderLayer EYES = RenderLayer.getEyes(DreadMod.id("textures/entity/watcher_eyes.png"));

	public WatcherRenderer(EntityRendererFactory.Context context) {
		super(context, new WatcherModel(context.getPart(WatcherModel.LAYER)), 0.0f);
		this.addFeature(new EyesFeatureRenderer<WatcherEntity, WatcherModel>(this) {
			@Override
			public RenderLayer getEyesTexture() {
				return EYES;
			}
		});
	}

	@Override
	public Identifier getTexture(WatcherEntity entity) {
		return TEXTURE;
	}
}
