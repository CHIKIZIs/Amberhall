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
 * Модель янтарного жука. Части и текстура генерируются скриптом tools/beetle_gen.py,
 * исходник для Blockbench лежит в blockbench/amber_beetle.bbmodel.
 */
public class AmberBeetleModel extends SinglePartEntityModel<AmberBeetleEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("amber_beetle"), "main");

	private final ModelPart root;
	private final ModelPart head;
	private final ModelPart antennaL, antennaL2, antennaR, antennaR2;
	private final ModelPart mandibleL, mandibleR;
	private final ModelPart elytraL, elytraR;
	private final ModelPart[] legsL = new ModelPart[3];
	private final ModelPart[] legsR = new ModelPart[3];
	private final ModelPart[] lowL = new ModelPart[3];
	private final ModelPart[] lowR = new ModelPart[3];

	public AmberBeetleModel(ModelPart root) {
		this.root = root;
		this.head = root.getChild("head");
		this.antennaL = head.getChild("antenna_l");
		this.antennaL2 = antennaL.getChild("antenna_l2");
		this.antennaR = head.getChild("antenna_r");
		this.antennaR2 = antennaR.getChild("antenna_r2");
		this.mandibleL = head.getChild("mandible_l");
		this.mandibleR = head.getChild("mandible_r");
		this.elytraL = root.getChild("elytra_l");
		this.elytraR = root.getChild("elytra_r");
		for (int i = 0; i < 3; i++) {
			legsL[i] = root.getChild("leg_l" + i);
			legsR[i] = root.getChild("leg_r" + i);
			lowL[i] = legsL[i].getChild("leg_l" + i + "_low");
			lowR[i] = legsR[i].getChild("leg_r" + i + "_low");
		}
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData rootData = data.getRoot();
		ModelPartData bodyData = rootData.addChild("body", ModelPartBuilder.create().uv(0, 0).cuboid(-3.5F, -3F, -3F, 7F, 5F, 8F), ModelTransform.pivot(0F, 20F, 1F));
		ModelPartData abdomenData = bodyData.addChild("abdomen", ModelPartBuilder.create().uv(0, 13).cuboid(-2.5F, -2.5F, 5F, 5F, 4F, 3F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData thoraxData = rootData.addChild("thorax", ModelPartBuilder.create().uv(102, 0).cuboid(-3F, -3.5F, -3F, 6F, 5F, 3F), ModelTransform.pivot(0F, 20F, -2F));
		ModelPartData headData = rootData.addChild("head", ModelPartBuilder.create().uv(82, 0).cuboid(-3F, -2F, -4F, 6F, 4F, 4F), ModelTransform.pivot(0F, 20.5F, -5F));
		ModelPartData eye_lData = headData.addChild("eye_l", ModelPartBuilder.create().uv(80, 13).cuboid(3F, -1.5F, -3.5F, 1F, 2F, 2F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData eye_rData = headData.addChild("eye_r", ModelPartBuilder.create().uv(86, 13).cuboid(-4F, -1.5F, -3.5F, 1F, 2F, 2F), ModelTransform.pivot(0F, 0F, 0F));
		ModelPartData mandible_lData = headData.addChild("mandible_l", ModelPartBuilder.create().uv(64, 13).cuboid(0F, -0.5F, -3F, 1F, 1F, 3F), ModelTransform.of(1.2F, 1F, -4F, 0F, 0.15F, 0F));
		ModelPartData mandible_rData = headData.addChild("mandible_r", ModelPartBuilder.create().uv(72, 13).cuboid(-1F, -0.5F, -3F, 1F, 1F, 3F), ModelTransform.of(-1.2F, 1F, -4F, 0F, -0.15F, 0F));
		ModelPartData antenna_lData = headData.addChild("antenna_l", ModelPartBuilder.create().uv(92, 13).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(2F, -1.5F, -3.5F, -0.7F, 0F, -0.35F));
		ModelPartData antenna_l2Data = antenna_lData.addChild("antenna_l2", ModelPartBuilder.create().uv(96, 13).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -3F, 0F, -0.55F, 0F, -0.2F));
		ModelPartData antenna_rData = headData.addChild("antenna_r", ModelPartBuilder.create().uv(100, 13).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-2F, -1.5F, -3.5F, -0.7F, 0F, 0.35F));
		ModelPartData antenna_r2Data = antenna_rData.addChild("antenna_r2", ModelPartBuilder.create().uv(104, 13).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -3F, 0F, -0.55F, 0F, 0.2F));
		ModelPartData elytra_lData = rootData.addChild("elytra_l", ModelPartBuilder.create().uv(30, 0).cuboid(0F, -2F, 0F, 3.8F, 3F, 9F), ModelTransform.of(0.2F, 17F, -2F, 0F, 0F, -0.07F));
		ModelPartData elytra_rData = rootData.addChild("elytra_r", ModelPartBuilder.create().uv(56, 0).cuboid(-3.8F, -2F, 0F, 3.8F, 3F, 9F), ModelTransform.of(-0.2F, 17F, -2F, 0F, 0F, 0.07F));
		ModelPartData crystal_aData = rootData.addChild("crystal_a", ModelPartBuilder.create().uv(16, 13).cuboid(-1F, -4F, -1F, 2F, 4F, 2F), ModelTransform.of(0F, 15.4F, 0.5F, -0.25F, 0F, 0F));
		ModelPartData crystal_bData = rootData.addChild("crystal_b", ModelPartBuilder.create().uv(24, 13).cuboid(-0.75F, -3F, -0.75F, 1.5F, 3F, 1.5F), ModelTransform.of(1.4F, 15.6F, 3.5F, 0.15F, 0F, 0.35F));
		ModelPartData crystal_cData = rootData.addChild("crystal_c", ModelPartBuilder.create().uv(32, 13).cuboid(-0.75F, -2.5F, -0.75F, 1.5F, 2.5F, 1.5F), ModelTransform.of(-1.4F, 15.6F, 4F, 0.2F, 0F, -0.4F));
		ModelPartData leg_l0Data = rootData.addChild("leg_l0", ModelPartBuilder.create().uv(108, 13).cuboid(0F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(3F, 21.5F, -2.5F, 0F, 0F, -0.25F));
		ModelPartData leg_l0_lowData = leg_l0Data.addChild("leg_l0_low", ModelPartBuilder.create().uv(40, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(3.5F, 0F, 0F, 0F, 0F, -0.45F));
		ModelPartData leg_r0Data = rootData.addChild("leg_r0", ModelPartBuilder.create().uv(118, 13).cuboid(-3.5F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(-3F, 21.5F, -2.5F, 0F, 0F, 0.25F));
		ModelPartData leg_r0_lowData = leg_r0Data.addChild("leg_r0_low", ModelPartBuilder.create().uv(44, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(-3.5F, 0F, 0F, 0F, 0F, 0.45F));
		ModelPartData leg_l1Data = rootData.addChild("leg_l1", ModelPartBuilder.create().uv(0, 20).cuboid(0F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(3F, 21.5F, 0.5F, 0F, 0F, -0.25F));
		ModelPartData leg_l1_lowData = leg_l1Data.addChild("leg_l1_low", ModelPartBuilder.create().uv(48, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(3.5F, 0F, 0F, 0F, 0F, -0.45F));
		ModelPartData leg_r1Data = rootData.addChild("leg_r1", ModelPartBuilder.create().uv(10, 20).cuboid(-3.5F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(-3F, 21.5F, 0.5F, 0F, 0F, 0.25F));
		ModelPartData leg_r1_lowData = leg_r1Data.addChild("leg_r1_low", ModelPartBuilder.create().uv(52, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(-3.5F, 0F, 0F, 0F, 0F, 0.45F));
		ModelPartData leg_l2Data = rootData.addChild("leg_l2", ModelPartBuilder.create().uv(20, 20).cuboid(0F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(3F, 21.5F, 3.5F, 0F, 0F, -0.25F));
		ModelPartData leg_l2_lowData = leg_l2Data.addChild("leg_l2_low", ModelPartBuilder.create().uv(56, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(3.5F, 0F, 0F, 0F, 0F, -0.45F));
		ModelPartData leg_r2Data = rootData.addChild("leg_r2", ModelPartBuilder.create().uv(30, 20).cuboid(-3.5F, -0.5F, -0.5F, 3.5F, 1F, 1F), ModelTransform.of(-3F, 21.5F, 3.5F, 0F, 0F, 0.25F));
		ModelPartData leg_r2_lowData = leg_r2Data.addChild("leg_r2_low", ModelPartBuilder.create().uv(60, 13).cuboid(-0.5F, 0F, -0.5F, 1F, 3.5F, 1F), ModelTransform.of(-3.5F, 0F, 0F, 0F, 0F, 0.45F));
		return TexturedModelData.of(data, 128, 64);
	}

	@Override
	public void setAngles(AmberBeetleEntity entity, float limbAngle, float limbDistance, float animationProgress, float headYaw, float headPitch) {
		head.yaw = headYaw * MathHelper.RADIANS_PER_DEGREE * 0.8f;
		head.pitch = headPitch * MathHelper.RADIANS_PER_DEGREE * 0.8f;

		// усики: два сустава покачиваются вразнобой
		float sway = MathHelper.sin(animationProgress * 0.11f) * 0.12f;
		float sway2 = MathHelper.sin(animationProgress * 0.11f + 1.2f) * 0.18f;
		antennaL.roll = -0.35f + sway;
		antennaR.roll = 0.35f - sway;
		antennaL2.roll = -0.2f + sway2;
		antennaR2.roll = 0.2f - sway2;
		antennaL.pitch = antennaR.pitch = -0.7f + MathHelper.sin(animationProgress * 0.07f) * 0.08f;

		// жвалы щёлкают
		float chew = MathHelper.sin(animationProgress * 0.28f) * 0.1f;
		mandibleL.yaw = 0.15f - chew;
		mandibleR.yaw = -0.15f + chew;

		// надкрылья чуть «дышат»
		float breathe = MathHelper.sin(animationProgress * 0.09f) * 0.025f;
		elytraL.roll = -0.07f - breathe;
		elytraR.roll = 0.07f + breathe;

		// ходьба «треногой»: ноги 0 и 2 с одной стороны работают в фазе с ногой 1 с другой
		for (int i = 0; i < 3; i++) {
			float phase = (i % 2 == 0 ? 0f : MathHelper.PI);
			float swing = MathHelper.cos(limbAngle * 1.5f + phase) * 0.5f * limbDistance;
			float lift = Math.max(0f, MathHelper.sin(limbAngle * 1.5f + phase)) * 0.45f * limbDistance;
			float spread = (i - 1) * 0.35f;
			legsL[i].yaw = spread + swing;
			legsR[i].yaw = -spread + swing;
			legsL[i].roll = -0.3f - lift;
			legsR[i].roll = 0.3f + lift;
			lowL[i].roll = -0.35f + lift * 0.8f;
			lowR[i].roll = 0.35f - lift * 0.8f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
