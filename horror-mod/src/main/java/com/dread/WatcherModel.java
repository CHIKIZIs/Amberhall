package com.dread;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/** Модель Наблюдателя: слишком высокий, слишком тонкий, руки до колен. */
public class WatcherModel extends SinglePartEntityModel<WatcherEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(DreadMod.id("watcher"), "main");
	private final ModelPart root, head, armL, armR;

	public WatcherModel(ModelPart root) {
		this.root = root;
		this.head = root.getChild("body").getChild("head");
		this.armL = root.getChild("body").getChild("arm_l");
		this.armR = root.getChild("body").getChild("arm_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData body = r.addChild("body", ModelPartBuilder.create().uv(24, 0).cuboid(-3F, -14F, -1.5F, 6F, 14F, 3F), ModelTransform.pivot(0F, 10F, 0F));
		body.addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-3F, -8F, -3F, 6F, 8F, 6F), ModelTransform.pivot(0F, -14F, 0F));
		body.addChild("arm_l", ModelPartBuilder.create().uv(0, 16).cuboid(-1F, 0F, -1F, 2F, 22F, 2F), ModelTransform.pivot(4F, -13F, 0F));
		body.addChild("arm_r", ModelPartBuilder.create().uv(8, 16).cuboid(-1F, 0F, -1F, 2F, 22F, 2F), ModelTransform.pivot(-4F, -13F, 0F));
		r.addChild("leg_l", ModelPartBuilder.create().uv(16, 20).cuboid(-1.5F, 0F, -1.5F, 3F, 14F, 3F), ModelTransform.pivot(1.5F, 10F, 0F));
		r.addChild("leg_r", ModelPartBuilder.create().uv(28, 20).cuboid(-1.5F, 0F, -1.5F, 3F, 14F, 3F), ModelTransform.pivot(-1.5F, 10F, 0F));
		return TexturedModelData.of(data, 64, 64);
	}

	@Override
	public void setAngles(WatcherEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		// неестественный наклон головы, лёгкая дрожь пальцев
		this.head.roll += 0.28f + MathHelper.sin(age * 0.04f) * 0.08f;
		this.head.pitch += 0.12f;
		this.armL.roll -= 0.03f + MathHelper.sin(age * 0.31f) * 0.015f;
		this.armR.roll += 0.03f + MathHelper.sin(age * 0.29f + 1.0f) * 0.015f;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
