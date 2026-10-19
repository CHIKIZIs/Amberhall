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
 * Модель глубинного удильщика. Части и текстуры генерирует tools/angler_gen.py,
 * исходник для Blockbench: blockbench/deep_angler.bbmodel.
 */
public class AnglerModel extends SinglePartEntityModel<AnglerEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("deep_angler"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart stalk1, stalk2;
	private final ModelPart tail, tailFin;
	private final ModelPart finL, finR;

	public AnglerModel(ModelPart root) {
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		this.stalk1 = root.getChild("stalk1");
		this.stalk2 = stalk1.getChild("stalk2");
		this.tail = root.getChild("tail");
		this.tailFin = tail.getChild("tail_fin");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData headData = rootData.addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-4F, -4F, -5F, 8F, 8F, 7F), ModelTransform.pivot(0F, 15F, -1F));
		ModelPartData lower_jawData = rootData.addChild("lower_jaw", ModelPartBuilder.create().uv(62, 0).cuboid(-3.5F, -1F, -7F, 7F, 3F, 7F), ModelTransform.of(0F, 18.5F, 0F, 0.25F, 0F, 0F));
		ModelPartData tooth_u0Data = headData.addChild("tooth_u0", ModelPartBuilder.create().uv(60, 15).cuboid(-3F, 0.5F, -5.3F, 1F, 3F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_u1Data = headData.addChild("tooth_u1", ModelPartBuilder.create().uv(76, 15).cuboid(-1F, 0.5F, -5.3F, 1F, 2F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_u2Data = headData.addChild("tooth_u2", ModelPartBuilder.create().uv(64, 15).cuboid(1F, 0.5F, -5.3F, 1F, 3F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_u3Data = headData.addChild("tooth_u3", ModelPartBuilder.create().uv(80, 15).cuboid(3F, 0.5F, -5.3F, 1F, 2F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_l0Data = lower_jawData.addChild("tooth_l0", ModelPartBuilder.create().uv(68, 15).cuboid(-2F, -4F, -6.6F, 1F, 3F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_l1Data = lower_jawData.addChild("tooth_l1", ModelPartBuilder.create().uv(84, 15).cuboid(0F, -3F, -6.6F, 1F, 2F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_l2Data = lower_jawData.addChild("tooth_l2", ModelPartBuilder.create().uv(72, 15).cuboid(2F, -4F, -6.6F, 1F, 3F, 1F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_lData = headData.addChild("eye_l", ModelPartBuilder.create().uv(12, 15).cuboid(4F, -3.5F, -4.5F, 1F, 3F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_rData = headData.addChild("eye_r", ModelPartBuilder.create().uv(20, 15).cuboid(-5F, -3.5F, -4.5F, 1F, 3F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData stalk1Data = rootData.addChild("stalk1", ModelPartBuilder.create().uv(28, 15).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(0F, 11F, -4F, 0.5F, 0F, 0F));
		ModelPartData stalk2Data = stalk1Data.addChild("stalk2", ModelPartBuilder.create().uv(32, 15).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(0F, -4F, 0F, 0.9F, 0F, 0F));
		ModelPartData lureData = stalk2Data.addChild("lure", ModelPartBuilder.create().uv(0, 15).cuboid(-1.5F, -1.5F, -1.5F, 3F, 3F, 3F), ModelTransform.pivot(0F, -4F, 0F));
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(40, 0).cuboid(-3F, -3F, 0F, 6F, 6F, 5F), ModelTransform.pivot(0F, 15F, 1F));
		ModelPartData dorsalData = rootData.addChild("dorsal", ModelPartBuilder.create().uv(106, 0).cuboid(-0.5F, -3F, 0F, 1F, 3F, 5F), ModelTransform.pivot(0F, 12F, 2F));
		ModelPartData tailData = rootData.addChild("tail", ModelPartBuilder.create().uv(90, 0).cuboid(-2F, -2F, 0F, 4F, 4F, 4F), ModelTransform.pivot(0F, 15F, 6F));
		ModelPartData tail_finData = tailData.addChild("tail_fin", ModelPartBuilder.create().uv(30, 0).cuboid(-0.5F, -4F, 0F, 1F, 8F, 4F), ModelTransform.pivot(0F, 0F, 4F));
		ModelPartData fin_lData = rootData.addChild("fin_l", ModelPartBuilder.create().uv(36, 15).cuboid(0F, -0.5F, -1.5F, 3F, 1F, 3F), ModelTransform.of(3F, 18F, 1.5F, 0F, 0F, 0.4F));
		ModelPartData fin_rData = rootData.addChild("fin_r", ModelPartBuilder.create().uv(48, 15).cuboid(-3F, -0.5F, -1.5F, 3F, 1F, 3F), ModelTransform.of(-3F, 18F, 1.5F, 0F, 0F, -0.4F));
		return TexturedModelData.of(data, 128, 64);
	}

	@Override
	public void setAngles(AnglerEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		// хвост: волна идёт от туловища к плавнику; чем быстрее плывёт, тем сильнее взмахи
		float speed = 0.8f + limbDistance * 1.5f;
		float amp = 0.18f + limbDistance * 0.35f;
		float t = animationProgress * 0.18f * speed;
		tail.yaw = MathHelper.sin(t) * amp;
		tailFin.yaw = MathHelper.sin(t - 0.9f) * amp * 1.4f;

		// плавники машут
		float flap = MathHelper.sin(animationProgress * 0.22f) * 0.35f;
		finL.roll = 0.35f + flap;
		finR.roll = -0.35f - flap;

		// приманка покачивается, как живая
		stalk1.pitch = 0.55f + MathHelper.sin(animationProgress * 0.09f) * 0.1f;
		stalk2.pitch = 0.9f + MathHelper.sin(animationProgress * 0.09f + 1.0f) * 0.16f;

		// пасть: в бою широко раскрывается и щёлкает, в покое чуть приоткрыта
		if (entity.isAttacking()) {
			lowerJaw.pitch = 0.55f + MathHelper.sin(animationProgress * 0.7f) * 0.35f;
		} else {
			lowerJaw.pitch = 0.1f + MathHelper.sin(animationProgress * 0.12f) * 0.04f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
