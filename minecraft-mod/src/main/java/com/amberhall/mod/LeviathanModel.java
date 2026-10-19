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
 * Модель глубинного левиафана. Части и текстуры генерирует tools/leviathan_gen.py,
 * исходник для Blockbench: blockbench/leviathan.bbmodel.
 */
public class LeviathanModel extends SinglePartEntityModel<LeviathanEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("leviathan"), "main");

	private final ModelPart root;
	private final ModelPart lowerJaw;
	private final ModelPart tail1, tail2, fluke;
	private final ModelPart finL, finR;

	public LeviathanModel(ModelPart root) {
		this.root = root;
		this.lowerJaw = root.getChild("lower_jaw");
		ModelPart body2 = root.getChild("body2");
		this.tail1 = body2.getChild("tail1");
		this.tail2 = tail1.getChild("tail2");
		this.fluke = tail2.getChild("fluke");
		this.finL = root.getChild("fin_l");
		this.finR = root.getChild("fin_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData headData = rootData.addChild("head", ModelPartBuilder.create().uv(0, 29).cuboid(-7F, -5F, -11F, 14F, 8F, 12F), ModelTransform.pivot(0F, 12F, -12F));
		ModelPartData lower_jawData = rootData.addChild("lower_jaw", ModelPartBuilder.create().uv(0, 49).cuboid(-6.5F, -1.5F, -12F, 13F, 4F, 12F), ModelTransform.of(0F, 16.5F, -12F, 0.25F, 0F, 0F));
		ModelPartData tooth_ufData = headData.addChild("tooth_uf", ModelPartBuilder.create().uv(0, 96).cuboid(-6.5F, 2.4F, -11.6F, 13F, 3F, 0.6F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_ulData = headData.addChild("tooth_ul", ModelPartBuilder.create().uv(26, 65).cuboid(6.4F, 2.6F, -11F, 0.6F, 2F, 11F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_urData = headData.addChild("tooth_ur", ModelPartBuilder.create().uv(50, 65).cuboid(-7F, 2.6F, -11F, 0.6F, 2F, 11F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_lfData = lower_jawData.addChild("tooth_lf", ModelPartBuilder.create().uv(28, 96).cuboid(-6F, -3.6F, -12.6F, 12F, 2F, 0.6F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_llData = lower_jawData.addChild("tooth_ll", ModelPartBuilder.create().uv(50, 49).cuboid(5.5F, -3.6F, -12F, 0.6F, 2F, 12F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData tooth_lrData = lower_jawData.addChild("tooth_lr", ModelPartBuilder.create().uv(76, 49).cuboid(-6.1F, -3.6F, -12F, 0.6F, 2F, 12F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_lData = headData.addChild("eye_l", ModelPartBuilder.create().uv(54, 88).cuboid(7F, -3.5F, -8F, 1F, 3F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_rData = headData.addChild("eye_r", ModelPartBuilder.create().uv(62, 88).cuboid(-8F, -3.5F, -8F, 1F, 3F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData crest_aData = headData.addChild("crest_a", ModelPartBuilder.create().uv(38, 88).cuboid(-1F, -5F, -1F, 2F, 5F, 2F), ModelTransform.of(0F, -5F, -5F, -0.35F, 0F, 0F));
		ModelPartData crest_bData = headData.addChild("crest_b", ModelPartBuilder.create().uv(70, 88).cuboid(-1F, -4F, -1F, 2F, 4F, 2F), ModelTransform.of(3F, -5F, -3F, -0.2F, 0F, 0.35F));
		ModelPartData crest_cData = headData.addChild("crest_c", ModelPartBuilder.create().uv(78, 88).cuboid(-1F, -4F, -1F, 2F, 4F, 2F), ModelTransform.of(-3F, -5F, -3F, -0.2F, 0F, -0.35F));
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-7.5F, -6.5F, 0F, 15F, 13F, 16F), ModelTransform.pivot(0F, 12F, -12F));
		ModelPartData spine0Data = bodyData.addChild("spine0", ModelPartBuilder.create().uv(46, 88).cuboid(-1F, -5F, -1F, 2F, 5F, 2F), ModelTransform.pivot(0F, -6.5F, 2F));
		ModelPartData spine1Data = bodyData.addChild("spine1", ModelPartBuilder.create().uv(86, 88).cuboid(-1F, -4F, -1F, 2F, 4F, 2F), ModelTransform.pivot(0F, -6.5F, 6F));
		ModelPartData spine2Data = bodyData.addChild("spine2", ModelPartBuilder.create().uv(94, 88).cuboid(-1F, -3F, -1F, 2F, 3F, 2F), ModelTransform.pivot(0F, -6.5F, 10F));
		ModelPartData body2Data = rootData.addChild("body2", ModelPartBuilder.create().uv(62, 0).cuboid(-6F, -5.5F, 0F, 12F, 11F, 10F), ModelTransform.pivot(0F, 12F, 4F));
		ModelPartData dorsalData = body2Data.addChild("dorsal", ModelPartBuilder.create().uv(102, 49).cuboid(-0.5F, -8F, -1F, 1F, 8F, 6F), ModelTransform.of(0F, -5.5F, 2F, -0.25F, 0F, 0F));
		ModelPartData tail1Data = body2Data.addChild("tail1", ModelPartBuilder.create().uv(52, 29).cuboid(-4F, -4F, 0F, 8F, 8F, 10F), ModelTransform.pivot(0F, 0F, 10F));
		ModelPartData tail2Data = tail1Data.addChild("tail2", ModelPartBuilder.create().uv(0, 65).cuboid(-2.5F, -2.5F, 0F, 5F, 5F, 8F), ModelTransform.pivot(0F, 0F, 10F));
		ModelPartData flukeData = tail2Data.addChild("fluke", ModelPartBuilder.create().uv(0, 78).cuboid(-11F, -0.5F, 0F, 22F, 1F, 9F), ModelTransform.pivot(0F, 0F, 8F));
		ModelPartData fin_lData = rootData.addChild("fin_l", ModelPartBuilder.create().uv(62, 78).cuboid(0F, -0.5F, -3.5F, 12F, 1F, 7F), ModelTransform.of(7.5F, 17F, -6F, 0.3F, 0F, -0.5F));
		ModelPartData fin_rData = rootData.addChild("fin_r", ModelPartBuilder.create().uv(0, 88).cuboid(-12F, -0.5F, -3.5F, 12F, 1F, 7F), ModelTransform.of(-7.5F, 17F, -6F, 0.3F, 0F, 0.5F));
		return TexturedModelData.of(data, 128, 128);
	}

	@Override
	public void setAngles(LeviathanEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		// пасть: в бою раскрывается во всю ширь и захлопывается, в покое чуть приоткрыта
		if (entity.isAttacking()) {
			lowerJaw.pitch = 0.8f + MathHelper.sin(animationProgress * 0.4f) * 0.35f;
		} else {
			lowerJaw.pitch = 0.22f + MathHelper.sin(animationProgress * 0.07f) * 0.05f;
		}

		// хвост бьёт по-китовьему: волна вверх-вниз (pitch) от туловища к плавнику
		float speed = 0.6f + limbDistance * 1.4f;
		float amp = 0.08f + limbDistance * 0.22f;
		float t = animationProgress * 0.12f * speed;
		tail1.pitch = MathHelper.sin(t) * amp;
		tail2.pitch = MathHelper.sin(t - 0.9f) * amp * 1.3f;
		fluke.pitch = MathHelper.sin(t - 1.8f) * amp * 1.6f;

		// ласты медленно гребут
		float flap = MathHelper.sin(animationProgress * 0.1f) * 0.18f;
		finL.roll = -0.5f - flap;
		finR.roll = 0.5f + flap;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
