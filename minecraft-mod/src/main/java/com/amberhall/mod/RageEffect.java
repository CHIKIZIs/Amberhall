package com.amberhall.mod;

import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.attribute.EntityAttributeModifier;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.effect.StatusEffect;
import net.minecraft.entity.effect.StatusEffectCategory;
import net.minecraft.entity.mob.MobEntity;

/**
 * Бешенство: больше урона и скорости. Раз в полсекунды заставляет моба выбрать ближайшую жертву,
 * даже если по характеру он мирный или нейтральный.
 */
public class RageEffect extends StatusEffect {
	public RageEffect() {
		super(StatusEffectCategory.NEUTRAL, 0xC0301A);
		this.addAttributeModifier(EntityAttributes.GENERIC_ATTACK_DAMAGE, AmberhallMod.id("effect.rage_damage"),
			3.0, EntityAttributeModifier.Operation.ADD_VALUE);
		this.addAttributeModifier(EntityAttributes.GENERIC_MOVEMENT_SPEED, AmberhallMod.id("effect.rage_speed"),
			0.25, EntityAttributeModifier.Operation.ADD_MULTIPLIED_TOTAL);
	}

	@Override
	public boolean canApplyUpdateEffect(int duration, int amplifier) {
		return duration % 10 == 0;
	}

	@Override
	public boolean applyUpdateEffect(LivingEntity entity, int amplifier) {
		if (entity.getWorld().isClient || !(entity instanceof MobEntity mob) || RageGoal.needsGoal(mob)) {
			return true;
		}
		LivingEntity current = mob.getTarget();
		if (current == null || !current.isAlive()) {
			LivingEntity next = RageGoal.findTarget(mob);
			if (next != null) {
				mob.setTarget(next);
			}
		}
		return true;
	}
}
