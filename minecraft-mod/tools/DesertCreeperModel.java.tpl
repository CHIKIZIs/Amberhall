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

/** Модель пустынного крипера (обугленный колючий кактус). Части и текстура генерируются tools/desert_creeper_gen.py (шаблон — tools/DesertCreeperModel.java.tpl). */
public class DesertCreeperModel extends SinglePartEntityModel<DesertCreeperEntity> {
	public static final EntityModelLayer LAYER = new EntityModelLayer(AmberhallMod.id("desert_creeper"), "main");

	private final ModelPart root;
	/*FIELDS*/

	public DesertCreeperModel(ModelPart root) {
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
	public void setAngles(DesertCreeperEntity e, float limbAngle, float limbDistance, float age, float headYaw, float headPitch) {
		this.root.traverse().forEach(ModelPart::resetTransform);
		trunk.yaw += headYaw * MathHelper.RADIANS_PER_DEGREE * 0.4f;
		trunk.pitch += headPitch * MathHelper.RADIANS_PER_DEGREE * 0.25f;
		// семенящий шаг лапами, ствол раскачивается
		float swing = MathHelper.cos(limbAngle * 0.9f) * 1.0f * limbDistance;
		footL.pitch = swing;
		footR.pitch = -swing;
		trunk.roll += MathHelper.cos(limbAngle * 0.9f) * 0.08f * limbDistance;
		// руки подняты, как когтистые ветви; подрагивают
		float tremble = MathHelper.sin(age * 0.5f) * 0.05f;
		armL.roll += 0.1f + tremble;
		armR.roll -= 0.1f + tremble;
		armLUp.roll += tremble;
		armRUp.roll -= tremble;
		if (e.isAttacking() || e.getFuseSpeed() > 0) {
			armLUp.pitch -= 0.5f;
			armRUp.pitch -= 0.5f;
		}
	}

	@Override
	public ModelPart getPart() {
		return root;
	}
}
