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
 * Модель светящегося мотылька. Части и текстуры генерирует tools/moth_gen.py,
 * исходник для Blockbench: blockbench/glow_moth.bbmodel.
 */
public class GlowMothModel extends SinglePartEntityModel<GlowMothEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("glow_moth"), "main");

	private final ModelPart root;
	private final ModelPart body, head, antennaL, antennaR, wingL, wingR;

	public GlowMothModel(ModelPart root) {
		this.root = root;
		this.body = root.getChild("body");
		this.head = body.getChild("head");
		this.antennaL = head.getChild("antenna_l");
		this.antennaR = head.getChild("antenna_r");
		this.wingL = body.getChild("wing_l");
		this.wingR = body.getChild("wing_r");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-1.5F, -1.5F, -3F, 3F, 3F, 6F), ModelTransform.of(0F, 18F, 0F, 0.25F, 0F, 0F));
		ModelPartData headData = bodyData.addChild("head", ModelPartBuilder.create().uv(28, 9).cuboid(-1.5F, -1.5F, -3F, 3F, 3F, 3F), ModelTransform.of(0F, 0F, -3F, -0.25F, 0F, 0F));
		ModelPartData antenna_lData = headData.addChild("antenna_l", ModelPartBuilder.create().uv(40, 9).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(1F, -1.5F, -2.5F, -0.5F, 0F, -0.3F));
		ModelPartData antenna_rData = headData.addChild("antenna_r", ModelPartBuilder.create().uv(44, 9).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-1F, -1.5F, -2.5F, -0.5F, 0F, 0.3F));
		ModelPartData wing_lData = bodyData.addChild("wing_l", ModelPartBuilder.create().uv(18, 0).cuboid(0F, -0.25F, -0.5F, 8F, 0.5F, 6F), ModelTransform.of(1.5F, -1.5F, -1.5F, 0F, 0F, -0.3F));
		ModelPartData wing_rData = bodyData.addChild("wing_r", ModelPartBuilder.create().uv(0, 9).cuboid(-8F, -0.25F, -0.5F, 8F, 0.5F, 6F), ModelTransform.of(-1.5F, -1.5F, -1.5F, 0F, 0F, 0.3F));
		return TexturedModelData.of(data, 64, 32);
	}

	@Override
	public void setAngles(GlowMothEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		// мягкие взмахи крыльев вокруг сложенного положения; в полёте — быстрее
		float flap = MathHelper.sin(animationProgress * 0.9f) * 0.75f;
		wingL.roll = -0.3f - flap;
		wingR.roll = 0.3f + flap;
		// тело слегка покачивается, усики дрожат
		body.pitch = 0.25f + MathHelper.sin(animationProgress * 0.45f) * 0.06f;
		float sway = MathHelper.sin(animationProgress * 0.25f) * 0.12f;
		antennaL.roll = -0.3f + sway;
		antennaR.roll = 0.3f - sway;
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.6f;
		head.pitch = -0.25f + headPitch * MathHelper.RADIANS_PER_DEGREE * 0.6f;
		root.pivotY = 0;
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
