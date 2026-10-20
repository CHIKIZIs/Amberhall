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
		head.yaw += headYaw * MathHelper.RADIANS_PER_DEGREE;
		head.pitch += headPitch * MathHelper.RADIANS_PER_DEGREE;

		// ходьба как у зомби: противофазный шаг ног и рук
		float swing = MathHelper.cos(limbAngle * 0.6662f) * 1.3f * limbDistance;
		legL.pitch = swing;
		legR.pitch = -swing;
		body.yaw += swing * 0.12f;
		head.yaw -= swing * 0.12f;
		body.pitch += MathHelper.sin(age * 0.09f) * 0.02f;

		if (e.isAttacking()) {
			// руки вперёд, как у зомби, но когтистые, и покачиваются
			float claw = MathHelper.sin(age * 0.6f) * 0.1f;
			armL.pitch = -1.4f + claw;
			armR.pitch = -1.4f - claw;
		} else {
			float sway = MathHelper.sin(age * 0.07f) * 0.04f;
			armL.pitch += -swing * 0.6f + sway;
			armR.pitch += swing * 0.6f - sway;
			armL.roll += 0.02f + MathHelper.sin(age * 0.09f) * 0.02f;
			armR.roll -= 0.02f + MathHelper.sin(age * 0.09f) * 0.02f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
