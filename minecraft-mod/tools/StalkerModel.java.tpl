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
	/*FIELDS*/

	public StalkerModel(ModelPart root) {
		this.root = root;
		/*ASSIGN*/
	}

	public static TexturedModelData getTexturedModelData() {
		ModelData data = new ModelData();
		ModelPartData r = data.getRoot();
		/*BUILD*/
		return TexturedModelData.of(data, /*TEXW*/, /*TEXH*/);
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
