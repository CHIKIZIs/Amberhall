package com.amberhall.mod;

import net.minecraft.client.model.ModelData;
import net.minecraft.client.model.ModelPart;
import net.minecraft.client.model.ModelPartBuilder;
import net.minecraft.client.model.ModelPartData;
import net.minecraft.client.model.ModelTransform;
import net.minecraft.client.model.TexturedModelData;
import net.minecraft.client.render.entity.model.EntityModelLayer;
import net.minecraft.client.render.entity.model.SinglePartEntityModel;
import net.minecraft.util.math.MathHelper;

/**
 * Модель бронированной рыбы. Части и текстуру генерирует tools/dunk_gen.py,
 * исходник для Blockbench: blockbench/dunkleosteus.bbmodel.
 */
public class DunkleosteusModel extends SinglePartEntityModel<DunkleosteusEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("dunkleosteus"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart body2, tail1, tailFin;
	private final ModelPart finL, finR, pelvicL, pelvicR;

	public DunkleosteusModel(ModelPart root) {
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		this.body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tailFin = tail1.getChild("tail_fin");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
		this.pelvicL = body2.getChild("pelvic_l");
		this.pelvicR = body2.getChild("pelvic_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData headData = rootData.addChild("head", ModelPartBuilder.create().uv(0, 32).cuboid(-5.5F, -4F, -9F, 11F, 7F, 9F), ModelTransform.pivot(0F, 12.5F, -5F));
		ModelPartData lower_jawData = rootData.addChild("lower_jaw", ModelPartBuilder.create().uv(80, 32).cuboid(-5F, -1.5F, -9F, 10F, 3F, 9F), ModelTransform.of(0F, 17F, -5F, 0.2F, 0F, 0F));
		ModelPartData tooth_ufData = headData.addChild("tooth_uf", ModelPartBuilder.create().uv(0, 59).cuboid(-5F, 2.2F, -9.6F, 10F, 3F, 0.6F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_ulData = headData.addChild("tooth_ul", ModelPartBuilder.create().uv(22, 48).cuboid(5.1F, 2.4F, -9F, 0.6F, 2F, 9F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_urData = headData.addChild("tooth_ur", ModelPartBuilder.create().uv(42, 48).cuboid(-5.7F, 2.4F, -9F, 0.6F, 2F, 9F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_lfData = lower_jawData.addChild("tooth_lf", ModelPartBuilder.create().uv(34, 59).cuboid(-5F, -3.7F, -9.6F, 10F, 2F, 0.6F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_llData = lower_jawData.addChild("tooth_ll", ModelPartBuilder.create().uv(62, 48).cuboid(4.5F, -3.7F, -9F, 0.6F, 2F, 9F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_lrData = lower_jawData.addChild("tooth_lr", ModelPartBuilder.create().uv(82, 48).cuboid(-5.1F, -3.7F, -9F, 0.6F, 2F, 9F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_lData = headData.addChild("eye_l", ModelPartBuilder.create().uv(22, 59).cuboid(5.5F, -3.2F, -7.5F, 1F, 2F, 2F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_rData = headData.addChild("eye_r", ModelPartBuilder.create().uv(28, 59).cuboid(-6.5F, -3.2F, -7.5F, 1F, 2F, 2F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(26, 0).cuboid(-5.5F, -5F, 0F, 11F, 10F, 11F), ModelTransform.pivot(0F, 14F, -5F));
		ModelPartData dorsalData = rootData.addChild("dorsal", ModelPartBuilder.create().uv(68, 32).cuboid(-0.5F, -8F, -2F, 1F, 8F, 5F), ModelTransform.of(0F, 9F, -1F, -0.3F, 0F, 0F));
		ModelPartData body2Data = rootData.addChild("body2", ModelPartBuilder.create().uv(40, 32).cuboid(-4F, -4F, 0F, 8F, 8F, 6F), ModelTransform.pivot(0F, 14F, 6F));
		ModelPartData tail1Data = body2Data.addChild("tail1", ModelPartBuilder.create().uv(0, 48).cuboid(-2.5F, -2.5F, 0F, 5F, 5F, 6F), ModelTransform.pivot(0F, 0F, 6F));
		ModelPartData tail_finData = tail1Data.addChild("tail_fin", ModelPartBuilder.create().uv(0, 0).cuboid(-0.5F, -10F, 0F, 1F, 20F, 12F), ModelTransform.pivot(0F, 0F, 6F));
		ModelPartData fin_lData = rootData.addChild("fin_l", ModelPartBuilder.create().uv(70, 0).cuboid(0F, 0F, -4F, 1F, 9F, 8F), ModelTransform.of(5.5F, 17.5F, 0F, 0.75F, 0F, -0.55F));
		ModelPartData fin_rData = rootData.addChild("fin_r", ModelPartBuilder.create().uv(88, 0).cuboid(-1F, 0F, -4F, 1F, 9F, 8F), ModelTransform.of(-5.5F, 17.5F, 0F, 0.75F, 0F, 0.55F));
		ModelPartData pelvic_lData = body2Data.addChild("pelvic_l", ModelPartBuilder.create().uv(102, 48).cuboid(0F, 0F, -2F, 1F, 6F, 4F), ModelTransform.of(3F, 3.5F, 1F, 0.3F, 0F, -0.4F));
		ModelPartData pelvic_rData = body2Data.addChild("pelvic_r", ModelPartBuilder.create().uv(112, 48).cuboid(-1F, 0F, -2F, 1F, 6F, 4F), ModelTransform.of(-3F, 3.5F, 1F, 0.3F, 0F, 0.4F));
		return TexturedModelData.of(data, 128, 64);
	}

	@Override
	public void setAngles(DunkleosteusEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		// пасть: в бою широко раскрывается и щёлкает, в покое приоткрыта
		if (entity.isAttacking()) {
			lowerJaw.pitch = 0.75f + MathHelper.sin(animationProgress * 0.5f) * 0.3f;
		} else {
			lowerJaw.pitch = 0.2f + MathHelper.sin(animationProgress * 0.1f) * 0.05f;
		}

		// волна по телу и хвосту: чем быстрее плывёт, тем сильнее изгиб
		float speed = 0.7f + limbDistance * 1.6f;
		float amp = 0.1f + limbDistance * 0.3f;
		float t = animationProgress * 0.15f * speed;
		body2.yaw = MathHelper.sin(t) * amp * 0.6f;
		tail1.yaw = MathHelper.sin(t - 0.9f) * amp;
		tailFin.yaw = MathHelper.sin(t - 1.7f) * amp * 0.8f;

		// грудные и брюшные плавники гребут
		float flap = MathHelper.sin(animationProgress * 0.2f) * 0.25f;
		finL.roll = -0.5f - flap;
		finR.roll = 0.5f + flap;
		pelvicL.roll = -0.4f - flap * 0.6f;
		pelvicR.roll = 0.4f + flap * 0.6f;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
