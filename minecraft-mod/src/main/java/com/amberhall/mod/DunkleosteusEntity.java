package com.amberhall.mod;

import net.minecraft.entity.Entity;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.LivingEntity;
import net.minecraft.entity.MovementType;
import net.minecraft.entity.ai.control.AquaticMoveControl;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.RevengeGoal;
import net.minecraft.entity.ai.goal.SwimAroundGoal;
import net.minecraft.entity.ai.pathing.EntityNavigation;
import net.minecraft.entity.ai.pathing.SwimNavigation;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * Бронированная доисторическая рыба: хищник глубин океана. Бросается на игрока, кусает тяжело
 * и вместе с уроном замедляет жертву. На суше задыхается, как рыба.
 */
public class DunkleosteusEntity extends HostileEntity {
	public DunkleosteusEntity(EntityType<? extends DunkleosteusEntity> type, World world) {
		super(type, world);
		this.moveControl = new AquaticMoveControl(this, 85, 10, 0.025f, 0.1f, true);
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return HostileEntity.createHostileAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 40.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, 1.0)
			.add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 8.0)
			.add(EntityAttributes.GENERIC_ARMOR, 6.0)
			.add(EntityAttributes.GENERIC_FOLLOW_RANGE, 28.0);
	}

	@Override
	protected EntityNavigation createNavigation(World world) {
		return new SwimNavigation(this, world);
	}

	@Override
	protected void initGoals() {
		this.goalSelector.add(0, new MeleeAttackGoal(this, 1.4, true));
		this.goalSelector.add(1, new SwimAroundGoal(this, 1.0, 30));
		this.goalSelector.add(2, new LookAtEntityGoal(this, PlayerEntity.class, 10.0f));
		this.targetSelector.add(1, new RevengeGoal(this));
		this.targetSelector.add(2, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
	}

	@Override
	public boolean tryAttack(Entity target) {
		boolean hit = super.tryAttack(target);
		if (hit && target instanceof LivingEntity living) {
			living.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 80, 1), this);
		}
		return hit;
	}

	@Override
	public void baseTick() {
		int air = this.getAir();
		super.baseTick();
		// вне воды рыба задыхается
		if (this.isAlive() && !this.isInsideWaterOrBubbleColumn()) {
			this.setAir(air - 1);
			if (this.getAir() == -20) {
				this.setAir(0);
				this.damage(this.getDamageSources().drown(), 2.0f);
			}
		} else {
			this.setAir(this.getMaxAir());
		}
	}

	@Override
	public void travel(Vec3d movementInput) {
		if (this.isLogicalSideForUpdatingMovement() && this.isTouchingWater()) {
			this.updateVelocity(this.getMovementSpeed(), movementInput);
			this.move(MovementType.SELF, this.getVelocity());
			this.setVelocity(this.getVelocity().multiply(0.9));
			if (this.getTarget() == null) {
				this.setVelocity(this.getVelocity().add(0.0, -0.005, 0.0));
			}
		} else {
			super.travel(movementInput);
		}
	}

	@Override
	protected SoundEvent getAmbientSound() {
		return this.isTouchingWater() ? SoundEvents.ENTITY_GUARDIAN_AMBIENT : SoundEvents.ENTITY_GUARDIAN_AMBIENT_LAND;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return this.isTouchingWater() ? SoundEvents.ENTITY_GUARDIAN_HURT : SoundEvents.ENTITY_GUARDIAN_HURT_LAND;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return this.isTouchingWater() ? SoundEvents.ENTITY_GUARDIAN_DEATH : SoundEvents.ENTITY_GUARDIAN_DEATH_LAND;
	}
}
