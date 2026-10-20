package com.amberhall.mod;

import net.minecraft.block.BlockState;
import net.minecraft.entity.EntityType;
import net.minecraft.entity.ai.goal.ActiveTargetGoal;
import net.minecraft.entity.ai.goal.LookAroundGoal;
import net.minecraft.entity.ai.goal.LookAtEntityGoal;
import net.minecraft.entity.ai.goal.MeleeAttackGoal;
import net.minecraft.entity.ai.goal.RevengeGoal;
import net.minecraft.entity.ai.goal.SwimGoal;
import net.minecraft.entity.ai.goal.WanderAroundFarGoal;
import net.minecraft.entity.attribute.DefaultAttributeContainer;
import net.minecraft.entity.attribute.EntityAttributes;
import net.minecraft.entity.damage.DamageSource;
import net.minecraft.entity.mob.HostileEntity;
import net.minecraft.entity.player.PlayerEntity;
import net.minecraft.sound.SoundEvent;
import net.minecraft.sound.SoundEvents;
import net.minecraft.util.math.BlockPos;
import net.minecraft.util.math.Vec3d;
import net.minecraft.world.World;

/**
 * Сталкер: обычный ночной монстр Верхнего мира. Быстро и тихо подкрадывается к игроку,
 * но когда на него смотрят в упор, замедляется почти до шага.
 */
public class StalkerEntity extends HostileEntity {
	private static final double FAST = 0.31;
	private static final double WATCHED = 0.08;

	public StalkerEntity(EntityType<? extends HostileEntity> type, World world) {
		super(type, world);
		this.experiencePoints = 5;
	}

	public static DefaultAttributeContainer.Builder createAttributes() {
		return HostileEntity.createHostileAttributes()
			.add(EntityAttributes.GENERIC_MAX_HEALTH, 22.0)
			.add(EntityAttributes.GENERIC_MOVEMENT_SPEED, FAST)
			.add(EntityAttributes.GENERIC_ATTACK_DAMAGE, 4.0)
			.add(EntityAttributes.GENERIC_FOLLOW_RANGE, 32.0);
	}

	@Override
	protected void initGoals() {
		this.goalSelector.add(0, new SwimGoal(this));
		this.goalSelector.add(2, new MeleeAttackGoal(this, 1.0, false));
		this.goalSelector.add(5, new WanderAroundFarGoal(this, 0.8));
		this.goalSelector.add(6, new LookAtEntityGoal(this, PlayerEntity.class, 10.0f));
		this.goalSelector.add(6, new LookAroundGoal(this));
		this.targetSelector.add(1, new RevengeGoal(this));
		this.targetSelector.add(2, new ActiveTargetGoal<>(this, PlayerEntity.class, true));
	}

	@Override
	public void tickMovement() {
		super.tickMovement();
		if (!this.getWorld().isClient) {
			var speed = this.getAttributeInstance(EntityAttributes.GENERIC_MOVEMENT_SPEED);
			if (speed != null) {
				speed.setBaseValue(isWatched() ? WATCHED : FAST);
			}
		}
	}

	private boolean isWatched() {
		if (!(this.getTarget() instanceof PlayerEntity player) || this.distanceTo(player) < 2.5f) {
			return false;
		}
		Vec3d look = player.getRotationVec(1.0f).normalize();
		Vec3d toMe = this.getEyePos().subtract(player.getEyePos()).normalize();
		return look.dotProduct(toMe) > 0.94 && player.canSee(this);
	}

	@Override
	protected SoundEvent getAmbientSound() {
		return SoundEvents.ENTITY_HUSK_AMBIENT;
	}

	@Override
	protected SoundEvent getHurtSound(DamageSource source) {
		return SoundEvents.ENTITY_HUSK_HURT;
	}

	@Override
	protected SoundEvent getDeathSound() {
		return SoundEvents.ENTITY_HUSK_DEATH;
	}

	@Override
	protected void playStepSound(BlockPos pos, BlockState state) {
		this.playSound(SoundEvents.ENTITY_HUSK_STEP, 0.15f, 0.9f);
	}
}
