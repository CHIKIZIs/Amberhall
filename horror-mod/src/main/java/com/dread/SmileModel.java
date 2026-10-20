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

/** Улыбающийся: просто огромная ухмыляющаяся голова, висящая в воздухе. */
public class SmileModel extends SinglePartEntityModel<SmileEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(DreadMod.id("smile"), "main");
	private final ModelPart root, head;

	public SmileModel(ModelPart root) {
		this.root = root;
		this.head = root.getChild("head");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		data.getRoot().addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-5F, -5F, -5F, 10F, 10F, 10F), ModelTransform.pivot(0F, 14F, 0F));
		return TexturedModelData.of(data, 64, 64);
	}

	@Override
	public void setAngles(SmileEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		this.head.roll += MathHelper.sin(age * 0.07f) * 0.12f;
		this.head.pitch += MathHelper.sin(age * 0.05f) * 0.08f;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
