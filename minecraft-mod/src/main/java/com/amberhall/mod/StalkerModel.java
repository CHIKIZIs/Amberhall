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

/** Модель сталкера. Части и текстура генерируются скриптом tools/stalker_gen.py (шаблон — tools/StalkerModel.java.tpl). */
public class StalkerModel extends SinglePartEntityModel<StalkerEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("stalker"), "main");

	private final ModelPart root;
	private final ModelPart torso;
	private final ModelPart chest;
	private final ModelPart ribA;
	private final ModelPart ribB;
	private final ModelPart ribC;
	private final ModelPart spineA;
	private final ModelPart spineB;
	private final ModelPart spineC;
	private final ModelPart padL;
	private final ModelPart padR;
	private final ModelPart neck;
	private final ModelPart head;
	private final ModelPart brow;
	private final ModelPart jaw;
	private final ModelPart hornL;
	private final ModelPart hornL2;
	private final ModelPart earL;
	private final ModelPart hornR;
	private final ModelPart hornR2;
	private final ModelPart earR;
	private final ModelPart armL;
	private final ModelPart forearmL;
	private final ModelPart handL;
	private final ModelPart clawL0;
	private final ModelPart clawL1;
	private final ModelPart clawL2;
	private final ModelPart thighL;
	private final ModelPart shinL;
	private final ModelPart footL;
	private final ModelPart armR;
	private final ModelPart forearmR;
	private final ModelPart handR;
	private final ModelPart clawR0;
	private final ModelPart clawR1;
	private final ModelPart clawR2;
	private final ModelPart thighR;
	private final ModelPart shinR;
	private final ModelPart footR;
	private final ModelPart ragF;
	private final ModelPart ragB;

	public StalkerModel(ModelPart root) {
		this.root = root;
		this.torso = root.getChild("torso");
		this.chest = this.torso.getChild("chest");
		this.ribA = this.chest.getChild("rib_a");
		this.ribB = this.chest.getChild("rib_b");
		this.ribC = this.chest.getChild("rib_c");
		this.spineA = this.chest.getChild("spine_a");
		this.spineB = this.chest.getChild("spine_b");
		this.spineC = this.chest.getChild("spine_c");
		this.padL = this.chest.getChild("pad_l");
		this.padR = this.chest.getChild("pad_r");
		this.neck = this.chest.getChild("neck");
		this.head = this.neck.getChild("head");
		this.brow = this.head.getChild("brow");
		this.jaw = this.head.getChild("jaw");
		this.hornL = this.head.getChild("horn_l");
		this.hornL2 = this.hornL.getChild("horn_l2");
		this.earL = this.head.getChild("ear_l");
		this.hornR = this.head.getChild("horn_r");
		this.hornR2 = this.hornR.getChild("horn_r2");
		this.earR = this.head.getChild("ear_r");
		this.armL = this.chest.getChild("arm_l");
		this.forearmL = this.armL.getChild("forearm_l");
		this.handL = this.forearmL.getChild("hand_l");
		this.clawL0 = this.handL.getChild("claw_l0");
		this.clawL1 = this.handL.getChild("claw_l1");
		this.clawL2 = this.handL.getChild("claw_l2");
		this.thighL = root.getChild("thigh_l");
		this.shinL = this.thighL.getChild("shin_l");
		this.footL = this.shinL.getChild("foot_l");
		this.armR = this.chest.getChild("arm_r");
		this.forearmR = this.armR.getChild("forearm_r");
		this.handR = this.forearmR.getChild("hand_r");
		this.clawR0 = this.handR.getChild("claw_r0");
		this.clawR1 = this.handR.getChild("claw_r1");
		this.clawR2 = this.handR.getChild("claw_r2");
		this.thighR = root.getChild("thigh_r");
		this.shinR = this.thighR.getChild("shin_r");
		this.footR = this.shinR.getChild("foot_r");
		this.ragF = this.torso.getChild("rag_f");
		this.ragB = this.torso.getChild("rag_b");
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		ModelPartData torsoD = r.addChild("torso", ModelPartBuilder.create().uv(74, 0).cuboid(-3F, -5F, -2F, 6F, 5F, 4F), ModelTransform.of(0F, 13F, 0F, 0.15F, 0F, 0F));
		ModelPartData chestD = torsoD.addChild("chest", ModelPartBuilder.create().uv(26, 0).cuboid(-4F, -7F, -2F, 8F, 7F, 4F), ModelTransform.of(0F, -5F, 0F, 0.15F, 0F, 0F));
		ModelPartData ribAD = chestD.addChild("rib_a", ModelPartBuilder.create().uv(12, 27).cuboid(-3F, 0F, -1F, 6F, 1F, 1F), ModelTransform.pivot(0F, -6F, -2F));
		ModelPartData ribBD = chestD.addChild("rib_b", ModelPartBuilder.create().uv(26, 27).cuboid(-3F, 0F, -1F, 6F, 1F, 1F), ModelTransform.pivot(0F, -4F, -2F));
		ModelPartData ribCD = chestD.addChild("rib_c", ModelPartBuilder.create().uv(40, 27).cuboid(-3F, 0F, -1F, 6F, 1F, 1F), ModelTransform.pivot(0F, -2F, -2F));
		ModelPartData spineAD = chestD.addChild("spine_a", ModelPartBuilder.create().uv(54, 21).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -6.5F, 2F, 0.55F, 0F, 0F));
		ModelPartData spineBD = chestD.addChild("spine_b", ModelPartBuilder.create().uv(58, 21).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -4F, 2F, 0.45F, 0F, 0F));
		ModelPartData spineCD = chestD.addChild("spine_c", ModelPartBuilder.create().uv(8, 27).cuboid(-0.5F, -2F, -0.5F, 1F, 2F, 1F), ModelTransform.of(0F, -1.5F, 2F, 0.35F, 0F, 0F));
		ModelPartData padLD = chestD.addChild("pad_l", ModelPartBuilder.create().uv(74, 12).cuboid(-1.5F, -1.5F, -2F, 4F, 2F, 4F), ModelTransform.of(4.5F, -6.5F, 0F, 0F, 0F, -0.25F));
		ModelPartData padRD = chestD.addChild("pad_r", ModelPartBuilder.create().uv(90, 12).cuboid(-2.5F, -1.5F, -2F, 4F, 2F, 4F), ModelTransform.of(-4.5F, -6.5F, 0F, 0F, 0F, 0.25F));
		ModelPartData neckD = chestD.addChild("neck", ModelPartBuilder.create().uv(38, 21).cuboid(-1F, -3F, -1F, 2F, 3F, 2F), ModelTransform.of(0F, -6.5F, -0.5F, -0.1F, 0F, 0F));
		ModelPartData headD = neckD.addChild("head", ModelPartBuilder.create().uv(0, 0).cuboid(-3.5F, -6F, -4F, 7F, 6F, 6F), ModelTransform.of(0F, -3F, 0F, 0.25F, 0F, 0F));
		ModelPartData browD = headD.addChild("brow", ModelPartBuilder.create().uv(94, 21).cuboid(-4F, -0.5F, -1.5F, 8F, 1F, 2F), ModelTransform.pivot(0F, -4.5F, -4F));
		ModelPartData jawD = headD.addChild("jaw", ModelPartBuilder.create().uv(36, 12).cuboid(-3F, 0F, -5.5F, 6F, 2F, 5F), ModelTransform.pivot(0F, 0F, 0.5F));
		ModelPartData hornLD = headD.addChild("horn_l", ModelPartBuilder.create().uv(46, 21).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(2.5F, -6F, -1F, -0.4F, 0F, 0.5F));
		ModelPartData hornL2D = hornLD.addChild("horn_l2", ModelPartBuilder.create().uv(62, 21).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -4F, 0F, -0.6F, 0F, 0.3F));
		ModelPartData earLD = headD.addChild("ear_l", ModelPartBuilder.create().uv(114, 21).cuboid(0F, -1F, -0.5F, 3F, 2F, 1F), ModelTransform.of(3.5F, -3.5F, 0F, 0F, 0.3F, 0.6F));
		ModelPartData hornRD = headD.addChild("horn_r", ModelPartBuilder.create().uv(50, 21).cuboid(-0.5F, -4F, -0.5F, 1F, 4F, 1F), ModelTransform.of(-2.5F, -6F, -1F, -0.4F, 0F, -0.5F));
		ModelPartData hornR2D = hornRD.addChild("horn_r2", ModelPartBuilder.create().uv(66, 21).cuboid(-0.5F, -3F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, -4F, 0F, -0.6F, 0F, -0.3F));
		ModelPartData earRD = headD.addChild("ear_r", ModelPartBuilder.create().uv(0, 27).cuboid(-3F, -1F, -0.5F, 3F, 2F, 1F), ModelTransform.of(-3.5F, -3.5F, 0F, 0F, -0.3F, -0.6F));
		ModelPartData armLD = chestD.addChild("arm_l", ModelPartBuilder.create().uv(50, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 7F, 3F), ModelTransform.of(5.5F, -5.5F, 0F, 0.05F, 0F, -0.07F));
		ModelPartData forearmLD = armLD.addChild("forearm_l", ModelPartBuilder.create().uv(118, 0).cuboid(-1F, 0F, -1F, 2F, 7F, 2F), ModelTransform.of(0F, 7F, 0F, -0.35F, 0F, 0F));
		ModelPartData handLD = forearmLD.addChild("hand_l", ModelPartBuilder.create().uv(14, 21).cuboid(-1.5F, 0F, -1.5F, 3F, 2F, 3F), ModelTransform.of(0F, 7F, 0F, 0.1F, 0F, 0F));
		ModelPartData clawL0D = handLD.addChild("claw_l0", ModelPartBuilder.create().uv(70, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-1F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData clawL1D = handLD.addChild("claw_l1", ModelPartBuilder.create().uv(74, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData clawL2D = handLD.addChild("claw_l2", ModelPartBuilder.create().uv(78, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(1F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData thighLD = r.addChild("thigh_l", ModelPartBuilder.create().uv(94, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 6F, 3F), ModelTransform.of(2.5F, 13F, 0F, -0.35F, 0F, 0F));
		ModelPartData shinLD = thighLD.addChild("shin_l", ModelPartBuilder.create().uv(58, 12).cuboid(-1F, 0F, -1F, 2F, 5F, 2F), ModelTransform.of(0F, 6F, 0F, 0.7F, 0F, 0F));
		ModelPartData footLD = shinLD.addChild("foot_l", ModelPartBuilder.create().uv(106, 12).cuboid(-1.5F, -1F, -3F, 3F, 2F, 4F), ModelTransform.of(0F, 5F, 0F, -0.35F, 0F, 0F));
		ModelPartData armRD = chestD.addChild("arm_r", ModelPartBuilder.create().uv(62, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 7F, 3F), ModelTransform.of(-5.5F, -5.5F, 0F, 0.05F, 0F, 0.07F));
		ModelPartData forearmRD = armRD.addChild("forearm_r", ModelPartBuilder.create().uv(0, 12).cuboid(-1F, 0F, -1F, 2F, 7F, 2F), ModelTransform.of(0F, 7F, 0F, -0.35F, 0F, 0F));
		ModelPartData handRD = forearmRD.addChild("hand_r", ModelPartBuilder.create().uv(26, 21).cuboid(-1.5F, 0F, -1.5F, 3F, 2F, 3F), ModelTransform.of(0F, 7F, 0F, 0.1F, 0F, 0F));
		ModelPartData clawR0D = handRD.addChild("claw_r0", ModelPartBuilder.create().uv(82, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(-1F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData clawR1D = handRD.addChild("claw_r1", ModelPartBuilder.create().uv(86, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(0F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData clawR2D = handRD.addChild("claw_r2", ModelPartBuilder.create().uv(90, 21).cuboid(-0.5F, 0F, -0.5F, 1F, 3F, 1F), ModelTransform.of(1F, 2F, -1F, 0.25F, 0F, 0F));
		ModelPartData thighRD = r.addChild("thigh_r", ModelPartBuilder.create().uv(106, 0).cuboid(-1.5F, 0F, -1.5F, 3F, 6F, 3F), ModelTransform.of(-2.5F, 13F, 0F, -0.35F, 0F, 0F));
		ModelPartData shinRD = thighRD.addChild("shin_r", ModelPartBuilder.create().uv(66, 12).cuboid(-1F, 0F, -1F, 2F, 5F, 2F), ModelTransform.of(0F, 6F, 0F, 0.7F, 0F, 0F));
		ModelPartData footRD = shinRD.addChild("foot_r", ModelPartBuilder.create().uv(0, 21).cuboid(-1.5F, -1F, -3F, 3F, 2F, 4F), ModelTransform.of(0F, 5F, 0F, -0.35F, 0F, 0F));
		ModelPartData ragFD = torsoD.addChild("rag_f", ModelPartBuilder.create().uv(8, 12).cuboid(-3F, 0F, -0.5F, 6F, 7F, 1F), ModelTransform.of(0F, -0.5F, -2.2F, -0.3F, 0F, 0F));
		ModelPartData ragBD = torsoD.addChild("rag_b", ModelPartBuilder.create().uv(22, 12).cuboid(-3F, 0F, -0.5F, 6F, 7F, 1F), ModelTransform.of(0F, -0.5F, 2.2F, -0.3F, 0F, 0F));
		return TexturedModelData.of(data, 128, 64);
	}

	@Override
	public void setAngles(StalkerEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		float yawR = headYaw * MathHelper.RADIANS_PER_DEGREE;
		float pitchR = headPitch * MathHelper.RADIANS_PER_DEGREE;
		neck.yaw += yawR * 0.4f;
		neck.pitch += pitchR * 0.4f;
		head.yaw += yawR * 0.6f;
		head.pitch += pitchR * 0.6f;

		// шаг: цифровой ход — бедро вперёд-назад, голень и стопа компенсируют
		float swing = MathHelper.cos(limbAngle * 0.6662f) * 1.1f * limbDistance;
		float swingR = MathHelper.cos(limbAngle * 0.6662f + MathHelper.PI) * 1.1f * limbDistance;
		float liftL = Math.max(0f, MathHelper.sin(limbAngle * 0.6662f)) * 0.9f * limbDistance;
		float liftR = Math.max(0f, -MathHelper.sin(limbAngle * 0.6662f)) * 0.9f * limbDistance;
		thighL.pitch += swing;
		thighR.pitch += swingR;
		shinL.pitch += liftL;
		shinR.pitch += liftR;
		footL.pitch -= liftL * 0.6f;
		footR.pitch -= liftR * 0.6f;

		// туловище покачивается в такт шагу, дышит в покое
		float breathe = MathHelper.sin(age * 0.09f) * 0.025f;
		chest.pitch += breathe + MathHelper.cos(limbAngle * 1.3324f) * 0.05f * limbDistance;
		torso.yaw += MathHelper.cos(limbAngle * 0.6662f) * 0.18f * limbDistance;
		chest.yaw -= MathHelper.cos(limbAngle * 0.6662f) * 0.25f * limbDistance;
		ragF.pitch += swing * 0.25f;
		ragB.pitch -= swing * 0.25f;

		if (e.isAttacking()) {
			// руки вскинуты вперёд, пасть открыта, клыки наружу
			float claw = MathHelper.sin(age * 0.6f) * 0.12f;
			armL.pitch = -1.35f + claw;
			armR.pitch = -1.35f - claw;
			forearmL.pitch = -0.5f;
			forearmR.pitch = -0.5f;
			jaw.pitch += 0.55f + MathHelper.sin(age * 0.8f) * 0.08f;
			head.pitch -= 0.15f;
		} else {
			// руки висят и чуть раскачиваются, когти шевелятся
			float armSwing = MathHelper.cos(limbAngle * 0.6662f) * 0.7f * limbDistance;
			float sway = MathHelper.sin(age * 0.07f) * 0.04f;
			armL.pitch += -armSwing + sway;
			armR.pitch += armSwing - sway;
			armL.roll += MathHelper.sin(age * 0.09f) * 0.02f;
			armR.roll -= MathHelper.sin(age * 0.09f) * 0.02f;
			jaw.pitch += 0.06f + MathHelper.sin(age * 0.07f) * 0.04f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
