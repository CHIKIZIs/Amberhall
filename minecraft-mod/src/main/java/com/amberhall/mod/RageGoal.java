package com.amberhall.mod;

import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.decoration.ArmorStandEntity;
import net.minecraft.entity.ai.goal.Goal;
import net.minecraft.entity.mob.MobEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.util.Hand;

/**
 * Цель для мирных мобов (у которых нет ни атаки, ни боевых целей): пока на них действует «Бешенство»,
 * они бегут к ближайшему живому существу и кусают его. Мобы, которые и так умеют драться,
 * получают цель через {@link RageEffect}, а дерутся своими обычными целями.
 */
public class RageGoal extends Goal {
	private static final double RANGE = 14.0;
	private static final float DAMAGE = 4.0f;

	private final MobEntity mob;
	private LivingEntity target;
	private int cooldown;
	private int repath;

	public RageGoal(MobEntity mob) {
		this.mob = mob;
		this.setControls(EnumSet.of(Control.MOVE, Control.LOOK));
	}

	/** Ближайшая подходящая жертва (не наблюдатель, не творческий игрок, не стойка для брони). */
	public static LivingEntity findTarget(MobEntity mob) {
		List<LivingEntity> list = mob.getWorld().getEntitiesByClass(LivingEntity.class,
			mob.getBoundingBox().expand(RANGE), e -> e != mob && e.isAlive() && !(e instanceof ArmorStandEntity)
				&& !(e instanceof PlayerEntity p && (p.isCreative() || p.isSpectator())));
		return list.stream().min(Comparator.comparingDouble(mob::squaredDistanceTo)).orElse(null);
	}

	/** Мобы без атрибута урона (коровы, жители, куры…) сами драться не умеют. */
	public static boolean needsGoal(MobEntity mob) {
		return mob.getAttributeInstance(EntityAttributes.GENERIC_ATTACK_DAMAGE) == null;
	}

	@Override
	public boolean canStart() {
		if (!mob.hasStatusEffect(ModEffects.RAGE)) {
			return false;
		}
		this.target = findTarget(mob);
		return this.target != null;
	}

	@Override
	public boolean shouldContinue() {
		return mob.hasStatusEffect(ModEffects.RAGE) && target != null && target.isAlive()
			&& mob.squaredDistanceTo(target) < RANGE * RANGE * 1.5;
	}

	@Override
	public void start() {
		this.repath = 0;
	}

	@Override
	public void stop() {
		mob.getNavigation().stop();
		this.target = null;
	}

	@Override
	public boolean shouldRunEveryTick() {
		return true;
	}

	@Override
	public void tick() {
		mob.getLookControl().lookAt(target, 30.0f, 30.0f);
		if (--repath <= 0) {
			repath = 8;
			mob.getNavigation().startMovingTo(target, 1.5);
		}
		if (cooldown > 0) {
			cooldown--;
		}
		double reach = mob.getWidth() * 2.0f * mob.getWidth() * 2.0f + target.getWidth() + 1.5;
		if (cooldown == 0 && mob.squaredDistanceTo(target) <= reach) {
			cooldown = 20;
			mob.swingHand(Hand.MAIN_HAND);
			target.damage(mob.getDamageSources().mobAttack(mob), DAMAGE);
		}
	}
}
