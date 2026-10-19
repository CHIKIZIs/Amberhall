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

/** Модель янтарного жука (экспорт из Blockbench: см. blockbench/amber_beetle.bbmodel). */
public class AmberBeetleModel extends SinglePartEntityModel<AmberBeetleEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("amber_beetle"), "main");

	private final ModelPart root;
	private final ModelPart head;
	private final ModelPart antennaL;
	private final ModelPart antennaR;
	private final ModelPart mandibleL;
	private final ModelPart mandibleR;
	private final ModelPart[] legsL = new ModelPart[3];
	private final ModelPart[] legsR = new ModelPart[3];

	public AmberBeetleModel(ModelPart root) {
		this.root = root;
		this.head = root.getChild("head");
		this.antennaL = head.getChild("antenna_l");
		this.antennaR = head.getChild("antenna_r");
		this.mandibleL = head.getChild("mandible_l");
		this.mandibleR = head.getChild("mandible_r");
		for (int i = 0; i < 3; i++) {
			legsL[i] = root.getChild("leg_l" + i);
			legsR[i] = root.getChild("leg_r" + i);
		}
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-4F, -3F, -5F, 8F, 5F, 10F), ModelTransform.pivot(0F, 19F, 0F));
		ModelPartData shellData = rootData.addChild("shell", ModelPartBuilder.create().uv(0, 16).cuboid(-3.5F, -5F, -4.5F, 7F, 2F, 9F), ModelTransform.pivot(0F, 19F, 0F));
		ModelPartData headData = rootData.addChild("head", ModelPartBuilder.create().uv(0, 28).cuboid(-3F, -2.5F, -4F, 6F, 4F, 4F), ModelTransform.pivot(0F, 19.5F, -5F));
		ModelPartData mandible_lData = headData.addChild("mandible_l", ModelPartBuilder.create().uv(24, 28).cuboid(1.2F, 0.5F, -7F, 1F, 1F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData mandible_rData = headData.addChild("mandible_r", ModelPartBuilder.create().uv(34, 28).cuboid(-2.2F, 0.5F, -7F, 1F, 1F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData antenna_lData = headData.addChild("antenna_l", ModelPartBuilder.create().uv(44, 28).cuboid(1F, -4F, -1F, 1F, 4F, 1F), ModelTransform.pivot(0F, -2F, -3F));
		ModelPartData antenna_rData = headData.addChild("antenna_r", ModelPartBuilder.create().uv(50, 28).cuboid(-2F, -4F, -1F, 1F, 4F, 1F), ModelTransform.pivot(0F, -2F, -3F));
		ModelPartData leg_l0Data = rootData.addChild("leg_l0", ModelPartBuilder.create().uv(0, 40).cuboid(0F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(4F, 20F, -3F));
		ModelPartData leg_r0Data = rootData.addChild("leg_r0", ModelPartBuilder.create().uv(14, 40).cuboid(-5F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(-4F, 20F, -3F));
		ModelPartData leg_l1Data = rootData.addChild("leg_l1", ModelPartBuilder.create().uv(0, 44).cuboid(0F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(4F, 20F, 0F));
		ModelPartData leg_r1Data = rootData.addChild("leg_r1", ModelPartBuilder.create().uv(14, 44).cuboid(-5F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(-4F, 20F, 0F));
		ModelPartData leg_l2Data = rootData.addChild("leg_l2", ModelPartBuilder.create().uv(0, 48).cuboid(0F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(4F, 20F, 3F));
		ModelPartData leg_r2Data = rootData.addChild("leg_r2", ModelPartBuilder.create().uv(14, 48).cuboid(-5F, -0.5F, -0.5F, 5F, 1F, 1F), ModelTransform.pivot(-4F, 20F, 3F));
		return TexturedModelData.of(data, 64, 64);
	}

	@Override
	public void setAngles(AmberBeetleEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE;
		head.pitch = headPitch * MathHelper.RADIANS_PER_DEGREE;

		// усики покачиваются, жвалы шевелятся
		float sway = MathHelper.sin(animationProgress * 0.12f) * 0.12f;
		antennaL.roll = 0.35f + sway;
		antennaR.roll = -0.35f - sway;
		float chew = MathHelper.sin(animationProgress * 0.3f) * 0.08f;
		mandibleL.yaw = -0.15f + chew;
		mandibleR.yaw = 0.15f - chew;

		// шесть ног: пары работают в противофазе, наклон вниз — roll
		for (int i = 0; i < 3; i++) {
			float phase = i * 1.05f;
			float swing = MathHelper.cos(limbAngle * 1.3f + phase) * 0.55f * limbDistance;
			float lift = Math.max(0f, MathHelper.sin(limbAngle * 1.3f + phase)) * 0.35f * limbDistance;
			float spread = (i - 1) * 0.25f;
			legsL[i].yaw = spread + swing;
			legsL[i].roll = 0.7f - lift;
			legsR[i].yaw = -spread + swing;
			legsR[i].roll = -0.7f + lift;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
